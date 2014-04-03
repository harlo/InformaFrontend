import httplib2, json, datetime
from time import sleep, strptime, mktime, time

from oauth2client.client import SignedJwtAssertionCredentials
from oauth2client.client import OAuth2WebServerFlow
from apiclient import errors
from apiclient.discovery import build

from InformaCam.Sync.sync_client import InformaCamSyncClient

scopes = [
	'https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/drive.file'
]

class DriveClient(InformaCamSyncClient):
	def __init__(self, mode):
		InformaCamSyncClient.__init__(self)
	
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


		