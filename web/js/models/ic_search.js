var InformaCamAdvancedSearch = Backbone.Model.extend({
	constructor: function(inflate) {
		Backbone.Model.apply(this, arguments);
	},
	perform: function() {
		if(!this.has('params')) { return; }
		
		var search_query = {};
		_.each(this.get('params'), function(p) {
			_.extend(search_query, _.object([p.key], [p.value]));
		});
		
		console.info(search_query);
		
		doInnerAjax("documents", "post", search_query, function(json) {
			json = JSON.parse(json.responseText);
			if(json.result == 200) {
			
			} else {
				$("#ic_av_status_holder").html("<p>There are no results matching your query.</p>")
			}
		});
	}
});