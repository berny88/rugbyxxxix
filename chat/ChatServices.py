# -*- coding: utf-8 -*-
from flask import Blueprint, jsonify, request, session
import logging
from uuid import uuid4

from tools.Tools import DbManager

from users.UserServices import UserManager

logger = logging.getLogger(__name__)

chat_page = Blueprint('chat_page', __name__,
                        template_folder='templates', static_folder='static')

@chat_page.route('/apiv1.0/posts', methods=['GET'])
def getAllPosts():
    mgr = ChatManager()
    posts=mgr.getAllPosts()
    logger.info(">>{}".format(jsonify({'posts': posts}).data))
    return jsonify({'posts': posts})

@chat_page.route('/apiv1.0/posts', methods=['POST'])
def createPost():
    logger.info(u"savepost::json param:{} ".format(request.json))
    if "cookieUserKey" in session:
        postToCreateJSON = request.json["postToCreate"]

        postToCreate=Post()
        postToCreate.message=postToCreateJSON['message'];
        postToCreate.date=postToCreateJSON['date'];
        postToCreate.post_user_id=postToCreateJSON['post_user_id'];

        #call Service (DAO)
        mgr = ChatManager()
        postCreated = mgr.savePost(postToCreate)

        return jsonify({'post': postCreated.__dict__})
    else:
        return u"{'post':'not authenticated'}", 401


@chat_page.route('/apiv1.0/posts/<post_id>', methods=['DELETE'])
def deletePost(post_id):
    if "cookieUserKey" in session:
        mgr = ChatManager()
        posts=mgr.deletePost(post_id)
        return jsonify({'posts': posts})
    else:
        return u"{'post':'not authenticated'}", 401

u"""
**************************************************
Service layer
"""

class Post:

    def __init__(self):
        self.message = u""
        self.date = u""
        self.post_id=u""
        self.post_user_id =u""


    def convertFromBson(self, elt):
        """
        convert a post object from mongo
        """
        if 'message' in elt.keys():
            self.message = elt['message']
        if 'date' in elt.keys():
            self.date = elt['date']
        if 'post_id' in elt.keys():
            self.post_id = elt['post_id']
        if 'post_user_id' in elt.keys():
            self.post_user_id = elt['post_user_id']

    def convertIntoBson(self):
        """
        convert a post object into mongo Bson format
        """
        elt = dict()
        #elt['_id'] = self._id
        elt['date'] = self.date
        elt['message'] = self.message
        elt['post_id'] = self.post_id
        elt['post_user_id'] = self.post_user_id


class ChatManager(DbManager):

    def getAllPosts(self):
        """ get the complete list of posts"""
        localdb = self.getDb()
        logger.info(u'getAllPosts::db={}'.format(localdb))

        postsColl = localdb.posts
        postsList = postsColl.find().sort([("date",-1)]).limit(30)
        logger.info(u'getAllPosts::postsList={}'.format(postsList))
        #Faut-il changer de list ou retourner le bson directement ?
        result = list()

        for postbson in postsList:

            logger.info(u'\tgetAllPosts::postbson={}'.format(postbson))
            post = Post()
            post.convertFromBson(postbson)

            userMgr = UserManager()
            user = userMgr.getUserByUserId(post.post_user_id)
            if user is None:
                post.nickName = "Anonyme"
            else:
                post.nickName = user.nickName

            logger.info(u'\tgetAllPosts::post={}'.format(post))
            tmpdict = post.__dict__
            logger.info(u'\tgetAllPosts::tmpdict={}'.format(tmpdict))
            result.append(tmpdict)
        return result

    def savePost(self, post):
        u"""
        create a newpost
        :param post: new post
        :return: error if not authenticated
        """
        localdb = self.getDb()

        bsonPost =dict()
        post_id=str(uuid4())
        bsonPost["post_id"]=post_id
        bsonPost["date"]=post.date
        bsonPost["message"]=post.message
        bsonPost["post_user_id"]=post.post_user_id

        logger.info(u'\tkey None - to create : {}'.format(bsonPost))
        id = localdb.posts.insert_one(bsonPost).inserted_id
        logger.info(u'\tid : {}'.format(id))

        post.post_id = post_id
        return post

    def deletePost(self, post_id):
        u"""
        delete a post by id
        :param post_id: id of post
        :return:
        """
        localdb = self.getDb()
        nb = localdb.posts.delete_one({"post_id": post_id})
        logger.info(u'ChatManager::delete={} = nb deleted={}'.format(post_id, nb))
        return ChatManager.getAllPosts(self)
