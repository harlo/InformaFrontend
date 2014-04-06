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
		
		self.reserved_routes.extend(["ictd", "login", "logout"])
		self.routes.extend([(r"/ictd/", self.ICTDHandler),
			(r"/login/", self.LoginHandler),
			(r"/logout/", self.LogoutHandler)])
		
		self.default_on_loads = ['/web/js/models/ic_user.js']
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
	
	class LogoutHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def post(self):
			res = Result()
			do_logout = self.logout(self.request)
			
			if do_logout is not None:
				if do_logout: res.result = 200
				else: res.result = 412
				
			self.set_status(res.result)
			self.finish(res.emit())
			
	class LoginHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def post(self):
			res = Result()
			do_login = self.login(self.request)
			
			if do_login is not None: 
				res.result = 200
				res.data = do_login[0]
				
				if do_login[1]:
					self.set_secure_cookie(ADMIN_COOKIE_TAG, 
						"true", path="/", expires_days=1)
				
				from base64 import b64encode
				self.set_secure_cookie(NORMAL_LOGIN_TAG, 
					b64encode(json.dumps(do_login[0])), path="/", expires_days=1)
			
			else: res.result = 412
			
			self.set_status(res.result)
			self.finish(res.emit())
	
	def do_init_annex(self, request):
		credentials, password = super(InformaFrontend, self).do_init_annex(request)
		
		"""
			1. create new informacam admin user
		"""
		from conf import ADMIN_USERNAME
		return self.createNewUser(ADMIN_USERNAME, password, as_admin=True)
		
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