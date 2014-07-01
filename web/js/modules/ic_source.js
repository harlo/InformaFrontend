(function($) {
	var source_sammy = $.sammy("#content", function() {
		this.get(/source\/([a-z0-9]{32})\//, function(context) {
			doInnerAjax("documents", "post", { _id : this.params.splat[0] }, function(j) {
				j = JSON.parse(j.responseText);
				if(j.result == 200) {
					current_asset = new InformaCamSource(j.data);
					current_asset.setInPanel('viewer');
				}
			});
		});
	});
	
	$(function() {
		source_sammy.run();
	});
})(jQuery);