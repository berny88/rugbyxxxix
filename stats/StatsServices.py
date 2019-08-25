# -*- coding: utf-8 -*-
import logging
from datetime import datetime

from flask import Blueprint, jsonify, request, session

from tools.Tools import DbManager

from bets.BetsServices import BetsManager

from communities.CommunityServices import CommunityManager

from users.UserServices import UserManager

logger = logging.getLogger(__name__)

stats_page = Blueprint('stats_page', __name__,
                      template_folder='templates', static_folder='static')

@stats_page.route('/apiv1.0/stats/historyrankings', methods=['PUT'])
def createhistoryrankings():
    u"""
    :return enregistre l'historique du classement pour toutes les communautés, ainsi que le classement général
    """
    if "cookieUserKey" in session:
        mgr = StatsManager()
        cookieUserKey = session['cookieUserKey']
        user_mgr = UserManager()
        user = user_mgr.getUserByUserId(cookieUserKey)
        nbHit=0
        if user.isAdmin:
            logger.info(u"createhistoryrankings: by ={}".format(user.email))
            nbHit = mgr.createHistoryRankings()
        else:
            return "Ha ha ha ! Mais t'es pas la bonne personne pour faire ça, mon loulou", 403
        return jsonify({'nbHit': nbHit})
    else:
        return "Ha ha ha ! Mais t'es qui pour faire ça, mon loulou ?", 403


@stats_page.route('/apiv1.0/stats/historyrankings', methods=['GET'])
def historyrankings():
    u"""
    :return la représentation json de l'historique du classement (d'une communauté, ou général)
    """
    com_id=request.args.get('com_id')
    statsMgr = StatsManager()
    d = dict()
    historyrankings = statsMgr.getHistoryRankings(com_id)
    d["historyrankings"]=historyrankings
    return jsonify({'data': d})

@stats_page.route('/apiv1.0/stats/ranking', methods=['GET'])
def ranking():
    u"""
    :return la représentation json du classement général
    :param filter: the phasis we want the ranking for (ALL, GROUPE or FINAL)
    :param requester: COMMUNITIES_RANKING when the requester is the ranking of the communities
    """
    filter=request.args.get('filter')
    requester=request.args.get('requester')
    betsMgr = BetsManager()
    d = dict()
    rankings = betsMgr.getRanking(None,filter,requester)
    d["rankings"]=rankings
    return jsonify({'data': d})

@stats_page.route('/apiv1.0/stats/teams', methods=['GET'])
def get_stats_teams():
    u"""
    expected outout
    {   "name": "teams",
        "children": [
            {   "name": "groupea",
                "color":"blue",
                "children": [
                    { "name": "FRANCE", "size": 12 },
                    { "name": "ROUMANIE", "size": 5 },
                    { "name": "ALBANIE", "size": 1 },
                    { "name": "SUISSE", "size": 8 }
                ]
            },
            {   "name": "data",
                "color":"red",
                "children": [
                    { "name": "PAYS DE GALLES", "size": 12 },
                    { "name": "ANGLETERRE", "size": 5 },
                    { "name": "RUSSIE", "size": 1 },
                    { "name": "SLOVAQUIE", "size": 8 }
                ]
            }
        ]
    }
    """
    mgr = StatsManager()
    d=dict()
    d["name"]=u"team"
    d["children"]=mgr.get_team_stats()
    return jsonify({'teams': d})

@stats_page.route('/apiv1.0/stats/teams_huit', methods=['GET'])
def get_stats_huit_teams():
    mgr = StatsManager()
    d=dict()
    d["name"]=u"team"
    d["children"]=mgr.get_team_huit_stats()
    return jsonify({'teams': d})

class StatTeamGoal:
    def __init__(self):
        self.key=u""
        self.name=u""
        self.group_name=u""
        self.nb_goal=0

class StatsManager(DbManager,object):


    def __init__(self):
        super(StatsManager, self).__init__()
        d=dict()
        d["GROUPEA"]=u"#4DD17B"
        d["GROUPEB"] = u"#A490D6"
        d["GROUPEC"] = u"#D9669A"
        d["GROUPED"] = u"#F24444"
        d["GROUPEE"] = u"#E86620"
        d["GROUPEF"] = u"#DAEB49"
        d["HUIT"] = u"#856F8C"
        d["QUART"] = u"#173D96"
        d["DEMI"] = u"#C99628"
        d["FINAL"] = u"#ED1A4B"
        self.color=d

    def createHistoryRankings(self):
        u"""
        Create the history rankings (all communities, and for the general ranking)
        """
        localdb = self.getDb()
        betsManager = BetsManager()
        comManager = CommunityManager()
        comList = comManager.getAllCommunities()
        nbHits = 0
        currDate = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        # Communities ranking
        for com in comList:
            rankings = betsManager.getRanking(com["com_id"],"ALL","HISTORY_RANKING")
            for ranking in rankings:
                bsonHR =dict()
                bsonHR["com_id"]=com["com_id"]
                bsonHR["date_ranking"]=currDate
                bsonHR["nb_points"]=ranking["nbPoints"]
                bsonHR["user_id"]=ranking["user"]["user_id"]
                bsonHR["user_nickname"]=ranking["user"]["nickName"]

                logger.info(u'\tHistory ranking - to create : {}'.format(bsonHR))
                id = localdb.historyrankings.insert_one(bsonHR).inserted_id
                logger.info(u'\tid : {}'.format(id))
                nbHits = nbHits + 1

        # General ranking
        rankings = betsManager.getRanking(None,"ALL","HISTORY_RANKING")
        for ranking in rankings:
            bsonHR =dict()
            bsonHR["com_id"]="all"
            bsonHR["date_ranking"]=currDate
            bsonHR["nb_points"]=ranking["nbPoints"]
            bsonHR["user_id"]=ranking["user"]["user_id"]
            bsonHR["user_nickname"]=ranking["user"]["nickName"]

            logger.info(u'\tHistory ranking - to create : {}'.format(bsonHR))
            id = localdb.historyrankings.insert_one(bsonHR).inserted_id
            logger.info(u'\tid : {}'.format(id))
            nbHits = nbHits + 1

        return nbHits


    def getHistoryRankings(self,com_id):
        u"""
        return the list of historyRanking
        """
        localdb = self.getDb()
        historyrankingListBson = localdb.historyrankings.find({"com_id": com_id}).sort("date_ranking")

        historyrankingList = list()
        for hr in historyrankingListBson:
            d = dict()
            d["com_id"] = hr["com_id"]
            d["date_ranking"] = hr["date_ranking"]
            d["user_id"] = hr["user_id"]
            d["user_nickname"] = hr["user_nickname"]
            d["nb_points"] = hr["nb_points"]
            historyrankingList.append(d)

        return historyrankingList

    def get_team_stats(self):
        u"""
        return the list of team with their number of goal, bet by all user.
        """
        localdb = self.getDb()
        result=list()
        # get all matchs
        matchsList = localdb.matchs.find().sort("dateMatch")

        # search all bets for all user and community
        betsList = localdb.bets.find()

        result = list()

        matchs_dict = dict()
        group_dict = dict()
        team_dict = dict()
        # populate StatTeamGoal (key=team)
        for matchbson in matchsList:
            matchs_dict[matchbson[u"key"]] = matchbson
            group_name = matchbson[u"key"].split("_")[0]
            if group_name not in group_dict:
                d = dict()
                d["color"] = self.color[group_name]
                d["name"] = group_name
                d["children"] = list()
                group_dict[group_name] = d
            if matchbson[u"teamA"] not in team_dict:
                stat=StatTeamGoal()
                stat.key=matchbson["teamA"]
                stat.name=matchbson["libteamA"]
                stat.group_name = group_name
                team_dict[matchbson["teamA"]]=stat

            if matchbson[u"teamB"] not in team_dict:
                stat=StatTeamGoal()
                stat.key=matchbson["teamB"]
                stat.name=matchbson["libteamB"]
                stat.group_name = group_name
                team_dict[matchbson["teamB"]]=stat

        list_team=list()
        #sum goal for each team (perhaps possible in mongo ???
        for betbson in betsList:
            if betbson["teamA"] in team_dict:
                stat = team_dict[betbson["teamA"]]
                stat.nb_goal=stat.nb_goal + self.get_result(betbson, "A")

            if betbson["teamB"] in team_dict:
                stat = team_dict[betbson["teamA"]]
                stat.nb_goal=stat.nb_goal + self.get_result(betbson, "B")

        for team_name in team_dict:
            stat = team_dict[team_name]
            group_dict[stat.group_name]["children"].append(stat.__dict__)

        for grp in group_dict:
            result.append(group_dict[grp])

        return result

    def get_team_huit_stats(self):
        u"""
        return the list of team with their number of goal, bet by all user.
        """
        localdb = self.getDb()
        result=list()
        # get all matchs
        matchsList = localdb.matchs.find({"categoryName": "HUITIEME"}).sort("dateMatch")

        # search all bets for all user and community
        betsList = localdb.bets.find({"categoryName": "HUITIEME"})

        result = list()

        matchs_dict = dict()
        group_dict = dict()
        team_dict = dict()
        # populate StatTeamGoal (key=team)
        for matchbson in matchsList:
            matchs_dict[matchbson[u"key"]] = matchbson
            group_name = matchbson[u"key"].split("_")[0]
            if group_name not in group_dict:
                d = dict()
                d["color"] = self.color[group_name]
                d["name"] = group_name
                d["children"] = list()
                group_dict[group_name] = d
            if matchbson[u"teamA"] not in team_dict:
                stat=StatTeamGoal()
                stat.key=matchbson["teamA"]
                stat.name=matchbson["libteamA"]
                stat.group_name = group_name
                team_dict[matchbson["teamA"]]=stat

            if matchbson[u"teamB"] not in team_dict:
                stat=StatTeamGoal()
                stat.key=matchbson["teamB"]
                stat.name=matchbson["libteamB"]
                stat.group_name = group_name
                team_dict[matchbson["teamB"]]=stat

        list_team=list()
        #sum goal for each team (perhaps possible in mongo ???
        for betbson in betsList:
            if betbson["teamA"] in team_dict:
                stat = team_dict[betbson["teamA"]]
                stat.nb_goal=stat.nb_goal + self.get_result(betbson, "A")

            if betbson["teamB"] in team_dict:
                stat = team_dict[betbson["teamA"]]
                stat.nb_goal=stat.nb_goal + self.get_result(betbson, "B")

        for team_name in team_dict:
            stat = team_dict[team_name]
            group_dict[stat.group_name]["children"].append(stat.__dict__)

        for grp in group_dict:
            result.append(group_dict[grp])

        return result

    def get_result(self, dict_bson, type_team):
        if "result"+type_team in dict_bson:
            if dict_bson["result"+type_team] is not None and  dict_bson["result"+type_team] != "":
                return int(dict_bson["result"+type_team])
            else:
                return 0

