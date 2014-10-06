var cluster;

(function($) {
	$(function() {
		doInnerAjax("cluster", "post", { around : "metadata_fingerprint" }, 
			function(json) {
				json = JSON.parse(json.responseText);
				if(json.result == 200) {
					var c = json.data;
					c.root_el = "#ic_main_cluster_holder";

					cluster = new UnveillanceCluster(c);
				}
			}
		);
	});
})(jQuery);