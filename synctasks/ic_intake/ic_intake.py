import os
from sys import argv, exit

from conf import ANNEX_DIR, SYNC_TYPES

def intake(mode):
	if mode not in ["sources", "submissions"]: exit(0)
	
	print "running watch... (mode=%s)" % mode
	clients = []
	
	for sync_type in SYNC_TYPES:
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
			
			if not os.path.exists(os.path.join(ANNEX_DIR, mode)):
				os.mkdir(os.path.join(ANNEX_DIR, mode))
			
			asset_path = os.path.join(ANNEX_DIR, mode, client.getFileName(asset))
			with open(asset_path, 'wb+') as asset_file:
				asset_file.write(client.pullFile(asset))
				client.absorb(asset)
				client.lockFile(asset)
		
		client.updateLog()

if __name__ == "__main__":
	if len(argv) == 1:
		watch("sources")
		sleep(5)
		watch("submissions")
	else: watch(argv[1])