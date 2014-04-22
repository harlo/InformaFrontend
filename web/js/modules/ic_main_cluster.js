var cluster;

(function($) {
	$(function() {
		doInnerAjax("cluster", "post", { around : "metadata_fingerprint" }, 
			function(json) {
				json = JSON.parse(json.responseText);
				if(json.result == 200) {
					cluster = new UnveillanceCluster(json.data);
					cluster.build("#ic_main_cluster_holder");
					
				}
			}
		);
	});
})(jQuery);