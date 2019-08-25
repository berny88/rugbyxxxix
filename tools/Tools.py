# -*- coding: utf-8 -*-
from datetime import datetime
import logging
import os
import re
from flask import Blueprint, request, render_template, redirect, url_for
from pymongo import MongoClient
#import sendgrid
#from sendgrid.helpers.mail import *


logger = logging.getLogger(__name__)
tools_page = Blueprint('tools_page', __name__,
                        template_folder='templates')


class DbManager:
    """
    Load all match from json file
    """
    def __init__(self):
        self.DATE_FORMAT = '%Y-%m-%dT%H:%M:%S UTC'
        #print("avant client mongo")
        uri = "mongodb://berny_bet:Ponpon01@mongodb-berny.alwaysdata.net:27017/?authSource=berny_bet&authMechanism=SCRAM-SHA-1"

        client = MongoClient(uri)
        #print(client)
        logger.info(u'conn={}'.format("mongodb-berny.alwaysdata.net:27017/?authSource=berny_bet"))
        self.db = client.berny_bet
        logger.info(u'db={}'.format(self.db))

    def datetime_parser(self, dct):
        for k, v in dct.items():
            if isinstance(v, str) and re.search("\ UTC", v):
                #print(u"k={}/v={}".format(k,v))
                #try:
                dct[k] = datetime.strptime(v, self.DATE_FORMAT)
                #except:
                #print("exception={}".format(sys.exc_info()[0]))
    #                pass
        return dct

    def my_json_encoder(self, obj):
        """Default JSON serializer."""
        logger.info(obj)
        if isinstance(obj, datetime):
            return obj.strftime(self.DATE_FORMAT)
        return obj

    def getDb(self):
        """ get Mongo DB access """
        if (self.db is None):
            uri = "mongodb://berny_bet:Ponpon01@mongodb-berny.alwaysdata.net:27017/?authSource=berny_bet&authMechanism=SCRAM-SHA-1"

            client = MongoClient(uri)
            logger.info(u'getDb::conn={}'.format("mongodb+srv://phipha:phiphaxxxviii@phiphaxxxviii-cs6ex.mongodb.net"))
            self.db = client.berny_bet
            logger.info(u'getDb::db={}'.format(self.db))

        return self.db


    def setDb(self, the_db):
        """ set Mongo DB access """
        self.db=the_db


class BetProjectClass:
    def __str__(self):
        return str(self.__dict__)


class ToolManager(DbManager):

    def getProperties(self):
        """ get the complete list of properties"""
        localdb = self.getDb()
        logger.info(u'getProperties::db={}'.format(localdb))

        propertiesColl = localdb.properties
        propertiesList = propertiesColl.find()
        logger.info(u'propertiesList={}'.format(propertiesList))
        result = list()
        for prop in propertiesList:
            logger.info(u'\tprop={}'.format(prop))
            result.append(prop)
        return result

    def saveProperty(self, key, value):
        """ save a property"""
        localdb = self.getDb()
        logger.info(u'saveProperties::db={}'.format(localdb))

        propertiesColl = localdb.properties
        bsonProperty = propertiesColl.find_one({"key": key})
        logger.info(u'saveProperties::bsonProperty ={}'.format(bsonProperty ))
        if (bsonProperty is None):
            bsonProperty =dict()
            bsonProperty ["key"]=key
            bsonProperty ["value"]=value
            logger.info(u'\tkey None - to create : {}'.format(bsonProperty))
            id = self.getDb().properties.insert_one(bsonProperty).inserted_id
            logger.info(u'\tid : {}'.format(id))

        else:
            if (value != ""):
                propertiesColl.update({"_id":bsonProperty["_id"]},
                    {"$set":{"key":key, "value":value}}, upsert=True)
            else:
                propertiesColl.delete_one({"_id":bsonProperty["_id"]})
        logger.info(u'saveProperty={}'.format(bsonProperty))

    def getProperty(self, key):
        """ get one property by key"""
        localdb = self.getDb()
        logger.info(u'getProperties::db={}'.format(localdb))

        propertiesColl = localdb.properties
        bsonProperty = propertiesColl.find_one({"key": key})
        if bsonProperty is None:
            res=dict()
            res["key"]=key
            res["value"]=""
            return res
        return bsonProperty

    def get_sendgrid(self):
        u"""
        search in  properties account to send email with sendgrid and return a sendclient
        :return the sendGrid objet to send email
        """
        #user = self.getProperty("send_grid_user")["value"]
        #pwd = self.getProperty("send_grid_pwd")["value"]
        #logger.info("sendgrid={}/{}".format(user, pwd))
        #sg = sendgrid.SendGridClient(user,
        #                             pwd)
        # api_key=self.getProperty('SENDGRID_API_KEY')["value"]
        # logger.info("sendgrid={}".format(api_key))
        # sg = sendgrid.SendGridAPIClient(apikey=api_key)
        return sg


@tools_page.route('/properties/', methods=['GET'])
def properties():
    """
    """
    logger.info("properties::request:{} / {}".format(request.args, request.method))
    manager = ToolManager()
    propertyList = manager.getProperties()
    logger.info("properties::propertyList={}".format(propertyList ))
    #Add ever a new property to display a field
    prop = dict()
    prop[u"key"]=u""
    prop[u"value"]=u""
    propertyList.append(prop)

    return render_template('properties.html',
        propertyList=propertyList)

@tools_page.route('/saveproperties/', methods=['POST'])
def saveproperties():
    """
    """
    logger.info("saveproperties::request:{} / {}".format(request.args, request.method))
    logger.info("\tsaveproperties::request.values:{}".format(request.values))
    propDict=dict()
    for key, value in request.values.items():
        logger.info("saveproperties::key=[{}] / value=[{}]".format(key, value))
        if key != "submit" :
            #the value contains the key as prefix.
            # example : key001_key=key001 or key001_value=theValue
            # for new key :
            # example : new.key_key=ponpon or new.key_value=theNewValue
            # we analyze only key=xxx_value
            if (key.split("_")[1] == u"value"):
                #extract keyCode
                keyCode = key.split("_")[0]
                #case of new key/value
                if (u"_value" == key):
                    keyCode = request.values.get(u"_key")

                logger.info("\tsaveproperties::keyCode=[{}] ".format(keyCode))
                if (keyCode != u""):
                    if keyCode in propDict:
                        prop = propDict[keyCode]
                        prop[u"value"] = value
                        logger.info("\t\tsaveproperties::keyCode in propDict=[{}] ".format(prop))
                    else:
                        prop = dict()
                        prop[u"key"] = keyCode
                        prop[u"value"] = value
                        propDict[keyCode]=prop
                        logger.info("\t\tsaveproperties::keyCode not in propDict=[{}]".format(prop))
                    logger.info("\tsaveproperties::propDict=[{}] ".format(propDict))
            if (key.split("_")[1] == u"key"):
                value = request.values.get(key.split("_")[0] + "value")
                if (value ==""):
                    logger.info("\t\tsaveproperties::key=[{}] to remove".format(key))

    for keyProp in propDict:
        prop = propDict[keyProp]
        logger.info("saveproperties:: final list: prop=[{}]".format(prop))
        manager = ToolManager()
        manager.saveProperty(prop[u"key"], prop[u"value"])

    return redirect(url_for('tools_page.properties'))
