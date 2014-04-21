import requests, os
from conf import buildServerURL, getSecrets, ANNEX_DIR, DEBUG
from subprocess import Popen, PIPE

def decrypt():
	this_dir = os.getcwd()
	os.chdir(ANNEX_DIR)
	
	p = Popen(["git", "annex", "sync"])
	p.wait()
	
	try:
		r = requests.get("%s/tasks/?task_path=PGP.request_decrypt.requestDecrypt" % buildServerURL())
		print r.content
	except Exception as e:
		print e
		return
	
	import json
	r = json.loads(r.content)
	if r['result'] != 200: return
	
	pwd = getSecrets(key="informacam.gpg.priv_key.password")
	print pwd
	
	for task in r['data']['documents']:
		try:
			p = Popen(["git", "annex", "get", task['pgp_file']])
			p.wait()
			
			with open(os.path.join(ANNEX_DIR, task['pgp_file'])) as FILE: pass
		except IOError as e:
			print e
			continue
		except KeyError as e:
			print e
			continue
			
		cmd = ["gpg", "--no-tty", "--passphrase", pwd, 
			"--output", "%s.decryped" % os.path.join(ANNEX_DIR, task['pgp_file']), 
			"--decrypt", os.path.join(ANNEX_DIR, task['pgp_file'])]
		
		print " ".join(cmd)
		p = Popen(cmd)
		p.wait()
	
	os.chdir(this_dir)