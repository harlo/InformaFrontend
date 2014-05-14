import os, json, re, tornado.web, requests
from sys import exit, argv
from time import sleep

from api import InformaAPI
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.Utils.funcs import parseRequestEntity

from conf import INFORMA_BASE_DIR, INFORMA_CONF_ROOT, DEBUG, WEB_TITLE
from vars import INFORMA_SYNC_TYPES, InformaCamCookie

class InformaFrontend(UnveillanceFrontend, InformaAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		InformaAPI.__init__(self)
		
		self.reserved_routes.extend(["ictd", "auth"])
		self.routes.extend([
			(r"/ictd/", self.ICTDHandler),
			(r"/auth/(drive|globaleaks)", self.AuthHandler)])
		
		self.default_on_loads = [
			'/web/js/lib/sammy.js',
			'/web/js/lib/visualsearch.js',
			'/web/js/lib/jquery.ui.core.js',
			'/web/js/lib/jquery.ui.position.js',
			'/web/js/lib/jquery.ui.widget.js',
			'/web/js/lib/jquery.ui.menu.js',
			'/web/js/lib/jquery.ui.autocomplete.js',
			'/web/js/informacam.js', 
			'/web/js/models/ic_user.js'
		]
		self.on_loads['setup'].extend([
			'/web/js/models/ic_annex.js',
			'/web/js/modules/ic_setup.js'
		])
		self.on_loads.update({
			'submissions' : ['/web/js/modules/ic_submissions.js'],
			'submission' : [
				'/web/js/lib/crossfilter.min.js',
				'/web/js/lib/d3.min.js',
				'/web/js/viz/uv_viz.js',
				'/web/js/viz/uv_indented_tree.js',
				'/web/js/viz/ic_timeseries_graph.js',
				'/web/js/viz/ic_timeseries_chart.js',
				'/web/js/modules/ic_submission.js',
				'/web/js/models/ic_submission.js'],
			'sources' : ['/web/js/modules/ic_sources.js'],
			'main' : [
				'/web/js/lib/d3.min.js',
				'/web/js/viz/uv_viz.js',
				'/web/js/viz/uv_colored_cluster.js',
				'/web/js/models/unveillance_cluster.js',
				'/web/js/modules/ic_main_cluster.js']
		})
		
		repo_data_rx = r"informacam\.repository\.(?:(%s))\.[\S]+" % "|".join(INFORMA_SYNC_TYPES)
		ictd_rx = r"informacam\.ictd"
		forms_rx = r"informacam\.form"
		gpg_rx = r"informacam\.gpg\.priv_key\.file"
		self.local_file_rx = [ictd_rx, repo_data_rx, forms_rx, gpg_rx]
		
		tmpl_root = os.path.join(INFORMA_BASE_DIR, "web", "layout", "tmpl")
		self.INDEX_HEADER = os.path.join(tmpl_root, "header.html")
		self.INDEX_FOOTER = os.path.join(tmpl_root, "footer.html")
		self.MODULE_HEADER = self.INDEX_HEADER
		self.MODULE_FOOTER = self.INDEX_FOOTER

		self.WEB_TITLE = WEB_TITLE
	
	class AuthHandler(tornado.web.RequestHandler):			
		@tornado.web.asynchronous
		def get(self, auth_type):
			if DEBUG: print "AUTH TYPE: %s" % auth_type
			
			from conf import getSecrets, saveSecret, INFORMA_CONF_ROOT
			endpoint = "/"
			
			if auth_type == "drive":
				SYNC_CONF = getSecrets(key="informacam.sync")
				
				try:
					if DEBUG: print parseRequestEntity(self.request.query)
					
					auth_code = parseRequestEntity(self.request.query)['code']
					auth_storage = os.path.join(INFORMA_CONF_ROOT, "drive.secrets.json")

					credentials = self.application.flow.step2_exchange(auth_code)
					
					from oauth2client.file import Storage
					Storage(auth_storage).put(credentials)
					
					SYNC_CONF['google_drive'].update({
						'auth_storage' : auth_storage,
						'account_type' : "user"
					})
				
					if DEBUG: print SYNC_CONF
					saveSecret("informacam.sync", SYNC_CONF)
					del self.application.flow
					
				except KeyError as e:
					print "no auth code. do step 1\n%s" % e
					
					from oauth2client.client import OAuth2WebServerFlow
					from oauth2client.file import Storage
					from conf import API_PORT
					
					GD = SYNC_CONF['google_drive']
					self.application.flow = OAuth2WebServerFlow(
						GD['client_id'], GD['client_secret'],
						GD['scopes'], 
						"http://localhost:%d%s" % (API_PORT, GD['redirect_uri']))
					
					endpoint = self.application.flow.step1_get_authorize_url()				

			self.redirect(endpoint)			
	
	class ICTDHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			self.finish("ICTD GOES HERE")
	
	def do_init_synctask(self, handler):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		return super(InformaFrontend, self).do_init_synctask(handler)
	
	def do_init_annex(self, handler):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		credentials, password = super(InformaFrontend, self).do_init_annex(handler)
		
		"""
			1. create new informacam admin user
		"""
		from conf import ADMIN_USERNAME
		return self.createNewUser(ADMIN_USERNAME, password, as_admin=True)
		
	def do_post_batch(self, handler, save_local=False):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		if DEBUG: print "PRE-PROCESSING POST_BATCH FILES FIRST"
		
		"""
		we have to pre-prepare some of the files as they come in. so...
		"""
		for file in handler.request.files.keys():
			for rx in [rx for rx in self.local_file_rx if re.match(re.compile(rx), file)]:
				return super(InformaFrontend, self).do_post_batch(handler, 
					save_local=True, save_to=INFORMA_CONF_ROOT)

		return super(InformaFrontend, self).do_post_batch(handler, save_local)

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