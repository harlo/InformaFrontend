import os, yaml

INFORMA_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
INFORMA_CONF_ROOT = os.path.join(INFORMA_BASE_DIR, "conf")

'''
with open(os.path.join(INFORMA_CONF_ROOT, "informa.config.yaml"), 'rb') as C:
	config = yaml.load(C.read())
'''

#from lib.Server.conf import *
from lib.Frontend.conf import *