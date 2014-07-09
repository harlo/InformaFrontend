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