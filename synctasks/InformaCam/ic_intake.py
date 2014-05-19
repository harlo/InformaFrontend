def doIntake(*args):
	from time import sleep

	intake("sources")
	sleep(5)
	intake("submissions")

def intake(mode):
	if mode not in ["sources", "submissions"]:
		print "Mode must be 'sources' or 'submissions'"
		return
	
	from conf import SYNC_TYPES
	if SYNC_TYPES is None:
		print "No sync types registered"
		return
		
	print "running watch... (mode=%s)" % mode
	clients = []
	
	for sync_type in SYNC_TYPES:
		print sync_type
		if sync_type == "google_drive":
			from Models.ic_drive_client import InformaCamDriveClient
			clients.append(InformaCamDriveClient(mode=mode))
		
	for client in clients:
		if not client.usable: continue
		
		for asset in client.listAssets(omit_absorbed=True):
			mime_type = client.getAssetMimeType(asset)
			if not mime_type in client.mime_types.itervalues(): continue
			
			if mime_type == client.mime_types['zip']:
				if mode == "submissions": continue
			else:
				if mode == "sources": continue

			if client.download(asset) is not None:			
				client.absorb(asset)
				client.lockFile(asset)

		client.updateLog()