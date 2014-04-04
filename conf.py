import os, yaml, json

from lib.Frontend.conf import *
#from lib.Server.conf import *

INFORMA_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
INFORMA_CONF_ROOT = os.path.join(INFORMA_BASE_DIR, "conf")
SYNC_TYPES = []

def getSecrets(password=None):
	try:
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json"), 'rb') as C:
			try:
				config = json.loads(C.read())
			except TypeError as e:
				if password is None: return
				
				# decrypt with password
					
				
			try:
				GOOGLE_DRIVE_CONF = config['repository.google_drive']
				SYNC_TYPES.append("google_drive")
			except KeyError as e:
				print e
			
			try:
				GLOBALEAKS_CONF = config['repository.globaleaks']
				SYNC_TYPES.append("globaleaks")
			except KeyError as e:
				print e
	except IOError as e:
		if DEBUG: print "NO SECRETS YET"

try:
	with open(os.path.join(INFORMA_CONF_ROOT, "informacam.config.yaml"), 'rb') as C:
		config = yaml.load(C.read())
		IV = config['encryption.iv']
		SALT = config['encryption.salt']
			
except IOError as e:
	if DEBUG: print "NO INFORMA CONF YET"

getSecrets(password=None)