INFORMA_SYNC_TYPES = ['google_drive', 'globaleaks']

FILE_SALT = "alejrAYOwkngvbfhljqtnrjqTECHNOLOGY3glvufhara"
from lib.Frontend.vars import *

informacam_mime_types = {
	'j3m' : "text/plain",
	'video' : "video/x-matroska",
	'3gp' : "video/3gpp",
	'log' : "informacam/log" 
}

informacam_mime_type_map = {
	'text/plain' : "json",
	'video/x-matroska': "mkv",
	'video/3gpp' : "3gp",
	'informacam/log' : "j3mlog"
}

MIME_TYPES.update(informacam_mime_types)
MIME_TYPE_MAP.update(informacam_mime_type_map)