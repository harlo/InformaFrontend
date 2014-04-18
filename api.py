import json, re, os, copy
from base64 import b64encode, b64decode
from Crypto.Cipher import AES

from conf import DEBUG, INFORMA_CONF_ROOT, INFORMA_USER_ROOT
from vars import USER_CREDENTIAL_PACK, InformaCamCookie
from lib.Frontend.lib.Core.Utils.funcs import parseRequestEntity

class InformaAPI():
	def __init__(self):
		print "InformaAPI STARTED TOO!!!"
		
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
				with open(sec_path, "wb+") as sec: sec.write(json.dumps({ k : v }))
		
		try:
			with open(sec_path, 'rb') as sec: pass
		except IOError as e: return None

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
				except KeyError as e: pass
				
				handler.set_secure_cookie(InformaCamCookie.USER, 
					b64encode(json.dumps(user_data)), path="/", expires_days=1)
				return user_data
		except Exception as e:
			if DEBUG: print e		
		
		return None
	
	def encryptUserData(self, plaintext, password, iv=None, p_salt=None):
		if p_salt is not None:
			password = password + p_salt
		
		if iv is None: iv = generateSecureRandom()
		else: iv = iv.decode('hex')
		
		aes = AES.new(generateMD5Hash(content=password), AES.MODE_CBC, iv)
		ciphertext = {
			'iv' : iv.encode('hex'), 
			'data' : aes.encrypt(self.pad(json.dumps(plaintext)).encode('hex'))
		}
		
		return b64encode(json.dumps(ciphertext))
	
	def decyptUserData(self, ciphertext, password, iv=None, p_salt=None):
		try:
			ciphertext_json = json.loads(b64decode(ciphertext))
			ciphertext = ciphertext_json['data'].decode('hex')
		except Exception as e:
			if DEBUG: print e
			return None
		
		if p_salt is not None:
			password = password + p_salt
		
		try:
			if iv is None: iv = ciphertext_json['iv'].decode('hex')
			else: 
				try:
					from conf import IV
				except ImportError as e:
					if DEBUG: print e
					return None

				iv = IV.decode('hex')
		except Exception as e:
			if DEBUG: print e
			return None
		
		aes = AES.new(generateMD5Hash(content=password), AES.MODE_CBC, iv)
		user_data = json.loads(self.unpad(aes.decrypt(ciphertext)))
		
		if user_data['username']: return user_data
		return None
	
	def unpad(self, plaintext): 
		return plaintext[plaintext.index("{"):]
	
	def pad(self, plaintext):
		pad = len(plaintext) % AES.block_size
		
		if pad != 0:
			pad_from = len(plaintext) - pad
			pad_size = (pad_from + AES.block_size) - len(plaintext)
			plaintext = "".join(["*" for x in xrange(pad_size)]) + plaintext
		
		return plaintext
	
	def createNewUser(self, username, password, as_admin=False):
		try:
			from conf import IV, SALT, USER_SALT
		except ImportError as e:
			if DEBUG: print e
			return None
			
		try:
			user_data = copy.deepcopy(USER_CREDENTIAL_PACK)
			user_data['username'] = username
			if as_admin:
				user_data['admin'] = True
				if DEBUG: print "creating %s as admin!" % username
			
			user_root = "%s.txt" % generateMD5Hash(content=username, salt=USER_SALT)
			if os.path.exists(os.path.join(INFORMA_USER_ROOT, user_root)):
				if DEBUG: print "user already exists NOPE!"
				return False
			
			with open(user_root, 'wb+') as user:
				user.write(self.encrypt(user_data, password, p_salt=SALT, iv=IV))
				try:
					if user_data['admin']: del user_data['admin']
				except KeyError as e: pass
				
				return True

		except Exception as e: print e		
		return False