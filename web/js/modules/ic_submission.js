var submission;
var app = app || {};//global Backbone

jQuery(document).ready(function($) {
	var source_sammy = $.sammy("#content", function() {
		this.get(/submission\/([a-z0-9]{32})\//, function(context) {

			submission = new InformaCamSubmission(_.extend({ root_el : $('#ic_submission_view_holder')},
				doInnerAjax("documents", "post", { _id : this.params.splat[0] }, null, false)));

			if(submission.get('result') != 200) {
				failOut($(submission.get('root_el')));
				return;
			}

			submission.unset('result');

		});

	});
	
	app.docid = /submission\/([a-z0-9]{32})\//.exec(window.location)[1];
	new app.InformaCamJ3MAppView;
	

	$(function() {
		try {
			updateConf();
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
