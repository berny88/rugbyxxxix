import flask 
import os
import sys
import logging
import logging.handlers
from pymongo import MongoClient

from flask import Flask
print(sys.path)
from tools.Tools import ToolManager, tools_page
from users.UserServices import users_page
from bets.BetsServices import bets_page
from matchs.MatchServices import matchs_page
from communities.CommunityServices import communities_page
from chat.ChatServices import chat_page
from stats.StatsServices import stats_page


application = Flask(__name__)
application.secret_key = u'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT#BB'

application.register_blueprint(communities_page, url_prefix="/communities", template_folder='templates')
application.register_blueprint(users_page, url_prefix="/users", template_folder='templates')
application.register_blueprint(bets_page, url_prefix="/bets", template_folder='templates')
application.register_blueprint(stats_page, url_prefix="/stats", template_folder='templates')
application.register_blueprint(matchs_page, url_prefix="/matchs", template_folder='templates')
application.register_blueprint(tools_page, url_prefix="/tools", template_folder='templates')
application.register_blueprint(chat_page, url_prefix="/chat", template_folder='templates')

print(sys.path)

application.logger.warning('Started')
#ch = logging.StreamHandler(sys.stdout)
#ch.setLevel(logging.DEBUG)
logging.basicConfig(filename='bet.log',level=logging.DEBUG, format='%(asctime)s:%(levelname)s:%(message)s')
log_formatter = logging.Formatter('%(asctime)s %(levelname)s %(funcName)s(%(lineno)d) %(message)s')

logger = logging.getLogger(__name__)
#logger.addHandler(ch)


logger.info('Started')

# Get application version from env
app_version = os.environ.get('APP_VERSION')

# Get cool new feature flag from env
enable_cool_new_feature = os.environ.get('ENABLE_COOL_NEW_FEATURE') in ['true', 'True']

@application.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0, no-cache, no-store, must-revalidate'
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    #logger.info(u'response.headers={}'.format(response.headers))
    return response

@application.route("/")
def hello_world():
    return application.send_static_file('index.html')

@application.route('/yeah')
def yo():
    return 'yooooooooooooooooooooooooo'

@application.route('/hello')
def yeah():
    return 'Hello, World'


@application.errorhandler(404)
def ma_page_404(error):
	return u"Page not found !<br/> <h1>404 error code !</h1> Where do you really want to go ?", 404

if __name__ == '__main__':
    print("main app.py application.run")
    print(os.environ.get('OPENSHIFT_PYTHON_PORT', 8080))
    application.run(host='0.0.0.0', port=os.environ.get('OPENSHIFT_PYTHON_PORT', 8080))
