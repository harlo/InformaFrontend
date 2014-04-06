import os, yaml, json

from lib.Frontend.conf import *
#from lib.Server.conf import *

INFORMA_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
INFORMA_CONF_ROOT = os.path.join(INFORMA_BASE_DIR, "conf")
INFORMA_USER_ROOT = os.path.join(INFORMA_BASE_DIR, ".users")
INFORMA_GPG_ROOT = os.path.join(INFORMA_BASE_DIR, ".gpg")
WEB_TITLE = "InformaCam 2.0"

def getSecrets(password=None):
	try:
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json"), 'rb') as C:
			try:
				config = json.loads(C.read())
			except TypeError as e:
				if password is None: return
				
				# decrypt with password
			INFORMA_SECRETS = config
	except IOError as e:
		if DEBUG: print "NO SECRETS YET"

def getSyncTypes():
	return []
	

try:
	with open(os.path.join(INFORMA_CONF_ROOT, "informacam.config.yaml"), 'rb') as C:
		config = yaml.load(C.read())
		ADMIN_USERNAME = config['admin.username']
		IV = config['encryption.iv']
		SALT = config['encryption.salt']
		USER_SALT = config['encryption.user_salt']
		DOC_SALT = config['encryption.doc_salt']
			
except IOError as e:
	if DEBUG: print "NO INFORMA CONF YET"

SYNC_TYPES = getSyncTypes()