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
				
		doInnerAjax("documents", "post", search_query, function(json) {
			json = JSON.parse(json.responseText);
			if(json.result == 200) {				
				_.each(json.data.documents, function(doc) {					
					if(doc.media_id) {
						var tmpl = _.template('<li><a href="/#submission/<%= media_id %>"><%= media_id %></a> (<span class="uv_translate uv_date"><%= genealogy.dateCreated %></span>)</li>');
						$("#ic_av_results").append(tmpl(doc));
					}
				});
				
				$.each($("#ic_av_results").find(".uv_translate"), function(idx, item) {
					$(item).html(translate(item));
				});
				
			} else {
				$("#ic_av_status_holder").html("<p>There are no results matching your query.</p>");
			}
		});
	}
});