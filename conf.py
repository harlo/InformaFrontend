import os, yaml, json

from lib.Frontend.conf import *
#from lib.Server.conf import *

INFORMA_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
INFORMA_CONF_ROOT = os.path.join(INFORMA_BASE_DIR, "conf")
INFORMA_USER_ROOT = os.path.join(INFORMA_BASE_DIR, ".users")
INFORMA_GPG_ROOT = os.path.join(INFORMA_BASE_DIR, ".gpg")
WEB_TITLE = "InformaCam 2.0"

def getSecrets(password=None, key=None):
	try:
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json"), 'rb') as C:
			try:
				config = json.loads(C.read())
			except TypeError as e:
				if password is None: return None
			except ValueError as e:
				if DEBUG: print "NO SECRETS YET (VALUE ERROR?)\n%s" % e
				return None
				
				# decrypt with password
			
	except IOError as e:
		if DEBUG: print "NO SECRETS YET (IO ERROR?)\n%s" % e
		return None
	
	if key is None: return config
	
	try:
		return config[key]
	except KeyError as e:
		if DEBUG: print "could not find %s in config" % key
		return None

def saveSecret(key, secret, password=None):
	secrets = getSecrets(password=password)
	if secrets is None: secrets = {}
	
	try:
		secrets[key].update(secret)
	except Exception as e:
		return False
	
	try:
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json"), 'wb+') as C:
			C.write(json.dumps(secrets))
			return True
	except Exception as e:
		if DEBUG: print "Cannot save secret: %s" % e
	
	return False

def getSyncTypes():
	try:
		return getSecrets(key="informacam.sync").keys()
	except Exception as e:
		if DEBUG: print e
	
	return None

try:
	with open(os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json"), 'rb') as C:
		config = json.loads(C.read())

		try: UNVEILLANCE_LM_VARS = config['unveillance.local_remote']
		except KeyError as e: pass

except IOError as e:
	if DEBUG: print "NO SECRETS YET"
		
try:
	with open(os.path.join(INFORMA_CONF_ROOT, "informacam.config.yaml"), 'rb') as C:
		config = yaml.load(C.read())
		print config
		
		try: ADMIN_USERNAME = config['admin.username']
		except KeyError as e: pass
		
		try: IV = config['encryption.iv']
		except KeyError as e: pass
		
		try: SALT = config['encryption.salt']
		except KeyError as e: pass
		
		try: USER_SALT = config['encryption.user_salt']
		except KeyError as e: pass
		
		try: DOC_SALT = config['encryption.doc_salt']
		except KeyError as e: pass
			
except IOError as e:
	if DEBUG: print "NO INFORMA CONF YET"

SYNC_TYPES = getSyncTypes()