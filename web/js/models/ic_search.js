var InformaCamAdvancedSearch = Backbone.Model.extend({
	constructor: function(inflate) {
		Backbone.Model.apply(this, arguments);
		
		var search_type = "j3m";
		if(this.has('params')) {
			if(_.intersection(this.get('params'), UV.SEARCH_TYPES.SOURCE).length > 0) {
				search_type = "source";
			}
			
		}
		
		this.set('search_type', search_type);
	},
	perform: function() {
		if(!this.has('params') || !this.has('search_type')) { return; }
		
		var search_query = {};
		var search_type = this.get('search_type');
		
		_.each(this.get('params'), function(p) {
			_.extend(search_query, _.object([p.key], [p.value]));
		});
				
		doInnerAjax("documents", "post", search_query, function(json) {
			json = JSON.parse(json.responseText);
			if(json.result == 200) {				
				_.each(json.data.documents, function(doc) {
					var tmpl;
					
					switch(search_type) {
						case "j3m":
							if(doc.media_id) {
								tmpl = '<a href="/#submission/<%= media_id %>"><%= media_id %></a> (<span class="uv_translate uv_date"><%= genealogy.dateCreated %></span>)';
							}
							break;
						case "source":
							tmpl = '<a href="/#source/<%= _id %>"><%= _id %></a>';
							break;
					}
					
					if(tmpl) {
						$("#ic_av_results").append(
							$(document.createElement('li')).html(_.template(tmpl, doc)));
					}
				});
				
				$.each($("#ic_av_results").find(".uv_translate"), function(idx, item) {
					$(item).html(translate(item));
				});
				
				$("#ic_av_status_holder").html("<p>" + json.data.documents.length + " result(s) found.</p>");
				
			} else {
				$("#ic_av_status_holder").html("<p>There are no results matching your query.</p>");
			}
		});
	}
});