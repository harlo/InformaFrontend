var app = app || {};//global Backbone

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
	
	UV.DATA_MAX = 800;
	
	UV.SEARCH_FACETS.push("Public Hash");
	UV.FACET_VALUES = _.union(UV.FACET_VALUES, [
		{
			category : "Public Hash",
			uri_label : "public_hash"
		},
		{
			category : "text",
			uri_label : "searchable_text"
		},
		{
			category : "Tags",
			uri_label : "in_pool",
			values: []
		}
	]);
	
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
		},
		{
			keys: ["ic_file_name_from_id"],
			enc: function(val) {
				try {
					if(document_browser && document_browser.has('data')) {
						return _.findWhere(document_browser.get('data'), {
							_id : val
						}).file_name;
					}
				} catch(err) {}
				
				return val;
			}
		},
		{
			keys: ["ic_truncate_fingerprint"],
			enc: function(val) {
				return val.substr(-8);
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
		
		_.each(['bootstrap.min', 'informacam', 'visualsearch-datauri', 'visualsearch', 'simple_upload'],
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



function toHTML(d) {
	var result = [];
	result.push("<ul>");
	for (var key in d) {
		var line = [];

		if (_.isArray(d[key]) || _.isObject(d[key])) {
			line.push( "<li>" + key + " :</li>");
			result.push(line.join(""));
			result.push(toHTML(d[key]));

		} else {
			if (_.isArray(d)) {
				line.push( "<li>" + d[key] + "</li>");
			} else {
				line.push( "<li>" + key + " : " + JSON.stringify(d[key]) + "</li>");
			}
			result.push(line.join(""));
		}
	}
	result.push("</ul>");
	return result.join('\n');
}

function onDownloadRequested(file_name, el) {
	$(el).unbind("click");

	var data = getFileContent(this,
		[".data", app.docid, file_name].join('/'), null);

	var is_valid = true;
		
	if(_.isNull(data)) {
		is_valid = false;
	} else {
		try {
			if(JSON.parse(data).result == 404) {
				is_valid = false;
			}
		} catch(err) {}
	}

	if(!is_valid) {
		alert("Could not download file");
		return;
	}

	data = new Blob([data], { type : "application/octet-stream" });
	$(el).attr({
		'href' : window.URL.createObjectURL(data),
		'download' : [app.docid, file_name].join('_')
	});
	
	window.setTimeout(function() {
		$(el).click();
		$(el).removeAttr('href');
		$(el).removeAttr('download');
		$(el).click(function() {
			onDownloadRequested(file_name, this);
		});
	}, 300);
}
