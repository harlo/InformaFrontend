var submission;

(function($) {
	var source_sammy = $.sammy("#content", function() {
		this.get(/submission\/([a-z0-9]{32})\//, function(context) {

			submission = new InformaCamSubmission(_.extend({ root_el : $('#ic_submission_view_holder')},
				doInnerAjax("documents", "post", { _id : this.params.splat[0] }, null, false)));

			if(submission.get('result') != 200) {
				failOut($(submission.get('root_el')));
				return;
			}

			submission.unset('result');

			console.info("Submission " + submission.get('data')._id);
			console.info(submission);

			$(submission.get('root_el'))
				.html("Submission is here in the DOM.  What does this look like?");
		});
	});
	
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
		
		source_sammy.run();
	});
})(jQuery);