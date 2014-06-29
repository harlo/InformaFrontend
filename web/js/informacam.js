var informacam_user = null;
var visual_search;

var onConfLoaded = function() {	
	var map_id = "harlo.ibn0kk8l";
	var key = "23c00ae936704081ab019253c36a55b3";
	UV.CM_API = {
		AUTH_STR : "http://{s}.tiles.mapbox.com/v3/" + map_id + "/{z}/{x}/{y}.png",
		MAX_ZOOM: 18,
		ATTRIBUTION: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
	};
}

function initUser() {
	doInnerAjax("get_user_status", "post", null, function(json) {
		json = JSON.parse(json.responseText);
		if(json.result == 200) {
			status = Number(json.data);
			if(status == 0) { return; }
			
			if(status != 4) {
				informacam_user = new InformaCamUser();
			}
		}
	});
	
}

function loadHeaderPopup(view, onSuccess) {
	if(!toggleElement($("#ic_header_popup"))) { toggleElement($("#ic_header_popup")); }
	
	insertTemplate((view + ".html"), null, $("#ic_header_popup_content"), 
		onSuccess, "/web/layout/views/popup/");
}

function initVisualSearch() {
	visual_search = new InformaCamVisualSearch();
}

(function($) {
	var header_sammy = $.sammy("#header", function() {
		this.get(/(.*)\#me/, function(context) {
			loadHeaderPopup("me", null);
		});
		
		this.get(/(.*)\#login/, function(context) {
			loadHeaderPopup("login", null);
		});
		
		this.get(/(.*)\#logout/, function(context) {
			loadHeaderPopup("logout", null);
		});
	});
	
	$(function() {
		var css_stub = $(document.createElement('link'))
			.attr({
				'rel' : "stylesheet",
				'type' : "text/css",
				'media' : "screen"
			});
		
		_.each(['informacam', 'visualsearch-datauri', 'visualsearch'], function(c) {
			var css = $(css_stub).clone();
			css.attr('href', "/web/css/" + c + ".css");
			document.getElementsByTagName("head")[0].appendChild(css.get(0));
		});
		
		css = $(css_stub).clone();
		css.attr('href', "http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.css");
		document.getElementsByTagName("head")[0].appendChild(css.get(0));
		
		onConfLoaded();
		initUser();
		header_sammy.run();
		
		window.setTimeout(function() {
			initVisualSearch();
		}, 2000);
	})
})(jQuery);