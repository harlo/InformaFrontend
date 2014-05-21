var informacam_user = null;
var visual_search;

function initUser() {
	doInnerAjax("get_user_status", "post", null, function(json) {
		json = JSON.parse(json.responseText);
		if(json.result == 200) {
			status = Number(json.data);
			if(status == 0) { return; }
			
			if(status != 4) {
				informacam_user = new InformaCamUser();
			} else {
				window.location = "/setup/#step-1";
			}
		}
	});
	
}

function loadHeaderPopup(view, onSuccess) {
	if(!toggleElement($("#ic_header_popup"))) { toggleElement($("#ic_header_popup")); }
	
	insertTemplate((view + ".html"), null, $("#ic_header_popup_content"), 
		onSuccess, "/web/layout/views/popup/");
}

function informaSearch(query, search_collection) {

}

function informaFacetMatches(callback) {
	var main_facets = _.map(["hash", "location", "date range", "annotations"], 
		function(f) {
			return { category : "Info", label : f };
		}
	);
	
	var device_facets = _.map(["make", "model"], function(f) {
		return { category : "Device", label : f };
	});
	
	var user_facets = _.map(["PGP fingerprint", "alias"], function(f) {
		return { category : "User", label : f };
	});
	
	var signal_facets = _.map(
		["cell tower", "wifi BSSID", "bluetooth hash"], 
		function(f) {
			return { category : "Signal", label : f };
		}
	);
	
	callback(_.union(user_facets, device_facets, signal_facets, main_facets));
}

function informaValueMatches(facet, search_term, callback) {

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
		
		visual_search = VS.init({
			container : $("#ic_searchbar_holder"),
			query : '',
			callbacks: {
				search: informaSearch,
				facetMatches: informaFacetMatches,
				valueMatches: informaValueMatches
			}
		});
		
		initUser();
		header_sammy.run();
	})
})(jQuery);