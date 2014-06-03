import json, re, os, copy
from time import sleep
from base64 import b64encode, b64decode
from Crypto.Cipher import AES

from Models.ic_drive_client import InformaCamDriveClient
from lib.Frontend.lib.Core.Utils.funcs import generateMD5Hash

from conf import DEBUG, INFORMA_USER_ROOT
from vars import USER_CREDENTIAL_PACK, InformaCamCookie

class InformaAPI():
	def __init__(self):
		print "InformaAPI STARTED TOO!!!"

	def initDriveClient(self, restart=False):
		if DEBUG: print "INITING DRIVE CLIENT"		
		if not hasattr(self, "drive_client") or restart:
			self.drive_client = InformaCamDriveClient()
			sleep(2)
	
		return self.do_get_drive_status()
		
	def encryptUserData(self, plaintext, password, iv=None, p_salt=None):
		if p_salt is not None:
			password = password + p_salt
		
		if iv is None: iv = generateSecureRandom()
		else: iv = iv.decode('hex')
		
		aes = AES.new(generateMD5Hash(content=password), AES.MODE_CBC, iv)
		ciphertext = {
			'iv' : iv.encode('hex'), 
			'data' : aes.encrypt(self.pad(json.dumps(plaintext))).encode('hex')
		}
		
		print ciphertext
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
			
			print user_data
			
			with open(user_root, 'wb+') as user:
				user.write(self.encryptUserData(user_data, password, p_salt=SALT, iv=IV))
				try:
					if user_data['admin']: del user_data['admin']
				except KeyError as e: pass
				
				return True

		except Exception as e: print e		
		return False
	
	def logoutUser(self, credentials, handler):
		handler.clear_cokie(InformaCamCookie.USER)
		handler.clear_cookie(InformaCamCookie.ADMIN)
		
		try:
			password = credentials['password']
		except KeyError as e: return True
		
		try:
			username = credentials['username']
		except KeyError as e: return None
		
		try:
			from conf import IV, SALT, USER_SALT
		except ImportError as e:
			if DEBUG: print e
			return None
				
		user_root = "%s.txt" % generateMD5Hash(content=username,salt=USER_SALT)
		with open(os.path.join(INFORMA_USER_ROOT, user_root), 'rb') as UD:
			user_data = self.decrypt(UD.read, password, p_salt=SALT)
			
			if user_data is None: return None
			
			new_data = copy.deepcopy(user_data)
			new_data['saved_searches'] = credentials['save_data']['saved_searches']
		
		with open(os.path.join(INFORMA_USER_ROOT, user_root), 'wb+') as UD:
			UD.write(self.encrypt(new_data, password, iv=IV, p_salt=SALT))
			return True
		
		return None
	
	def loginUser(self, username, password, handler):
		try:
			from conf import SALT, USER_SALT
		except ImportError as e:
			if DEBUG: print e
			return None
		
		try:
			user_root = "%s.txt" % generateMD5Hash(content=username, salt=USER_SALT)
			with open(os.path.join(INFORMA_USER_ROOT, user_root), 'rb') as UD:
				user_data = self.decryptUserData(UD.read(), password, p_salt=SALT)
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