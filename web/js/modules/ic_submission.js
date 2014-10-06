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
			
			var j3m = submission.get('j3m');
			console.log(j3m.getHeader());
			

/*
			$(submission.get('root_el'))
				.html("Submission is here in the DOM.  What does this look like?")
				.append($(document.createElement('textarea'))
					.addClass("ic_json_pre")
					.html(JSON.stringify(submission.toJSON())));

*/
			$(submission.get('root_el'))
				.append(Mustache.to_html(getTemplate("j3m_header.html"), j3m.getHeader()));

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