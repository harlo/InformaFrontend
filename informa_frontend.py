import os, json, re, tornado.web, requests
from sys import exit, argv
from time import sleep

from api import InformaAPI
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result
from lib.Frontend.lib.Core.Utils.funcs import parseRequestEntity, generateMD5Hash

from conf import INFORMA_BASE_DIR, INFORMA_CONF_ROOT, INFORMA_USER_ROOT, DEBUG, WEB_TITLE
from vars import INFORMA_SYNC_TYPES, InformaCamCookie

class InformaFrontend(UnveillanceFrontend, InformaAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		InformaAPI.__init__(self)
		
		# sketchy...
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
					if DEBUG: print "no drive client even started! do that first\n%s" % e

					if not self.application.initDriveClient():
						if DEBUG: print "client has no auth. let's start that"
						
						from conf import getSecrets
						endpoint = getSecrets(
							key="informacam.sync")['google_drive']['redirect_uri']
					else:
						if DEBUG: print "client has been authenticated already."
					
			self.redirect(endpoint)
		
		@tornado.web.asynchronous
		def post(self, auth_type):
			res = Result()
			
			if auth_type == "drive":
				status_check = "get_drive_status"
			
			if status_check is not None:
				res = self.application.routeRequest(res, status_check, self)
			
			self.set_status(res.result)
			self.finish(res.emit())
	
	
	"""
		Frontend-accessible methods
	"""
		
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

		return 1
	
	def do_get_drive_status(self, handler=None):
		if handler is not None:
			if self.do_get_status(handler) == 0: return False
			# TODO: actually, not 3

		if hasattr(self, "drive_client"):
			if hasattr(self.drive_client, "service"):
				return True

		return False
		
	def do_init_informacam(self, handler):
		status = self.do_get_status(handler)
		if status == 0: return None
		
		if DEBUG: print "Initing INFORMA"
		informacam_annex = parseRequestEntity(handler.request.body)
		if informacam_annex is None:  return None
		
		if DEBUG: print informacam_annex
		ictd_rx = r"informacam\.ictd\.(\S+)"
		ictd_path = os.path.join(INFORMA_CONF_ROOT, "informacam.ictd.yaml")

		sec_rx = r"informacam\.gpg\.(\S+)"
		sec_path = os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json")
		
		conf_rx = r"informacam\.conf\.(\S+)"
		conf_path = os.path.join(INFORMA_CONF_ROOT, "informacam.config.yaml")

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
			elif re.match(sec_rx, k):
				with open(sec_path, "rb") as sec_conf:
					sec = json.loads(sec_conf.read())
					sec.update({ k : v })
				with open(sec_path, "wb+") as sec_conf:
					sec_conf.write(json.dumps(sec))
		"""
			1. init keys and write fingerprint
		"""
		import gnupg
		
		pk_path = os.path.join(INFORMA_CONF_ROOT, "informacam.gpg.priv_key.file")
		gpg_homedir = os.path.join(INFORMA_CONF_ROOT, ".gpg")
		if not os.path.exists(gpg_homedir): os.mkdir(gpg_homedir)
		
		gpg = gnupg.GPG(homedir=gpg_homedir)		
		
		try:
			with open(pk_path, 'rb') as pk:
				private_key = pk.read()
				gpg.import_keys(private_key)
				
				packet_res = gpg.list_packets(private_key).data.split("\n")
				for line in packet_res:
					if DEBUG: print line
					if re.match(r"^:signature packet:", line):
						k_id = line[-16:]
						break
				
				key_res = [key for key in gpg.list_keys() if key['keyid'] == k_id]
				if len(key_res) != 1: return None
				
				with open(ictd_path, 'ab') as ictd:
					ictd.write("organizationFingerprint: %s\n") % key_res[0]['fingerprint']
				
				pub_path = os.path.join(INFORMA_CONF_ROOT, "informacam.gpg.pub_key.file")
				with open(pub_path, 'wb+') as public_key:
					public_key.write(gpg.export_keys([k_id])[0])
				
		except IOError as e:
			print e
			return None
		"""
			2. init encryption config etc.
		"""
		from lib.Frontend.lib.Core.Utils.funcs import generateSecureRandom, generateNonce
		with open(conf_path, 'ab') as informa_conf:
			informa_conf.write("encryption.iv: %s\n" % generateSecureRandom())
			informa_conf.write("encryption.salt: %s\n" % generateSecureRandom())
			informa_conf.write("encryption.doc_salt: %s\n" % generateNonce())
			informa_conf.write("encryption.user_salt: %s\n" % generateNonce())		
		
		"""
			3. run init_informacam.sh to cleanup
		"""
		from conf import ANNEX_DIR
		p = Popen([os.path.join("init_informacam.sh"), ANNEX_DIR])
		p.wait()
			
		return None
	
	def do_logout(self, handler):
		status = self.do_get_status(handler)
		if status not in [2, 3]: return None
				
		credentials = parseRequestEntity(handler.request.body)
		if credentials is None: return None
		if DEBUG: print credentials
		
		handler.clear_cookie(InformaCamCookie.USER)
		handler.clear_cookie(InformaCamCookie.ADMIN)
		
		try:
			password = credentials['password']
		except KeyError as e: return True
		
		try:
			from conf import IV, SALT, USER_SALT
		except ImportError as e:
			if DEBUG: print e
			return None
		
		user_root = "%s.txt" % generateMD5Hash(content=credentials['username'],salt=USER_SALT)
		
		with open(os.path.join(INFORMA_USER_ROOT, user_root), 'rb') as UD:
			user_data = self.decrypt(UD.read, password, p_salt=SALT)
			
			if user_data is None: return None
			
			new_data = copy.deepcopy(user_data)
			new_data['saved_searches'] = credentials['save_data']['saved_searches']
		
		with open(os.path.join(INFORMA_USER_ROOT, user_root), 'wb+') as UD:
			UD.write(self.encrypt(new_data, password, iv=IV, p_salt=SALT))
			return True
		
		return None
	
	def do_login(self, handler):
		status = self.do_get_status(handler)
		if status != 1:	return None
		
		credentials = parseRequestEntity(handler.request.body)
		if credentials is None: return None
		if DEBUG: print credentials
		
		try:
			from conf import SALT, USER_SALT
		except ImportError as e:
			if DEBUG: print e
			return None
		
		try:
			user_root = "%s.txt" % generateMD5Hash(content=credentials['username'],
				salt=USER_SALT)

			with open(os.path.join(INFORMA_USER_ROOT, user_root), 'rb') as UD:
				user_data = self.decryptUserData(UD.read(), 
					credentials['password'], p_salt=SALT)
				if user_data is None: return None
				try:
					if user_data['admin']: 
						del user_data['admin']
						handler.set_secure_cookie(InformaCamCookie.ADMIN, 
							"true", path="/", expires_days=1)
							
						if not self.do_get_drive_status():
							if not self.initDriveClient():
								from conf import getSecrets
								user_data['auth_redir'] = getSecrets(										key="informacam.sync")['google_drive']['redirect_uri']

				except KeyError as e: pass
				
				handler.set_secure_cookie(InformaCamCookie.USER, 
					b64encode(json.dumps(user_data)), path="/", expires_days=1)
				return user_data
		except Exception as e:
			if DEBUG: print e		
		
		return None
	
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
		# TODO: actually, it should be 2 or 3 ONLY.
		
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