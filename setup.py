import os, json
from sys import exit
from farbic.operations import prompt

from lib.Frontend.lib.Core.Utils.funcs import generateNonce
from conf import CONF_ROOT

if __name__ == "__main__":
	try:
		with open(os.path.join(CONF_ROOT, "unveillance.secrets.json", 'rb') as CONF:
			config = json.loads(CONF.read())
	except Exception as e:
		print "NO CONF?"	
	
	if 'web_home_mime_types' in config.keys():
		default_home_mime_types = config['web_home_mime_types']
	else:
		default_home_mime_types = ["image/jpeg", "video/x-matroska"]
	
	with open(os.path.join(COMPASS_CONF_ROOT, "compass.init.json"), 'wb+') as WEB:
		WEB.write(json.dumps({
			'web' : {
				'BATCH_SALT' : generateNonce(),
				'DEFAULT_HOME_MIME_TYPES' : default_home_mime_types
			}
		})
		
	exit(0)