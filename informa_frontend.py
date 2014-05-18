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
		
		from conf import UNVEILLANCE_LM_VARS
		self.UNVEILLANCE_LM_VARS.update(UNVEILLANCE_LM_VARS)
		
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
		
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.init.json"), 'rb') as IV:
			self.init_vars = json.loads(IV.read())['web']
		
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
	
	class ICTDHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			self.finish("ICTD GOES HERE")
	
	class AuthHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self, auth_type):
			endpoint = "/"
			
			if auth_type == "drive":
				try:
					if self.application.drive_client.authenticate(
						parseRequestEntity(self.request.query)['code']):
							self.application.do_send_public_key(self)
				except KeyError as e:
					if DEBUG: print "no auth code. do step 1\n%s" % e
					endpoint = self.application.drive_client.authenticate()
				except AttributeError as e:
					self.application.initDriveClient()

					from conf import getSecrets
					endpoint = getSecrets(
						key="informacam.sync")['google_drive']['redirect_uri']
					
					
			self.redirect(endpoint)
	
	"""
		Overrides
	"""
	def do_send_public_key(self, handler):
		super(InformaFrontend, self).do_send_public_key(handler)
		
		from conf import getConfig
		upload = self.drive_client.upload(getConfig('unveillance.local_remote.pub_key'),
			title="unveillance.local_remote.pub_key")
		
		try:
			return self.drive_client.share(upload['id'])
		except KeyError as e:
			if DEBUG: print e
		
		return None
	
	def do_link_annex(self, handler):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		return super(CompassFrontend, self).do_link_annex(handler)
	
	def do_init_synctask(self, handler):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		return super(InformaFrontend, self).do_init_synctask(handler)
	
	def do_init_annex(self, handler):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		credentials, result = super(InformaFrontend, self).do_init_annex(handler)
		if DEBUG: print credentials
		
		"""
			1. create new informacam admin user
		"""
		return self.createNewUser(credentials['informacam.config.admin.username'],
			credentials['unveillance.local_remote.password'], as_admin=True)
		
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