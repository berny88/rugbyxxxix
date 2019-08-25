# -*- coding: utf-8 -*-
import logging

from datetime import datetime
from flask import Blueprint, jsonify

from tools.Tools import DbManager, BetProjectClass
from users.UserServices import UserManager

logger = logging.getLogger(__name__)

bets_page = Blueprint('bets_page', __name__,
                      template_folder='templates', static_folder='static')


@bets_page.route('/betslist', methods=['GET'])
def bets():
    return bets_page.send_static_file('bets.html')

@bets_page.route('/apiv1.0/bets/<key>/rates', methods=['GET'])
def getRatesOfAMatch(key):
    mgr = BetsManager()
    rates=mgr.getRatesOfAMatch(key)
    logger.info(">>{}".format(jsonify({'rates': rates}).data))
    return jsonify({'rates': rates})

class Bet(BetProjectClass):
    u""""
    _id (soit uuid soit objectid mongo)
    user_id (=uuid)
    com_id (uuid)
    key : "GROUPEE_SWE_BEL"
    category (GROUPE, 1_4, 1_2, 1_1, 1)
    categoryName (groupeA, Quart 01, Demi 02...)
    dateDeadLineBet :  date limite de saisi du pari
    dateMatch : date match pour info
    libteamA: nom equipe A
    libteamB: nom équipe B
    teamA : code Equipe A
    teamB : code Equipe A
    resultA : pari resutat teamA
    resultB : pari resutat teamB
    nbpoints : score calculated after the end of the match
    "2016-06-22T19:00:00Z",
    "2016-03-18T20:45:16.692Z"
    db.bets.insert({"com_id": "qqq", "user_id":"zoo", "key_match" : "GROUPEE_SWE_BEL", "category":"GROUPE",
    "categoryName": "groupeA", "dateDeadLineBet" : "2016-03-18T20:21:37.330Z", "dateMatch" : "2016-03-18T20:21:37.330Z",
     "libteamA": "nom equipe A", "libteamB": "nom équipe B", "teamA" : "code Equipe A", "teamB" : "code Equipe A",
     "resultA" : "0", "resultB" : "0"});
    """""

    def __init__(self):
        self._id = None
        self.user_id = u""
        self.com_id = u""
        self.key = u""
        self.resultA = None
        self.resultB = None
        self.category = u""
        self.categoryName = u""
        self.libteamA = u""
        self.libteamB = u""
        self.teamA = u""
        self.teamB = u""
        self.nbpoints = 0

    def convertFromBson(self, elt):
        """
        convert a community object from mongo
        :param elt bson structure from mongodb
        """
        for k in elt.keys():
            if k == "_id":
                self._id = str(elt[k])
            else:
                self.__dict__[k] = elt[k]

    def convertIntoBson(self):
        """
        convert a community object into mongo Bson format
        """
        elt = dict()
        for k in self.__dict__:
            if k == "_id":
                logger.info(u'convertIntoBson={} - do nothing'.format(self._id))
                #if not self._id is None:
                #    logger.info(u'convertIntoBson={}'.format(self._id))
                #    elt[k] = ObjectId(self._id)
            else:
                elt[k] = self.__dict__[k]
        return elt


class BetsManager(DbManager):
    def getBetsOfUserAndCom(self, user_id, com_id):
        localdb = self.getDb()
        # get all matchs
        matchsList = localdb.matchs.find().sort("dateMatch")

        # search all bets for user and community
        betsList = localdb.bets.find({"user_id": user_id, "com_id": com_id})
        logger.info(u'getBets::betsList={}'.format(betsList))
        # Faut-il changer de list ou retourner le bson directement ?
        result = list()

        matchsDict = dict()
        for matchbson in matchsList:
            matchsDict[matchbson[u"key"]] = matchbson

        betsDict = dict()
        for betbson in betsList:
            betsDict[betbson[u"key"]] = betbson

        for key in matchsDict:
            logger.info(u'\tgetBetsOfUserAndCom::key={}'.format(key))
            bet = Bet()
            bet.user_id = user_id
            bet.com_id = com_id
            if key in betsDict:
                bet.convertFromBson(betsDict[key])
                logger.info(u'\tgetBetsOfUserAndCom::bet={}'.format(bet))
                tmpdict = bet.__dict__
                result.append(tmpdict)
            else:
                matchsDict[key].pop("_id", None)
                bet.convertFromBson(matchsDict[key])
                # force result to none if user has never bet
                bet._id = None
                bet.resultA = None
                bet.resultB = None
                logger.info(u'\tgetBetsOfUserAndCom::bet={}'.format(bet))
                tmpdict = bet.__dict__
                result.append(tmpdict)

        result.sort(key=lambda bet: bet["dateMatch"])

        return result

    def createOrUpdateBets(self, user_id, com_id, bets):
        u"""
        update a list af bet for user in a community
        :param user_id: id of user (to check with the detail of bet)
        :param com_id: id of community (to check with the detail of bet)
        :param bets: list of bets
        :return: nb of bets updated or created
        """
        nbHit = 0
        for b in bets:
            bet = Bet()
            bet.convertFromBson(b)
            # STEP 1 : contrôle de l'intégrité de la requête (évite l'aller plus loin si pb). L'intégrité en DB est vérifiée
            # plus loin
            currDate = datetime.utcnow()
            logger.info(u'\t\t****** CtrlDateFront - currDate : {}'.format(currDate))
            logger.info(u'\t\t****** CtrlDateFront - deadLine : {}'.format(datetime.strptime(bet.dateDeadLineBet, "%Y-%m-%dT%H:%M:%SZ")))
            if bet.user_id==user_id and bet.com_id==com_id and datetime.strptime(bet.dateDeadLineBet, "%Y-%m-%dT%H:%M:%SZ") > currDate:
                logger.warn(u'\ttry save : {}\n'.format(b))
                self.createOrUpdate(bet)
                nbHit = nbHit + 1
            else:
                logger.warn(u'\tdate limite dépassée, on n\'enregistre pas : {}\n'.format(b))
        return nbHit

    def createOrUpdate(self, bet):
        u"""
        store a bet (create is not exist or update)
        :param bet: the bet to create or update
        :return: the bet (i'm sure if it is good idea)
        """
        bsonBet = self.getDb().bets.find_one({"user_id": bet.user_id, "com_id": bet.com_id,
                                              "key": bet.key})

        # STEP 2 : contrôle de la date limite de pari depuis la DB
        currDate = datetime.utcnow()

        if bsonBet is None:
            bsonMatch = self.getDb().matchs.find_one({"key": bet.key})

            logger.info(u'\t\t****** CtrlDateDB - currDate : {}'.format(currDate))
            logger.info(u'\t\t****** CtrlDateDB - deadLine : {}'.format(datetime.strptime(bsonMatch["dateDeadLineBet"], "%Y-%m-%dT%H:%M:%SZ")))

            if datetime.strptime(bsonMatch["dateDeadLineBet"], "%Y-%m-%dT%H:%M:%SZ") < currDate:
                logger.info(u'\t\thack en cours par le user : {}'.format(bet.user_id))
            else:
                bsonBet = bet.convertIntoBson()
                bsonBet .pop("_id", None)
                logger.info(u'\t\tto create : {}'.format(bsonBet))
                newid = self.getDb().bets.insert_one(bsonBet).inserted_id
                logger.info(u'\t\tid : {}'.format(newid))
        else:
            logger.info(u'\t\t****** CtrlDateDB - currDate : {}'.format(currDate))
            logger.info(u'\t\t****** CtrlDateDB - deadLine : {}'.format(datetime.strptime(bsonBet["dateDeadLineBet"], "%Y-%m-%dT%H:%M:%SZ")))
            if datetime.strptime(bsonBet["dateDeadLineBet"], "%Y-%m-%dT%H:%M:%SZ") < currDate:
                logger.info(u'\t\thack en cours par le user : {}'.format(bet.user_id))
            else:
                logger.info(u'\t\t try update to bsonBet["_id" : {}] with bet={}'.format(bsonBet["_id"], bet))
                self.getDb().bets.update({"_id": bsonBet["_id"]},
                                          {"$set": {"com_id": bet.com_id, "user_id": bet.user_id,
                                                    "key": bet.key, "category": bet.category,
                                                    "categoryName": bet.categoryName,
                                                    "dateDeadLineBet": bet.dateDeadLineBet,
                                                    "dateMatch": bet.dateMatch, "libteamA": bet.libteamA,
                                                    "libteamB": bet.libteamB,
                                                    "teamA": bet.teamA, "teamB": bet.teamB,
                                                    "resultA": bet.resultA, "resultB": bet.resultB}}, upsert=True)
        return bet


    def saveScore(self, bet):
        u"""
        store just the score of a bet, and eventually the state "closed" or not of a bet.
        :param bet: the bet to create or update
        :return: the bet (i'm sure if it is good idea)
        """
        bsonBet = self.getDb().bets.find_one({"user_id": bet.user_id, "com_id": bet.com_id,
                                              "key": bet.key})
        if bsonBet is None:
            logger.info(u"\t\tERROR - bet not found")
        else:
            currDate = datetime.utcnow()
            if datetime.strptime(bet.dateMatch, "%Y-%m-%dT%H:%M:%SZ") < currDate:
                logger.warn(u'\tdate limite dépassée !')
                self.getDb().bets.update({"_id": bsonBet["_id"]},
                                         {"$set": {"nbpoints": bet.nbpoints, "notClosed" : False}}, upsert=True)
            else:
                self.getDb().bets.update({"_id": bsonBet["_id"]},
                                         {"$set": {"nbpoints": bet.nbpoints, "notClosed" : True}}, upsert=True)
        return bet

    def delete(self, bet):
        u"""
        search bet in db by com_id/user_id/key match
        :param bet: bet to remove
        :return: thenb of deletion
        """
        bsonBet = self.getDb().bets.find_one({"user_id": bet.user_id, "com_id": bet.com_id,
                                              "key": bet.key})
        result = self.getDb().bets.delete_one({"_id": bsonBet["_id"]})
        return result.deleted_count

    def countPlayers(self, com_id):
        u"""
        count of number of distinct user in a community
        :param com_id: the community id
        :return: the number of user who had bet
        """
        result = len(self.getDb().bets.distinct("user_id", {"com_id":com_id}))
        return result

    def players(self, com_id):
        u"""
        list of users of distinct user in a community
        :param com_id: the community id
        :return: the number of user who had bet
        """
        userIdList = self.getDb().bets.distinct("user_id", {"com_id":com_id})
        usermgr = UserManager()
        result=list()
        for uuid in userIdList:
            user = usermgr.getUserByUserId(uuid)
            result.append(user.__dict__)
        logger.info(u'\t\tplayers : {}'.format(result))

        result.sort(key=lambda user: user["nickName"])

        return result

    def getCommunitiesIdByUser(self, user_id):
        u"""
        list of distinct sorted communities uuid for a player
        :param user_id: the user id
        :return: the list of communities uuid where the user has bet
        """
        comIdList = self.getDb().bets.distinct("com_id", {"user_id":user_id})

        logger.info(u'\t\tuser_id : {} and comIdList'.format(user_id,comIdList))

        return sorted(comIdList)

    def get_all_bets(self):
        betBsonList = self.getDb().bets.find()
        betList=list()
        for b in betBsonList:
            bet = Bet()
            bet.convertFromBson(b)
            betList.append(bet)
        return betList


    def getRanking(self, com_id, category, requester):
        u"""
        ranking of the community (if com_id is provided) of ranking of all the bet site
        :param com_id: the com_id (optionnal)
        :param category: the category (ALL, GROUPE or FINAL)
        :param requester: COMMUNITIES_RANKING when the requester is the ranking of the communities
        :return: the ranking
        """
        #STEP 1 : list of users
        if com_id is not None:
            if category == "ALL" or category is None or category == "undefined":
                userIdList = self.getDb().bets.distinct("user_id", {"com_id":com_id})
            else:
                userIdList = self.getDb().bets.distinct("user_id", {"com_id":com_id, "category":category})
        else:
            userIdList = self.getDb().bets.distinct("user_id")
        usermgr = UserManager()
        usermgr.setDb(self.getDb())
        userList=list()
        for uuid in userIdList:
            user = usermgr.getUserByUserId(uuid)
            userList.append(user.__dict__)
        userList.sort(key=lambda user: user["nickName"])

        result = list()

        #STEP 2 : for each user, get the list of bets
        for user in userList:
            comList = list()
            if com_id is not None:
                com = self.getDb().communities.find_one({"com_id": com_id})
                comList.append(com)
            else:
                comIdList = self.getCommunitiesIdByUser(user["user_id"])
                for comId in comIdList:
                    com = self.getDb().communities.find_one({"com_id": comId})
                    comList.append(com)

            communitiesTab = []
            nbPointsTot = 0
            #STEP 3 : for each com, compute the number of points
            logger.info(u"\t\tgetRanking : before loading bets:{}".format(user["user_id"]))
            for com in comList:
                if category == "ALL" or category is None or category == "undefined":
                    betsList = self.getDb().bets.find({"user_id": user["user_id"], "com_id": com["com_id"]}).sort([("dateMatch",1), ("key",1) ])
                else:
                    betsList = self.getDb().bets.find({"user_id": user["user_id"], "com_id": com["com_id"], "category":category}).sort([("dateMatch",1), ("key",1) ])
                nbPointsInCom = 0
                betsTab = []
                #To remove the users who have bet only in the groupe phasis or only in the final phasis (when category = ALL) :
                hasBetInGroup = False
                hasBetInFinal = False
                for bet in betsList:
                    if bet["category"] == "GROUPE":
                        hasBetInGroup = True
                    if bet["category"] == "FINAL":
                        hasBetInFinal = True
                    nbPointsInCom = nbPointsInCom + bet["nbpoints"]
                    del bet["_id"]
                    betsTab.append(bet)
                com["bets"] = betsTab
                del com["_id"]
                if requester == "COMMUNITIES_RANKING":
                    if category == "ALL" or category is None or category == "undefined":
                        if hasBetInGroup is True and hasBetInFinal is True:
                            nbPointsTot = nbPointsTot + nbPointsInCom
                            communitiesTab.append(com)
                    else:
                        nbPointsTot = nbPointsTot + nbPointsInCom
                        communitiesTab.append(com)
                else:
                    nbPointsTot = nbPointsTot + nbPointsInCom
                    communitiesTab.append(com)

            if len(communitiesTab) > 0:
                result.append(self.fillRanking(nbPointsTot, comList, category, user, communitiesTab))

        #STEP 4 : return a sorted list
        result.sort(key=lambda ranking: ranking["nbPoints"], reverse=True)
        return result

    def fillRanking(self, nbPointsTot, comList, category, user, communitiesTab):
        ranking = dict()
        ranking["nbPoints"] = int(nbPointsTot / len(comList))
        # Pour exprimer le nb de pt en % du nb de point total possible :
        #   48 = nb de match au total en poule, 16 = nb de match au total en phase finale, et 64 = nb match total
        #   13 = nb de pt max par match
        if category == "ALL" or category is None or category == "undefined":
            nbMaxMatchs= 64
        elif category == "GROUPE":
            nbMaxMatchs = 48
        elif category == "FINAL":
            nbMaxMatchs = 16
        ranking["nbPointsPercent"] = int((ranking["nbPoints"] * 100) / (nbMaxMatchs * 13))
        ranking["user"] = user
        ranking["communities"] = communitiesTab
        return ranking

    def getRatesOfAMatch(self,key):
        u"""
        rates of the players for a match
        :param key: the key of a bet (like GROUPEE_ITA_IRL)
        :return: the rates
        """
        bets = self.getDb().bets.find({"key":key})
        winnerA = 0
        winnerB = 0
        draw = 0
        nbBets = 0
        for bet in bets:
            if bet["resultA"] is not None and bet["resultB"] is not None:
                if bet["resultA"] == bet["resultB"]:
                    draw = draw + 1
                if bet["resultA"] > bet["resultB"]:
                    winnerA = winnerA + 1
                if bet["resultA"] < bet["resultB"]:
                    winnerB = winnerB + 1
                nbBets = nbBets + 1
        result = dict()
        result["key"] = key
        result["nbBets"] = nbBets
        result["winnerAPercent"] = int(winnerA * 100 / nbBets)
        result["drawPercent"] = int(draw * 100 / nbBets)
        result["winnerBPercent"] = 100 - result["winnerAPercent"] - result["drawPercent"]

        return result

    def getBetsOfTheDay(self, com_id):
        u"""
        return the result of the bets of the days
        :param com_id: the com_id
        :return: the bets of the days
        """
        #STEP 1 : bets of the day for the community
        nowDate = datetime.utcnow()
        nowDateMin = nowDate.replace(hour=00, minute=00, second=00).strftime('%Y-%m-%dT%H:%M:%SZ')
        logger.info('nowDateMin : {}'.format(nowDateMin))
        nowDateMax = nowDate.replace(hour=23, minute=59, second= 59).strftime('%Y-%m-%dT%H:%M:%SZ')
        logger.info('nowDateMax : {}'.format(nowDateMax))
        betsList = self.getDb().bets.find({"com_id": com_id, "dateMatch" : {"$gt" : nowDateMin, "$lt":nowDateMax} }).sort([("dateMatch",1), ("key",1) ])

        result = dict()

        #STEP 2 : list of distincts users
        usermgr = UserManager()
        userIdTab=[]
        betsListTwo=list() #to iterate again
        for bet in betsList:
            del bet["_id"]
            betsListTwo.append(bet)
            if bet["user_id"] not in userIdTab:
                userIdTab.append(bet["user_id"])
        usersList = usermgr.getUsersByUserIdList(userIdTab)
        usersList.sort(key=lambda user: user["nickName"])

        #STEP 3 : list of the matchs of the day
        keyTab=[]
        betsListThree=list() #to iterate again
        for bet in betsListTwo:
            betsListThree.append(bet)
            if bet["key"] not in keyTab:
                keyTab.append(bet["key"])
        matchsList = self.getMatchsByMatchKeyList(keyTab)
        result["matchs"] = matchsList

        #STEP 4 : for each user, get the list of bets
        betsOfTheDay = list()
        for user in usersList:
            betsTab = []
            for bet in betsListThree:
                if user["user_id"] == bet["user_id"]:
                    betsTab.append(bet)
            ranking = dict()
            ranking["user"] = user
            ranking["bets"] = betsTab
            betsOfTheDay.append(ranking)

        result["betsOfTheDay"] = betsOfTheDay

        return result


    def getMatchsByMatchKeyList(self, key_tab):
        """ get a matchlist by keylist """
        logger.info(u'getMatchsByMatchKeyList::key_tab={}'.format(key_tab))

        matchsList = self.getDb().matchs.find({"key": {"$in": key_tab}}).sort([("dateMatch",1), ("key",1) ])

        matchTab = []
        for match in matchsList:
            del match["_id"]
            matchTab.append(match)

        return matchTab