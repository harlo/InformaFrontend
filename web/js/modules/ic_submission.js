//var submission;
var app = app || {};//global Backbone

jQuery(document).ready(function($) {

	$(function() {
		try {
			updateConf();
			var id_rx = new RegExp("/submission/([a-z0-9]{" + UV.SHA1_INDEX + "})/");
			app.docid = id_rx.exec(window.location)[1];

			new app.InformaCamJ3MAppView;
			$("#unveil_document").prop('href', "/unveil/" + app.docid + "/");
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
