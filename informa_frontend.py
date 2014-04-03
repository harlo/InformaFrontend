import os, json, re, tornado.web, requests
from sys import exit, argv
from time import sleep

from conf import INFORMA_BASE_DIR, DEBUG
from api import InformaAPI

from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.vars import PostBatchStub
from lib.Frontend.lib.Core.Utils.uv_result import Result

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
	
	class ICTDHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			self.finish("ICTD GOES HERE")
	
	def do_post_batch(self, request, save_local=False):
		if DEBUG: print "PRE-PROCESSING POST_BATCH FILES FIRST"
		
		"""
		we have to pre-prepare some of the files as they come in. so...
		"""
		save_local_files = ["informacam.gpg_private_key.file"]
		file_stubs = []
		
		for file in save_local_files:
			if file in request.files.keys():
				"""
				1. gpg key has to be split into public and private
				"""
				if file == "informacam.gpg_private_key.file":
					private_key = request.files['informacam.gpg_private_key.file']['body']
					file_stubs.append((PostBatchStub(
						{'informacam.gpg_private_key.file' : private_key},
						request.uri), save_local=True))
			
					pk_start = "-----BEGIN PGP PRIVATE KEY BLOCK-----"
					public_key = private_key[:private_key.index(pk_start)]
					file_stubs.append((PostBatchStub(
						{'informacam.gpg_public_key.file' : public_key},
						request.uri), save_local=False))
		
		if len(file_stubs) == 0:
			return super(InformaFrontend, self).do_post_batch(request, save_local)
		else:
			res = Result()
			for file_stub in file_stubs:
				if super(InformaFrontend, self).do_post_batch(file_stub) is None:
					return res
		
			res.result = 200
		
		return None

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