# -*- coding: utf-8 -*-
import logging
from uuid import uuid4
import sendgrid
from sendgrid.helpers.mail import *

from tools.Tools import ToolManager

from tools.Tools import DbManager, BetProjectClass

from users.UserServices import UserManager
from bets.BetsServices import BetsManager

logger = logging.getLogger(__name__)

u"""
**************************************************
Service layer
"""

class Blog(BetProjectClass):

    u""""
    communities = 'com_id': 1,
    title: u'First community',
    description: u'poum poum chak poum pouum chak',
    admins: [community]
    id : autoincrement par mongoDB ou  UUID
    title : texte libre mais unique max 50c
    description : texte libre
    admin_user_id : id de l'administrateur (=celui qui a créé la communauté)
    """""

    def __init__(self):
        self.blog_id=u""
        self.author = u""
        self.createdOn = u""
        self.title=u""
        self.com_id =u""
        self.comments=list()
        self.likes=0
        self.body = list()

    def convertFromJson(self, elt):
        """
        convert a blog object from mongo
        :param elt : dictionnary = json representation
        """
        for k in elt.keys():
            #we don't use _id attrb (from mongo)
            if k != "_id":
                if k =="comments":
                    for c in elt["comments"]:
                        comment=Comment()
                        comment.convertFromJson(c)
                        self.comments.append(comment)
                else:
                    self.__dict__[k] = elt[k]

    def __str__(self):
        return str(self.__dict__)

    def convertIntoJson(self):
        """
        convert a blog object into Json format
        """
        elt = dict()
        for k in self.__dict__:
            if k != "_id":
                elt[k] = self.__dict__[k]
            if k == "comments":
                l=list()
                for c in self.comments:
                    l.append(c.convertIntoJson())
                elt["comments"] = l
        return elt

    def body_to_mail(self):
        u"""
        :return return the body of blog with <br/> to mark line break
        """
        result=u""
        for b in self.body:
            result = result + b + u"<br/>"
        return result

class Comment(BetProjectClass):

    def __init__(self):
        self.author = u""
        self.createdOn = u""
        self.body= u""

    def convertFromJson(self, elt):
        """
        update current object (self) with blog object from mongo or ui layer (in JSON).
        we don't care od _id because comment is just a subcomponent of Blog
        :param elt : dictionnary = json representation
        """
        for k in elt.keys():
            self.__dict__[k] = elt[k]

    def convertIntoJson(self):
        """
        convert a blog object into Json format
        """
        elt = dict()
        for k in self.__dict__:
            elt[k] = self.__dict__[k]
        return elt


class BlogsManager(DbManager):

    def getBlogByCommunity(self, com_id):
        """ get the complete list of properties"""
        localdb = self.getDb()
        logger.info(u'getBlogByCommunity::db={}'.format(localdb))

        blogsColl = localdb.blogs
        blogsList = blogsColl.find({"com_id": com_id}).sort([("createdOn",-1)])
        logger.info(u'getBlogByCommunity::communitysList={}'.format(blogsList))
        #Faut-il changer de list ou retourner le bson directement ?
        result = list()

        for blogbson in blogsList:
            logger.info(u"\tgetBlogByCommunity::blogbson={}".format(blogbson))
            #tmpdict = blog.__dict__
            #logger.info(u'\tgetAllCommunities::tmpdict={}'.format(tmpdict))
            blog = Blog()
            blog.convertFromJson(blogbson)
            result.append(blog)
        return result

    def getBlogByCommunityAndBlogId(self, com_id, blog_id):
        """ get the complete list of properties"""
        localdb = self.getDb()
        logger.info(u'getBlogByCommunityAndBlogId::db={}'.format(localdb))

        blogsColl = localdb.blogs
        blogBson = blogsColl.find_one({"com_id": com_id, "blog_id":blog_id})
        logger.info(u'getBlogByCommunityAndBlogId::blog={}'.format(blogBson))
        blog = Blog()
        blog.convertFromJson(blogBson)
        return blog

    def createBlog(self, blog):
        """ save com """
        localdb = self.getDb()
        blog.blog_id=str(uuid4())
        logger.info(u'\tTo create : {}'.format(blog.convertIntoJson()))
        id = localdb.blogs.insert_one(blog.convertIntoJson()).inserted_id
        logger.info(u'\tnew id : {}'.format(id))
        return blog

    def deleteBlog(self, blog):
        """ delete a blog"""
        localdb = self.getDb()

        logger.info(u'\tto delete : {}'.format(blog))
        result = localdb.blogs.delete_one({"blog_id":blog.blog_id})
        logger.info(u'\tnb deleted : {}'.format(result.deleted_count))
        return result.deleted_count

    def add_comment_on_blog(self, com_id, blog_id, comment):
        u"""
        """
        localdb = self.getDb()

        logger.info(u'add_comment_on_blog : com_id={}/blog_id={}/comment={}'.format(com_id, blog_id, comment))
        blog = self.getBlogByCommunityAndBlogId(com_id, blog_id)
        if (blog is not None):
            blog.comments.append(comment)
            blogBson = blog.convertIntoJson()
            id = localdb.blogs.update({"blog_id": blog.blog_id, "com_id":blog.com_id},
                                      {"$set": {"comments": blogBson["comments"]}}, upsert=True)

        return 1


    def send_email_to_user_id(self, com_id, blog, user_id):
        u""""
        send email to user_id
        :param com_id the com id
        :param blog the blog send
        :param user_id uuid of user to notify - usually the admin od community
        """
        userMgr = UserManager()
        user = userMgr.getUserByUserId(user_id)
        recipients = list()
        recipients.append(user.email)
        return self.send_email(com_id, blog, recipients)

    def send_email_to_all(self, com_id, blog):
        u""""
        send email to all user of community
        :param com_id the com_id
        :param blog the blog send
        """
        bet_mgr = BetsManager()
        recipients = list()
        for user in bet_mgr.players(blog.com_id):
            recipients.append(user["email"])
        return self.send_email(com_id, blog, recipients)

    def send_email(self, com_id, blog, recipients):
        tool = ToolManager()
        sg = tool.get_sendgrid()
        url_root = tool.getProperty("url_root")["value"]

        urlBlog = "{}/#/blog_in_community/{}".format(url_root, com_id);
        url_to_bet = "{}/#/bet_in_community/{}".format(url_root, com_id);

        logger.info("email title={}".format(blog.title))
        logger.info("email body-to_mail={}".format(blog.body_to_mail()))
        body = u"""<html><head></head><body><pre style='font-size: 16px;font-family:Verdana;'>{}</pre>
        <br/><h2>Leave your comments here: {}</h2>
        <br/><h1>And don't forget to bet: {}</h1></body></html>""".format(blog.body_to_mail(), urlBlog, url_to_bet)
        try:
            from_email = Email("eurommxvi.foot@gmail.com", "phipha2018-noreply-please")
            content = Content("text/html", body)

            mail = Mail(from_email, blog.title, from_email, content)

            for r in recipients:
                logger.debug(r)
                mail.personalizations[0].add_bcc(Email(r))
            logger.debug(mail.personalizations)

            response = sg.client.mail.send.post(request_body=mail.get())
            logger.debug(response.status_code)
            logger.debug(response.body)
            logger.debug(response.headers)

            # Bloc de test
        except RuntimeError as err:
            print ("Unexpected error:", err)
            raise

        return response