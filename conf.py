import os

from lib.Frontend.conf import *

INFORMA_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
INFORMA_CONF_ROOT = os.path.join(INFORMA_BASE_DIR, "conf")

WEB_TITLE = "InformaCam 2.0"

PERMISSIONS['upload_local'].extend([0,1,2,3])
PERMISSIONS['upload_global'].extend([2,3])
