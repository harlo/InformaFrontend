var current_asset;

function updateConf() {
	var map_id = "harlo.ibn0kk8l";
	var key = "23c00ae936704081ab019253c36a55b3";
	UV.CM_API = {
		AUTH_STR : "http://{s}.tiles.mapbox.com/v3/" + map_id + "/{z}/{x}/{y}.png",
		MAX_ZOOM: 18,
		ATTRIBUTION: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
	};
	
	UV.DEFAULT_MIME_TYPES = [
		"application/pgp",
		"image/jpeg",
		"video/x-matroska",
		"informacam/log"
	];
	
	UV.SEARCH_FACETS.push("Public Hash");
	
	UV.SEARCH_TYPES = {
		submission : ["genealogy.createdOnDevice"],
		source : ["fingerprint", "alias", "email"]
	};
	
	UV.TRANSLATE_VALUES = _.union(UV.TRANSLATE_VALUES, [
		{
			keys : ["genealogy.dateCreated", "upper"],
			enc: function(val) {
				return moment(val, "MM/DD/YYYY HH:mm").unix() * 1000;
			},
			dec: function(val) {
				return moment(Number(val)).format("MM/DD/YYYY HH:mm");
			}
		}
	]);
	
	UV.SEARCH_CLAUSE_SELECTORS = {
		submission : [
			{
				label: "were created on or between...",
				tmpl: "by_dateCreated.html"
			},
			{
				label: "were taken near...",
				tmpl: "by_location.html"
			},
			{
				label: "were taken by...",
				tmpl: "by_source_j3m.html"
			},
			{
				label: "were taken in view of...",
				tmpl: "by_broadcast.html"
			}
		],
		source: [
			{
				label: "goes by alias...",
				tmpl: "by_source_alias.html"
			},
			{
				label: "with email address...",
				tmpl: "by_source_email.html"
			}
		]
	};
}

function loadAsset(asset_type, _id) {
	if(asset_type == "submission") {
		current_asset = new InformaCamSubmission({ _id : _id });
	} else if(asset_type == "source") {
		current_asset = new InformaCamSource({ _id : _id });
	}
	
	try {
		current_asset.updateInfo();
	} catch(err) {
		console.warn("COULD NOT LOAD WHOLE ASSET AT THIS TIME");
		console.warn(err);
	}
}

function loadHeaderPopup(view, onSuccess) {
	if(!toggleElement($("#ic_header_popup"))) { toggleElement($("#ic_header_popup")); }
	
	insertTemplate((view + ".html"), null, $("#ic_header_popup_content"), 
		onSuccess, "/web/layout/views/popup/");
}

function closeHeaderPopup() {
	toggleElement('#ic_header_popup');
	window.history.back();
	window.location.reload();
}

(function($) {
	$(function() {
		var css_stub = $(document.createElement('link'))
			.attr({
				'rel' : "stylesheet",
				'type' : "text/css",
				'media' : "screen"
			});
		
		_.each(['bootstrap.min', 'informacam', 'visualsearch-datauri', 'visualsearch'],
			function(c) {
				var css = $(css_stub).clone();
				css.attr('href', "/web/css/" + c + ".css");
				document.getElementsByTagName("head")[0].appendChild(css.get(0));
			}
		);
		
		css = $(css_stub).clone();
		css.attr('href', "/leaflet/leaflet.css");
		document.getElementsByTagName("head")[0].appendChild(css.get(0));
		
		css = null;
		delete css;
	})
})(jQuery);