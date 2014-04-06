import os, json, re, tornado.web, requests
from sys import exit, argv
from time import sleep

from api import InformaAPI
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.Utils.uv_result import Result

from conf import INFORMA_BASE_DIR, INFORMA_CONF_ROOT, DEBUG
from vars import INFORMA_SYNC_TYPES

class InformaFrontend(UnveillanceFrontend, InformaAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		InformaAPI.__init__(self)
		
		self.reserved_routes.extend(["ictd"])
		self.routes.extend([(r"/ictd/", self.ICTDHandler)])
				
		self.on_loads['setup'].extend([
			'/web/js/models/ic_annex.js',
			'/web/js/modules/ic_setup.js'
		])
		
		repo_data_rx = r"informacam\.repository\.(?:(%s))\.[\S]+" % "|".join(INFORMA_SYNC_TYPES)
		ictd_rx = r"informacam\.ictd"
		forms_rx = r"informacam\.form"
		gpg_rx = r"informacam\.gpg\.priv_key\.file"
		
		self.local_file_rx = [ictd_rx, repo_data_rx, forms_rx, gpg_rx]
	
	class ICTDHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			self.finish("ICTD GOES HERE")
	
	def do_init_annex(self, request):
		credentials, password = super(InformaFrontend, self).do_init_annex(request)
		
		"""
			1. encrypt secrets to password, and login user here.
		"""
		
	def do_post_batch(self, request, save_local=False):
		if DEBUG: print "PRE-PROCESSING POST_BATCH FILES FIRST"
		
		"""
		we have to pre-prepare some of the files as they come in. so...
		"""
		for file in request.files.keys():
			for rx in [rx for rx in self.local_file_rx if re.match(re.compile(rx), file)]:
				return super(InformaFrontend, self).do_post_batch(request, 
					save_local=True, save_to=INFORMA_CONF_ROOT)

		return super(InformaFrontend, self).do_post_batch(request, save_local)

if __name__ == "__main__":
	informa_frontend = InformaFrontend()
	
	if len(argv) != 2: exit("Usage: informa_frontend.py [-start, -stop, -restart]")
	
	if argv[1] == "-start" or argv[1] == "-firstuse":
		informa_frontend.startup()
	elif argv[1] == "-stop":
		informa_frontend.shutdown()
	elif argv[1] == "-restart":
		informa_frontend.shutdown()
		sleep(5)
		informa_frontend.startup()