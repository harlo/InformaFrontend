import yaml, os

from conf import INFORMA_CONF_DIR

def updateConfig(new_values):
	with open(os.path.join(INFORMA_CONF_DIR, "local.config.yaml"), 'rb') as C:
		config = yaml.load(C.read())
	
	config.update(new_values)

	with open(os.path.join(INFORMA_CONF_DIR, "local.config.yaml"), 'wb+') as C:
		C.write(yaml.dump(config))