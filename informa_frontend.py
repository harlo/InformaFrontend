import os, json, re, tornado.web, requests
from sys import exit, argv
from time import sleep

from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result

from v2.v2j3m import *
from conf import INFORMA_BASE_DIR, INFORMA_CONF_ROOT, DEBUG, WEB_TITLE, buildServerURL

class InformaFrontend(UnveillanceFrontend):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
				
		self.reserved_routes.extend(["ictd", "commit", "leaflet", "submissions", "v2j3mview"])
		self.routes.extend([
			(r"/ictd/", self.ICTDHandler),
			(r"/commit/", self.DriveHandler),
			(r"/submissions/", self.SubmissionShortcutHandler),
			(r"/leaflet/(.*)", self.LeafletHandler),
			(r"/j3mheader/(.*)", J3MHeaderHandler),
			(r"/lightMeter/(.*)", LightMeterHandler),
			(r"/pressureHPAOrMBAR/(.*)", pressureHPAOrMBARHandler),
			(r"/pressureAltitude/(.*)", pressureAltitudeHandler),
			(r"/GPSBearing/(.*)", GPSBearingHandler),
			(r"/GPSCoords/(.*)", GPSCoordsHandler),
			(r"/GPSAccuracy/(.*)", GPSAccuracyHandler),
			(r"/Accelerometer/(.*)", AccelerometerHandler),
			(r"/DocumentWrapper/(.*)", DocumentWrapperHandler),
			(r"/PitchRollAzimuth/(.*)", PitchRollAzimuthHandler),
			(r"/VisibleWifiNetworks/(.*)", VisibleWifiNetworksHandler),
			(r"/j3mretrieve/(.*)", J3MRetrieveHandler)])
		
		self.default_on_loads.extend([
			'/web/js/lib/md5.js',
			'/web/js/lib/sammy.js',
			'/web/js/lib/crossfilter.min.js',
			'/web/js/lib/d3.min.js',
			'/web/js/lib/visualsearch.js',
			'/web/js/lib/jquery.ui.js',
			'/web/js/lib/jquery.ui.core.js',
			'/web/js/lib/jquery.ui.position.js',
			'/web/js/lib/jquery.ui.widget.js',
			'/web/js/lib/jquery.ui.menu.js',
			'/web/js/lib/jquery.ui.autocomplete.js',
			'/web/js/viz/uv_viz.js',
			'/web/js/models/ic_notifier.js',
			'/web/js/informacam.js'
		])
		
		self.on_loads.update({
			'submission' : [
				'/leaflet/leaflet.js',
				'/web/js/viz/uv_indented_tree.js',
				'/web/js/viz/ic_timeseries_graph.js',
				'/web/js/viz/ic_timeseries_chart.js',
				'/web/js/viz/ic_timeseries_map.js',
				'/web/js/models/unveillance_document.js',
				'/web/js/models/ic_j3m.js',
				'/web/js/models/ic_image.js',
				'/web/js/models/ic_submission.js',
				'/web/js/modules/ic_submission.js'],
			'source' : [
				'/web/js/models/unveillance_document.js',
				'/web/js/models/ic_source.js',
				'/web/js/modules/ic_source.js'],
			'main' : [
				'/web/js/lib/dropzone.js',
				'/web/js/models/ic_search.js',
				'/web/js/models/unveillance_dropzone.js',
				'/web/js/models/ic_document_browser.js',
				'/web/js/modules/main.js'],
			'search' :[
				'/web/js/models/ic_search.js',
				'/web/js/models/ic_document_browser.js',
				'/web/js/modules/ic_search.js'
			],
			'unveil' : [
				'/web/js/modules/uv_unveil.js',
				'/web/js/modules/ic_unveil.js'
			],
			'simple' : [
#				'/web/js/lib/filedrop-min.js',
#				'/web/js/models/unveillance_filedrop.js']
				'/web/js/lib/dropzone.js',
				'/web/js/models/unveillance_dropzone.js']
		})
		
		self.on_loads_by_status[1].extend([
			'/web/js/modules/ic_login.js',
			'/web/js/models/unveillance_user.js'
		])
		
		self.on_loads_by_status[2].extend([
			'/web/js/models/unveillance_user.js',
			'/web/js/modules/ic_logout.js',
			'/web/js/models/ic_user.js'
		])
		
		self.on_loads_by_status[3].extend([
			'/web/js/models/unveillance_user.js',
			'/web/js/modules/ic_logout.js',
			'/web/js/models/ic_user.js',
			'/web/js/models/ic_user_admin.js'
		])
		
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.init.json"), 'rb') as IV:
			init_vars = json.loads(IV.read())['web']
			self.init_vars.update(init_vars)
				
		tmpl_root = os.path.join(INFORMA_BASE_DIR, "web", "layout", "tmpl")
		self.INDEX_HEADER = os.path.join(tmpl_root, "header.html")
		self.INDEX_FOOTER = os.path.join(tmpl_root, "footer.html")
		self.MODULE_HEADER = self.INDEX_HEADER
		self.MODULE_FOOTER = self.INDEX_FOOTER

		self.WEB_TITLE = WEB_TITLE
	
	"""
		Custom handlers
	"""
	class LeafletHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self, uri):
			r = requests.get("http://cdn.leafletjs.com/leaflet-0.7.3/%s" % uri)
			self.finish(r.content)
			
	class ICTDHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			self.finish("ICTD GOES HERE")
	
	class DriveHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			endpoint = "/"			
			res = self.application.routeRequest(Result(), "open_drive_file", self)
			
			if DEBUG: print res.emit()
			
			if res.result == 200 and hasattr(res, "data"):
				endpoint += "#collection=%s" % json.dumps(res.data)
			
			self.redirect(endpoint)
	
	class SubmissionShortcutHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			endpoint = "/"
			
			# depending on the query params, we might want to look up a submission by
			# public_hash, _id, or other publicly-available params TBD

			self.redirect(endpoint)
	
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