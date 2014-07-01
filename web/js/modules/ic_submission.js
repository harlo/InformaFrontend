(function($) {
	var sub_sammy = $.sammy("#content", function() {
		this.get(/.*\#media/, function(context) {
			console.info("SHOW ORIGINAL IF POSSIBLE, or if log, attachments...");
		});
		
		this.get(/submission\/([a-z0-9]{32})\//, function(context) {
			doInnerAjax("documents", "post", { _id : this.params.splat[0] }, function(j) {
				j = JSON.parse(j.responseText);
				if(j.result == 200) {
					current_asset = new InformaCamSubmission(j.data);
					current_asset.setInPanel('viewer');
				}
			});
		});
	});
	
	$(function() {
		sub_sammy.run();
	});
})(jQuery);