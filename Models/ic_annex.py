import os, re
from subprocess import Popen, PIPE

from lib.Server.Models.uv_annex import UnveillanceAnnex
from conf import INFORMA_BASE_DIR, SSH_ROOT

class InformaAnnex(UnveillanceAnnex):
	def __init__(self, inflate=None, _id=None):		
		super(InformaAnnex, self).__init__(inflate=inflate, _id=_id)
	
	def create(self):
		# 1. init annex (sets ports)
		super(InformaAnnex, self).create()

		# 2. modify ssh config (host, identity file, port)
		# 3. make first contact to establish trust
		# 4. init git-annex on dir
		# 5. link local to remote
		# 6. update config with port
	
	def addRepository(self):
		print "adding a repo!"
	
	def save(self):
		print self.emit()