import os, yaml

INFORMA_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
INFORMA_CONF_ROOT = os.path.join(INFORMA_BASE_DIR, "conf")

with open(os.path.join(INFORMA_CONF_ROOT, "informacam.config.yaml"), 'rb') as C:
	config = yaml.load(C.read())
	try:
		GOOGLE_DRIVE_CONF = config['repository.google_drive']
	except Exception as e:
		print e

#from lib.Server.conf import *
from lib.Frontend.conf import *