import json, copy
from time import time, sleep

from lib.Frontend.lib.Core.Utils.funcs import generateMD5Hash
from vars import MIME_TYPES, MIME_TYPE_MAP
from conf import DOC_SALT

class InformaCamSyncClient(object):
	def __init__(self, log_path, mode):
		self.mime_types = copy.deepcopy(MIME_TYPES)
		self.mime_type_map = copy.deepcopy(MIME_TYPE_MAP)
		self.log_path = log_path
		
		try:
			with open(self.log_path, 'rb') as log:
				self.absorbed_log = json.loads(log.read())
		except:
			self.absorbed_log = { 'sources': 0, 'submissions': 0 }
		
		self.mode = mode
		self.last_update_for_mode = self.absorbed_log[mode]
		self.usable = True
	
	def getFileNameHash(self, name_base):
		return generateMD5Hash(content=name_base, salt=DOC_SALT)
	
	def updateLog(self, num_tries=0):
		if num_tries >= 10: return
		
		self.absorbed_log[self.mode] = self.last_update_for_mode
		try:
			with open(self.log_path, 'wb+') as log:
				log.write(json.dumps(self.absorbed_log))
		except IOError as e:
			num_tries += 1
			sleep(2)
			self.updateLog(self.log_path, num_tries)