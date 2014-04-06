import json, re, os

from conf import DEBUG, INFORMA_CONF_ROOT
from lib.Frontend.lib.Core.Utils.funcs import parseRequestEntity

class InformaAPI():
	def __init__(self):
		print "InformaAPI STARTED TOO!!!"
	
	def do_init_informacam(self, request):
		if DEBUG: print "Initing INFORMA"
		informacam_annex = parseRequestEntity(request.body)
		if informacam_annex is None:  return None
		
		if DEBUG: print informacam_annex
		ictd_rx = r"informacam\.ictd\.(\S+)"
		ictd_path = os.path.join(INFORMA_CONF_ROOT, "informacam.ictd.yaml")

		sec_rx = r"informacam\.gpg\.(\S+)"
		sec_path = os.path.join(INFORMA_CONF_ROOT, "informacam.secrets.json")

		for k, v in informacam_annex.iteritems():
			if DEBUG: print k, v
			if v == "null": continue
			
			ictd_info = re.findall(ictd_rx, k)
			if len(ictd_info) == 1:
				with open(ictd_path, "ab") as ictd:
					ictd.write("%s: %s\n" % (ictd_info[0], v))
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
		with open(conf_path, 'wb+') as informa_conf:
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