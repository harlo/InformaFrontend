import os
from conf import ANNEX_DIR, SYNC_TYPES

def intake(mode):
	if mode not in ["sources", "submissions"]:
		print "Mode must be 'sources' or 'submissions'"
		exit(0)
	
	if SYNC_TYPES is None:
		print "No sync types registered"
		exit(0)
		
	print "running watch... (mode=%s)" % mode
	clients = []
	
	for sync_type in SYNC_TYPES:
		print sync_type
		if sync_type == "google_drive":
			from Sync.drive_client import DriveClient
			clients.append(DriveClient(mode=mode))
		
	for client in clients:
		if not client.usable: continue
		
		for asset in client.listAssets(omit_absorbed=True):
			mime_type = client.getAssetMimeType(asset)
			if not mime_type in client.mime_types.itervalues(): continue
			
			if mime_type == client.mime_types['zip']:
				if mode == "submissions": continue
			else:
				if mode == "sources": continue
						
			asset_path = os.path.join(ANNEX_DIR, client.getFileName(asset))
			with open(asset_path, 'wb+') as asset_file:
				asset_file.write(client.pullFile(asset))
			
				client.absorb(asset)
				client.lockFile(asset)

		client.updateLog()