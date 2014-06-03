import os, json, re, tornado.web, requests, urllib
from sys import exit, argv
from time import sleep

from api import InformaAPI
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result
from lib.Frontend.lib.Core.Utils.funcs import parseRequestEntity, generateMD5Hash, asTrueValue

from conf import INFORMA_BASE_DIR, INFORMA_CONF_ROOT, INFORMA_USER_ROOT, DEBUG, WEB_TITLE, buildServerURL
from vars import INFORMA_SYNC_TYPES, InformaCamCookie

class InformaFrontend(UnveillanceFrontend, InformaAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		InformaAPI.__init__(self)
		
		# sketchy...
		from conf import UNVEILLANCE_LM_VARS
		self.UNVEILLANCE_LM_VARS.update(UNVEILLANCE_LM_VARS)
		
		self.reserved_routes.extend(["ictd", "auth", "commit"])
		self.routes.extend([
			(r"/ictd/", self.ICTDHandler),
			(r"/auth/(drive|globaleaks|annex)", self.AuthHandler),
			(r"/commit/", self.DriveHandler)])
		
		self.default_on_loads = [
			'http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.js',
			'/web/js/lib/sammy.js',
			'/web/js/lib/crossfilter.min.js',
			'/web/js/lib/d3.min.js',
			'/web/js/lib/visualsearch.js',
			'/web/js/lib/jquery.ui.core.js',
			'/web/js/lib/jquery.ui.position.js',
			'/web/js/lib/jquery.ui.widget.js',
			'/web/js/lib/jquery.ui.menu.js',
			'/web/js/lib/jquery.ui.autocomplete.js',
			'/web/js/viz/uv_viz.js',
			'/web/js/models/ic_user.js',
			'/web/js/models/ic_visual_search.js',
			'/web/js/informacam.js', 
		]
		self.on_loads['setup'].extend([
			'/web/js/models/ic_annex.js',
			'/web/js/modules/ic_setup.js'
		])
		self.on_loads.update({
			'submission' : [
				'/web/js/viz/uv_indented_tree.js',
				'/web/js/viz/ic_timeseries_graph.js',
				'/web/js/viz/ic_timeseries_chart.js',
				'/web/js/viz/ic_map.js',
				'/web/js/models/ic_j3m.js',
				'/web/js/models/ic_submission.js',
				'/web/js/modules/ic_submission.js'],
			'main' : [
				'/web/js/viz/uv_indented_tree.js',
				'/web/js/viz/ic_timeseries_graph.js',
				'/web/js/viz/ic_timeseries_chart.js',
				'/web/js/viz/ic_map.js',
				'/web/js/models/ic_document_browser.js',
				'/web/js/models/ic_j3m.js',
				'/web/js/models/ic_collection.js',
				'/web/js/models/ic_source.js',
				'/web/js/models/ic_submission.js',
				'/web/js/modules/main.js']
		})
		
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.init.json"), 'rb') as IV:
			self.init_vars.update(json.loads(IV.read())['web'])
		
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
	
	"""
		Custom handlers
	"""
	class ICTDHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			self.finish("ICTD GOES HERE")
	
	class AuthHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self, auth_type):
			endpoint = "/"
			
			if auth_type == "drive":
				if self.application.do_get_status(self) != 3:
					self.redirect(endpoint)
					return

				try:
					if self.application.drive_client.authenticate(
						parseRequestEntity(self.request.query)['code']):
							if self.application.initDriveClient(restart=True):
								self.application.do_send_public_key(self)
				except KeyError as e:
					if DEBUG: print "no auth code. do step 1\n%s" % e
					endpoint = self.application.drive_client.authenticate()
				except AttributeError as e:
					if DEBUG: print "no drive client even started! do that first\n%s" % e

					if not self.application.initDriveClient():
						if DEBUG: print "client has no auth. let's start that"
						
						from conf import getSecrets
						endpoint = getSecrets(
							key="informacam.sync")['google_drive']['redirect_uri']
					else:
						if DEBUG: print "client has been authenticated already."
			
			elif auth_type == "annex":
				if self.application.do_get_status(self) == 3:
					from lib.Frontend.Models.uv_fabric_process import UnveillanceFabricProcess
					from lib.Frontend.Utils.fab_api import linkLocalRemote
					
					p = UnveillanceFabricProcess(linkLocalRemote)
					p.join()
					
					try:
						endpoint = "/#linked_remote_%s" % p.output
					except AttributeError as e:
						if DEBUG: print e
					
			self.redirect(endpoint)
		
		@tornado.web.asynchronous
		def post(self, auth_type):
			res = Result()
			
			if auth_type == "drive" and self.do_get_status in [3,4]:
				status_check = "get_drive_status"
			elif auth_type == "user":
				status_check = "get_user_status"
			
			if status_check is not None:
				res = self.application.routeRequest(res, status_check, self)
			
			if DEBUG: print res.emit()
			
			self.set_status(res.result)
			self.finish(res.emit())
	
	class DriveHandler(tornado.web.RequestHandler):
		def get(self):
			endpoint = "/"			
			res = self.application.routeRequest(Result(), "open_drive_file", self)
			
			if DEBUG: print res.emit()
			
			if res.result == 200 and hasattr(res, "data"):
				endpoint += "#collection=%s" % json.dumps(res.data)
			
			self.redirect(endpoint)
	
	"""
		Frontend-accessible methods
	"""
	def do_open_drive_file(self, handler):
		if DEBUG: print "opening this drive file in informacam annex"
		status = self.do_get_status(handler)
		if status not in [2,3]: 
			if DEBUG: print "NO-ACCESS TO THIS METHOD (\"do_open_drive_file\")"
			return None
		
		files = None
			
		for _id in parseRequestEntity(handler.request.query)['_ids']:
			_id = urllib.unquote(_id).replace("'", "")[1:]
			file_name = self.drive_client.getFileName(_id)

			if file_name is None: return None
			url = "%s/documents/?file_name=%s" % (buildServerURL(), file_name)

			entry = None
			handled_file = None
		
			if DEBUG: print url
			
			# look up the file in annex. (annex/documents/?file_name=file)
			# if this file exists in annex, return its _id for opening in-app
			try:
				entry = json.loads(requests.get(
					url, verify=False).content)['data']['documents'][0]
			except Exception as e:
				if DEBUG: print "COULD NOT GET ENTRY:\n%s" % e
			
			if entry is not None:
				print type(entry['_id'])
				handled_file = { '_id' : entry['_id'] }
			else:
				if status != 3:
					if DEBUG:
						print "** at this point, we would process file if you were admin"
						print "** but you are not admin."
					
					return None
						
				entry = self.drive_client.download(_id, save=False)
				if entry is not None:						
					p = UnveillanceFabricProcess(netcat, {
						'file' : entry[0],
						'save_as' : entry[1],
						'password' : getSecrets(key="unveillance.local_remote")['pwd']
					})
					p.join()
			
					if p.output is not None:
						if DEBUG: print p.output
						handled_file = { 'file_name' : entry[1] }
					
					if DEBUG and p.error is not None: print p.error
			
			if handled_file is not None:
				if files is None: files = []
				files.append(handled_file)
		
		return files
	
	# /Users/LvH/Proj/InformaCam2/glsp_remote_test
	def do_get_admin_party_status(self, handler):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		from conf import INFORMA_USER_ROOT
		for _, _, files in os.walk(INFORMA_USER_ROOT):
			for f in files: return False
		
		return True
	
	def do_get_user_status(self, handler):
		status = self.do_get_status(handler)

		if status == 0: return None		
		if self.do_get_admin_party_status(handler): return 4
		
		return status
		
	def do_get_status(self, handler):
		try:
			for cookie in handler.request.cookies:
				if cookie == InformaCamCookie.PUBLIC: return 0
		except KeyError as e: pass
		
		access = handler.get_secure_cookie(InformaCamCookie.USER)
		if access is not None:
			if handler.get_secure_cookie(InformaCamCookie.ADMIN) is not None:
				return 3
				
			return 2

		#return 1
		return 3
	
	def do_get_drive_status(self, handler=None):
		if handler is not None:
			if self.do_get_status(handler) == 0: return None
			# TODO: actually, if not 3

		if hasattr(self, "drive_client"):
			if hasattr(self.drive_client, "service"):
				return True

		return False
		
	def do_init_informacam(self, handler):
		status = self.do_get_user_status(handler)
		if status != 4: return None
		
		if DEBUG: print "Initing INFORMA"
		informacam_annex = parseRequestEntity(handler.request.body)
		if informacam_annex is None:  return None
		
		if DEBUG: print informacam_annex
		ictd_rx = r"informacam\.ictd\.(\S+)"
		ictd_path = os.path.join(INFORMA_CONF_ROOT, "informacam.ictd.yaml")

		sec_rx = r"informacam\.gpg\.(\S+)"
		sec_path = os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json")
		
		conf_rx = r"informacam\.config\.(\S+)"
		conf_path = os.path.join(CONF_ROOT, "local.config.yaml")
		
		pwd_rx = "unveillance.local_remote.password"

		new_username = None
		new_password = None
		
		for k, v in informacam_annex.iteritems():
			if DEBUG: print k, v
			if v == "null": continue
			
			ictd_info = re.findall(ictd_rx, k)
			conf_info = re.findall(conf_rx, k)
			
			if len(ictd_info) == 1:
				with open(ictd_path, "ab") as ictd:
					ictd.write("%s: %s\n" % (ictd_info[0], v))
			elif len(conf_info) == 1:
				with open(conf_path, "ab") as informa_conf:
					informa_conf.write("%s: %s\n" % (conf_info[0], v))
					if conf_info[0] == "admin.username": new_username = v
			elif re.match(sec_rx, k):
				with open(sec_path, "rb") as sec_conf:
					sec = json.loads(sec_conf.read())
					sec.update({ k : v })
					
				with open(sec_path, "wb+") as sec_conf:
					sec_conf.write(json.dumps(sec))
			elif k == pwd_rx:
				new_password = v
		"""
			1. init encryption config etc.
		"""
		from lib.Frontend.lib.Core.Utils.funcs import generateSecureRandom, generateNonce
		with open(conf_path, 'ab') as informa_conf:
			informa_conf.write("encryption.iv: %s\n" % generateSecureRandom())
			informa_conf.write("encryption.salt: %s\n" % generateSecureRandom())
			informa_conf.write("encryption.doc_salt: \"%s\"\n" % generateNonce())
			informa_conf.write("encryption.user_salt: \"%s\"\n" % generateNonce())
		
		
		"""
			2. create new informacam admin user
		"""
		if new_username is None or new_password is None: 
			if DEBUG: print "NO USERNAME or PASSWORD?"
			return None
		
		try:
			if self.createNewUser(new_username, new_password, as_admin=True):
				return self.loginUser(new_username, new_password, handler)
				
		except Exception as e:
			if DEBUG: print e
		
		return None

	def do_logout(self, handler):
		status = self.do_get_status(handler)
		if status not in [2, 3]:
			if DEBUG: print "CANNOT LOG IN USER, DON'T EVEN TRY (status %d)" % status
			return None
				
		credentials = parseRequestEntity(handler.request.body)
		if credentials is None: return None
		if DEBUG: print credentials
		
		return self.logoutUser(self, credentials, handler)
	
	def do_login(self, handler):
		status = self.do_get_status(handler)
		if status != 1:
			if DEBUG: print "CANNOT LOG IN USER, DON'T EVEN TRY (status %d)" % status
			return None
		
		credentials = parseRequestEntity(handler.request.body)
		if credentials is None: return None
		if DEBUG: print credentials
		
		try:	
			return self.loginUser(credentials['username'], 
				credentials['password'], handler)
		except KeyError as e:
			if DEBUG: print "CANNOT LOG IN USER: %s missing" % e
			return None
	
	"""
		Overrides
	"""
	def do_send_public_key(self, handler):
		status = self.do_get_user_status(handler)
		if status != 4: return None
		
		super(InformaFrontend, self).do_send_public_key(handler)
		
		from conf import getConfig, getSecrets, INFORMA_CONF_ROOT
		
		uploaded = []
		uploads = [
			("%.pub" % getConfig('unveillance.local_remote.pub_key'),
				"unveillance.local_remote.pub_key", False),
			(os.path.join(INFORMA_CONF_ROOT, "informacam.gpg.priv_key.file"),
				"informacam.gpg.priv_key.file", True),
			(os.path.join(INFORMA_CONF_ROOT, "informacam.gpg.priv_key.password"),
				"informacam.gpg.priv_key.password", True)]

		with open(uploads[2][0], 'wb+') as P:
			P.write(getSecrets(key='informacam.gpg.priv_key.password'))
				
		for _, _, files in os.walk(INFORMA_CONF_ROOT):
			for file in files:
				if re.match(r'informacam.form.(?:.*\.xml)', file):
					uploads.append((os.path.join(INFORMA_CONF_ROOT, file), file, True))
			
		for u in uploads:
			upload = self.drive_client.upload(u[0], title=u[1])
		
			try:
				uploaded.append(self.drive_client.share(upload['id']))
				if u[2]: os.remove(u[0])
			except KeyError as e:
				if DEBUG: print e
		
		if len(uploaded) == 0 : return None
		return uploaded
	
	def do_link_annex(self, handler):
		status = self.do_get_status(handler)
		if status != 3: return None
		
		return super(CompassFrontend, self).do_link_annex(handler)
	
	def do_init_synctask(self, handler):
		status = self.do_get_status(handler)
		if status != 3: return None
		
		return super(InformaFrontend, self).do_init_synctask(handler)
	
	def do_init_annex(self, handler):
		status = self.do_get_user_status(handler)
		if status != 4: return None
		
		credentials, result = super(InformaFrontend, self).do_init_annex(handler)
		if DEBUG: print credentials

		try:
			return { 'credentials' : credentials, 'task_result' : result }
		except Exception as e:
			if DEBUG: print e
		
		return None
		
	def do_post_batch(self, handler, save_local=False):
		status = self.do_get_user_status(handler)
		if status not in [3, 4]: return None
		
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