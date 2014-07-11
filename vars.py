from collections import namedtuple

informacam_cookie = namedtuple("informacam_cookie", "ADMIN USER PUBLIC")
InformaCamCookie = informacam_cookie("informacam_admin", "informacam_user", "informacam_public")

INFORMA_SYNC_TYPES = ['google_drive', 'globaleaks']
USER_CREDENTIAL_PACK = {
	"username" : "",
	"saved_searches" : [],
	"session_log" : []
}

from lib.Frontend.vars import *

informacam_mime_types = {
	'j3m' : "informacam/j3m",
	'video' : "video/x-matroska",
	'3gp' : "video/3gpp",
	'log' : "informacam/log" 
}

informacam_mime_type_map = {
	'informacam/j3m' : "j3m",
	'video/x-matroska': "mkv",
	'video/3gpp' : "3gp",
	'informacam/log' : "j3mlog"
}

informacam_asset_tags = {
	'J3M' : "j3m",
	'PGP_KEY' : "pgp_key",
	'THUMB' : "thumbnail",
	'HIGH' : "hi_res",
	'MED' : "medium_res",
	'LOW' : "low_res"
}

MIME_TYPES.update(informacam_mime_types)
MIME_TYPE_MAP.update(informacam_mime_type_map)
ASSET_TAGS.update(informacam_asset_tags)