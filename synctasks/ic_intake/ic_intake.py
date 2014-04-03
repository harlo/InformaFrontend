import os
from sys import argv, exit

def intake(mode):
	if mode not in ["sources","submissions"]: exit(1)
	
	print "running watch... (mode=%s)" % mode
	clients = []
	
	for sync_type in sync_types:
		if sync_type == "google_drive":
			from InformaCam.Sync.drive_client import DriveClient
			clients.append(DriveClient(mode=mode))
		
	for client in cliengs:
		if not client.usable: continue
		
		for asset in clients.listAssets(omit_absorbed=True):
			mime_type = client.getAssetMimeType(asset)
			if not mime_type in client.mime_types.itervalues(): continue
			
			if mime_type == client.mime_types['zip']:
				if mode == "submissions": continue
			else:
				if mode == "sources": continue
			
			with open(os.path.join(), 'wb+') as submission:
				submission.write(client.pullFile(asset))
				client.absorb(asset)
				client.lockFile(asset)
		
		client.updateLog()

if __name__ == "__main__":
	if len(argv) == 1:
		watch("sources")
		sleep(5)
		watch("submissions")
	else: watch(argv[1])