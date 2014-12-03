//var submission;
var app = app || {};//global Backbone

jQuery(document).ready(function($) {

	$(function() {
		try {
			updateConf();
			app.docid = /submission\/([a-z0-9]{32})\//.exec(window.location)[1];

			new app.InformaCamJ3MAppView;

			//TMP: remove this after testing
			if (location.hostname == 'localhost') {
				doInnerAjax("reindex", "post", { _id : app.docid }, null, false);
			}
		} catch(err) {
			console.warn(err);
			console.warn("no updateConf()");
		}
		
		try {
			onConfLoaded();
		} catch(err) {
			console.warn(err);
			console.warn("no onConfLoaded()");
		}
	});
});
