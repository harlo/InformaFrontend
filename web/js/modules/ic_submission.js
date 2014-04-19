var submission = null;

(function($) {
	var sub_sammy = $.sammy("#content", function() {
		this.get(/(.*)\#j3m/, function(context) {
			console.info("J3M");
		});
		
		this.get(/(.*)\#view/, function(context) {
			console.info("VIEW");
		});
		
		this.get(/(.*)\#original/, function(context) {
			console.info("DOWNLOAD ORIGINAL");
		});
		
		this.get(/.*\#(json|csv|tsv|html)/, function(context) {
			var format = this.params.splat[0];
			console.info("DOWNLOAD AS " + format);
		});
	});
	
	$(function() {
		sub_sammy.run();
		initSubmission();
	});
})(jQuery);

function initSubmission() {	
	_id = location.search.split('_id=')[1];
	doInnerAjax("documents", "post", { _id : _id }, function(json) {
		json = JSON.parse(json.responseText);
		
		if(json.result == 200) {
			submission = new InformaCamSubmission(json.data);
			
			insertTemplate("submission_single.html", submission.toJSON(),
				"#ic_submission_holder", function() {
					if(submission.has("j3m_id")) {
						doInnerAjax("documents", "post", 
							{ _id : submission.get("j3m_id") },
							function(j3m) {
								j3m = JSON.parse(j3m.responseText);
								if(j3m.result == 200) {
									submission.set({ j3m : j3m.data });
									insertTemplate("submission_extended.html",
										submission.toJSON(), 
										"#ic_submission_extended",
										function() { submission.buildJ3M(); }
									);
								}
							}
						);
						
						return;
					}
					
					$("#ic_submission_extended").html("This submission has no J3M");
				}
			);
		}
	});
}