import httplib2, json, datetime
from time import sleep, strptime, mktime, time

from oauth2client.client import SignedJwtAssertionCredentials
from oauth2client.client import OAuth2WebServerFlow
from apiclient import errors
from apiclient.discovery import build

from sync_client import InformaCamSyncClient
from conf import DEBUG, MONITOR_ROOT, getSecrets

class DriveClient(InformaCamSyncClient):
	def __init__(self, mode):
		GOOGLE_DRIVE_CONF = getSecrets(key="informacam.sync")['google_drive']
		self.log = GOOGLE_DRIVE_CONF['log']
		
		InformaCamSyncClient.__init__(self, self.log, mode=mode)
		
		scopes = [
			'https://www.googleapis.com/auth/drive',
			'https://www.googleapis.com/auth/drive.file']

		try:
			with open(GOOGLE_DRIVE_CONF['p12'], 'rb') as key:
				with open(GOOGLE_DRIVE_CONF['client_secrets'], 'rb') as secrets:
					secrets = json.loads(secrets.read())
				
					credentials = SignedJwtAssertionCredentials(
						secrets['web']['client_email'], key.read(), scopes)

					http = credentials.authorize(httplib2.Http())
					self.service = build('drive', 'v2', http=http)
				
					self.mime_types['folder'] = "application/vnd.google-apps.folder"
					self.mime_types['file'] = "application/vnd.google-apps.file"
				
					files = self.service.children().list(
						folderId=GOOGLE_DRIVE_CONF['asset_root']).execute()

					self.files_manifest = [self.getFile(f['id']) for f in files['items']]
					if DEBUG: 
						print "OUR FILES:\ncount: %d\n%s" % (len(self.files_manifest),
							[f['title'] for f in self.files_manifest])
		
		except Exception as e:
			print e
			self.usable = False
			return		
		
		self.files_manifest = []
	
	def getAssetMimeType(self, fileId):		
		return self.getFile(fileId)['mimeType']
	
	def getFile(self, fileId):
		try:
			return self.service.files().get(fileId=fileId).execute()
		except errors.HttpError as e:
			print e
			return None
			
	def pullFile(self, file):	
		if type(file) is str or type(file) is unicode:
			return self.pullFile(self.getFile(file))
					
		url = file.get('downloadUrl')
		if url:
			response, content = self.service._http.request(url)
			if response.status == 200: return content
			else: return None

	def lockFile(self, file):
		if type(file) is str or type(file) is unicode:
			return self.lockFile(self.getFile(file))
		
		pass
	
	def listAssets(self, omit_absorbed=False):
		assets = []
		new_time = 0
		files = None
		
		q = { 'q' : 'sharedWithMe and not trashed' }
		try:
			files = self.service.files().list(**q).execute()
		except errors.HttpError as e:
			print e
			return False
		
		for f in files['items']:
			
			if f['mimeType'] not in self.mime_types.itervalues() or f['mimeType'] == self.mime_types['folder']: continue
			
			if omit_absorbed and self.isAbsorbed(f['id'], f['mimeType']): continue
			
			if DEBUG: print "INTAKE: %s (mime type: %s)" % (f['id'], f['mimeType'])
			
			try:
				clone = self.service.files().copy(
					fileId=f['id'], body={'title':f['id']}).execute()
				if DEBUG: print clone
				
				assets.append(clone['id'])
				sleep(2)
			except errors.HttpError as e:
				print e
				continue
			
			try:
				del_result = self.service.files().delete(fileId=f['id']).execute()
				if DEBUG: print del_result
				sleep(2)
			except errors.HttpError as e:
				print e
				continue
		
		self.last_update_for_mode = time() * 1000
		return assets
	
	def isAbsorbed(self, file_name, mime_type):
		if self.mode == "sources":
			if mime_type != self.mime_types['zip']: return True
		elif self.mode == "submissions":
			if mime_type == self.mime_types['zip']: return True
		
		for f in self.files_manifest:
			if f['title'] == file_name: return True
		
		return False
	
	def absorb(self, file):
		if type(file) is str or type(file) is unicode:
			return self.absorb(self.getFile(file))
		
		self.files_manifest.append(file)
	
	def getFileName(self, file):
		if type(file) is str or type(file) is unicode:
			return self.getFileName(self.getFile(file))
					
		return str(file['title'])
	
	def getFileNameHash(self, file):
		if type(file) is str or type(file) is unicode:
			return self.getFileName(self.getFile(file))
		
		name_base = file['id']
		return super(DriveClient, self).getFileNameHash(name_base)
	
	def updateLog(self):
		super(DriveClient, self).updateLog(self.log)