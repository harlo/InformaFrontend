import os, json, re, tornado.web, requests
from sys import exit, argv
from time import sleep

from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result
from lib.Frontend.lib.Core.Utils.funcs import parseRequestEntity, generateMD5Hash, asTrueValue

from conf import INFORMA_BASE_DIR, DEBUG, WEB_TITLE, buildServerURL

class InformaFrontend(UnveillanceFrontend):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		
		# sketchy...
		from conf import UNVEILLANCE_LM_VARS
		self.UNVEILLANCE_LM_VARS.update(UNVEILLANCE_LM_VARS)
		
		self.reserved_routes.extend(["ictd", "commit"])
		self.routes.extend([
			(r"/ictd/", self.ICTDHandler),
			(r"/commit/", self.DriveHandler)])
		
		self.default_on_loads = [
			'http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.js',
			'/web/js/lib/sammy.js',
			'/web/js/lib/crossfilter.min.js',
			'/web/js/lib/d3.min.js',
			'/web/js/lib/visualsearch.js',
			'/web/js/lib/jquery.ui.core.js',
			'/web/js/lib/jquery.ui.position.js',
			'/web/js/lib/jquery.ui.widget.js',
			'/web/js/lib/jquery.ui.menu.js',
			'/web/js/lib/jquery.ui.autocomplete.js',
			'/web/js/viz/uv_viz.js',
			'/web/js/models/ic_user.js',
			'/web/js/models/ic_visual_search.js',
			'/web/js/informacam.js', 
		]
		
		self.on_loads.update({
			'submission' : [
				'/web/js/viz/uv_indented_tree.js',
				'/web/js/viz/ic_timeseries_graph.js',
				'/web/js/viz/ic_timeseries_chart.js',
				'/web/js/viz/ic_map.js',
				'/web/js/models/ic_j3m.js',
				'/web/js/models/ic_submission.js',
				'/web/js/modules/ic_submission.js'],
			'main' : [
				'/web/js/viz/uv_indented_tree.js',
				'/web/js/viz/ic_timeseries_graph.js',
				'/web/js/viz/ic_timeseries_chart.js',
				'/web/js/viz/ic_map.js',
				'/web/js/models/ic_document_browser.js',
				'/web/js/models/ic_j3m.js',
				'/web/js/models/ic_collection.js',
				'/web/js/models/ic_source.js',
				'/web/js/models/ic_submission.js',
				'/web/js/modules/main.js']
		})
		
		with open(os.path.join(INFORMA_CONF_ROOT, "informacam.init.json"), 'rb') as IV:
			self.init_vars.update(json.loads(IV.read())['web'])
				
		tmpl_root = os.path.join(INFORMA_BASE_DIR, "web", "layout", "tmpl")
		self.INDEX_HEADER = os.path.join(tmpl_root, "header.html")
		self.INDEX_FOOTER = os.path.join(tmpl_root, "footer.html")
		self.MODULE_HEADER = self.INDEX_HEADER
		self.MODULE_FOOTER = self.INDEX_FOOTER

		self.WEB_TITLE = WEB_TITLE
	
	"""
		Custom handlers
	"""
	class ICTDHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self):
			self.finish("ICTD GOES HERE")
	
	class DriveHandler(tornado.web.RequestHandler):
		def get(self):
			endpoint = "/"			
			res = self.application.routeRequest(Result(), "open_drive_file", self)
			
			if DEBUG: print res.emit()
			
			if res.result == 200 and hasattr(res, "data"):
				endpoint += "#collection=%s" % json.dumps(res.data)
			
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