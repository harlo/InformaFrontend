import os, json, re, tornado.web, requests
from sys import exit, argv
from time import sleep

from conf import INFORMA_BASE_DIR
from api import InformaAPI

from lib.Frontend.unveillance_frontend import UnveillanceFrontend
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

	'''
	def buildAnnexTmp(uuid, batch_root):
		annex_tmp = super(InformaServer, self).buildAnnexTmp(uuid, batch_root)
		
		config_extras = os.path.join(annex_tmp, "inc", "config_extras")
		form_extras = os.path.join(annex_tmp, "inc", "form_extras")
		os.makedirs(form_extras)
		
		for root, dir, files in os.walk(annex_tmp):
			for file in files:
				if root != annex_tmp: continue
				
				cmds = []
				
				if re.match(r'^informacam.form[0-9]*', file):
					cmds.append(["mv", os.path.join(root, file), 
						os.path.join(form_extras, file)])
				elif file == "informacam.gpg_private_key.file":
					# split into a public and call it
					# gpg_public.asc and gpg_private.asc (in config_extras)
					with open(os.path.join(root, file), 'rb') as pk:
						private_key = pk.read()
					
					pk_start = "-----BEGIN PGP PRIVATE KEY BLOCK-----"
					public_key = private_key[:private_key.index(pk_start)]
						
					with open(os.path.join(config_extras, "gpg_public.asc"), 'wb+') as pk:
						pk.write(public_key)
					
					cmds.append(["mv", os.path.join(root, file),
						os.path.join(config_extras, "gpg_private.asc")])
					
				for cmd in cmds:
					p = Popen(cmd)
					p.wait()
		
		return annex_tmp
	'''
	
	'''
	def initAnnex(self, credentials):
		from subprocess import Popen
		from conf import SSH_ROOT, BASE_DIR
		from lib.Server.lib.Core.Utils.funcs import hashEntireFile
		
		print "INITING ANNEX IN INFORMACAM CONTEXT"
		print credentials
		
		try:
			# create key here!
			# 1. create keypair
			cmd = ["ssh-keygen", "-f", 
				os.path.join(SSH_ROOT, "unveillance.local_remote.key"),
				"-t", "rsa", "-b", "4096", "-N", credentials['local_remote.key.password']]
		
			p = Popen(cmd)
			p.wait()
		
			# uuid is hash of public key
			credentials['uuid'] = hashEntireFile(os.path.join(SSH_ROOT,
				"unveillance.local_remote.key.pub"))
			
			# also, copy public key into batch_root
			p = Popen([
				"cp", os.path.join(SSH_ROOT, "unveillance.local_remote.key.pub"),
				os.path.join(os.path.join(BASE_DIR, "tmp", credentials['batch_root']))
			])
			p.wait()
		
			annex_tmp = self.buildAnnexTmp(credentials['uuid'], credentials['batch_root'])
			config_extras = os.path.join(annex_tmp, "inc", "config_extras")
		
			with open(os.path.join(config_extras, "gpg_password.txt"), 'wb+') as gpg_pwd:
				gpg_pwd.write(credentials['informacam.gpg_private_key.password'])
			
			annex_stub = {'_id' : credentials['uuid']}
			annex_stub['unveillance.local_remote.folder'] = 
				credentials['unveillance.local_remote.folder']
			annex_stub['local_remote.key.password'] = 
				credentials['local_remote.key.password']

			annex = InformaAnnex(annex_stub)
		except Exception as e: 
			print e
			return None

		try:
			from yaml import dump
			from vars import INFORMA_SYNC_TYPES
			from conf import INFORMA_CONF_DIR
			
			# set name, details
			ictd = { 
				organizationName : credentials['informacam.organizationName'],
				organizationDetails: credentials['informacam.organizationDetails']
			}
			
			# add syncs/repos
			repositories = []
			for root, dir, files in os.walk(annex_tmp):
				for file in files:
					if root != annex_tmp: continue
					
					for sync_type in INFORMA_SYNC_TYPES:
						has_sync = re.findall(re.compile('^(%s)\..*' % sync_type), file)
						if len(has_sync) == 0: continue
						
						# init repositories, if needed
						if not 'repositories' in ictd.keys():
							ictd['repositories'] = []
						
						# init this repository, if needed
						if not has_sync[0] in repositories:
							repositories.append(has_sync[0])
						
						# move the file into the conf folder
						cmd = ["mv", os.path.join(root, file), INFORMA_CONF_DIR]
						p = Popen(cmd)
						p.wait()
			
			# query credentials for anything starting with sync_type and put into ictd
			if 'repositories' in ictd.keys():
				for sync_type in repositories:
					repository = {}
					sync_rx = re.compile('^%s\..*', % sync_type)
					
					for key, val in credentials:
						if re.match(sync_rx, key):
							repository[re.sub("%s\." % key, "", key)] = val
					
					ictd['repositories'].append(repository)
				
				# append repos to local.config
				from Utils.funcs import updateConfig
				updateConfig({ 'repositories' : repositories })
			
			# save ictd yaml
			with open(os.path.join(config_extras, "ictd.yaml"), 'wb+') as ictd_file:
				ictd_file.write(yaml.dump(ictd))
				
		except Exception as e: print e
		
		try:
			# create
			#annex.create()
			return annex
		except Exception as e: print e
		return None	
	'''
	

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