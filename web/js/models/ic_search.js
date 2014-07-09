var InformaCamAdvancedSearch = Backbone.Model.extend({
	constructor: function(inflate) {
		Backbone.Model.apply(this, arguments);
		
		var search_type = "submission";
		if(this.has('params')) {
			if(_.intersection(this.get('params'), UV.SEARCH_TYPES.source).length > 0) {
				search_type = "source";
			}
			
		}
		
		this.set('search_type', search_type);

		if(this.has('as_stub') && this.get('as_stub')) {
			getTemplate("advanced_search_clause_builder.html", function(html) {
				this.clause_tmpl = html.responseText;
			}, null, this);
		}
	},
	setSearchType: function() {
		var search_type = "submission";
		if($("#ic_av_search_type").val() == "source") {
			search_type = "source";
		}
		
		this.set('search_type', search_type);
		$("#ic_av_search_clause_holder").empty();
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
						case "submission":
							tmpl = '<a href="/#submission/<%= _id %>"><%= _id %></a> (<span class="uv_translate uv_date"><%= date_added %></span>)';
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
	},
	addClause: function() {
		if(!this.clause_tmpl) { return; }
		
		var clause_ui = $(document.createElement('li')).html(this.clause_tmpl);

		var stub = "____________________________";
		var default_stub = $(document.createElement('option')).html(stub);
		$($(clause_ui).find(".ic_clause_selector")[0]).append(default_stub);

		_.each(UV.SEARCH_CLAUSE_SELECTORS[this.get('search_type')], function(cs) {
			var el = $(document.createElement('option'))
				.html(cs.label)
				.attr({
					value: cs.tmpl
				});
				
			$($(clause_ui).find(".ic_clause_selector")[0]).append(el);
		});
		
		$($(clause_ui).find(".ic_clause_selector")[0]).change(function() {
			if(!$(this).val()) { return; }
			
			var ui_parent = $(this).parent();
			var clause_holder = $($(ui_parent).find(".ic_clause_filter_holder")[0]);
			var clause_selector = $($(ui_parent).find(".ic_clause_selector")[0]);
					
			insertTemplate($(this).val(), null, clause_holder, function() {
				$(clause_selector).remove();
			}, null);
		});
		
		$("#ic_av_search_clause_holder").append(clause_ui);
	},
	removeClause: function(holder) {
		var ui_parent = $($($(holder).parent()).parent()).parent();
		$(ui_parent).remove();
	},
	buildAndPerform: function() {
		var ctx = this;
		
		$.each($("#ic_av_search_clause_holder").find("input"),
			function(idx, item) {
				console.info($(item));
				// for all inputs
				// might need some massaging beforehand, but:
				// if value is not null: push kvp
				if($(item).val() == "") { return; }
				if($(item).attr('rel') && $(item).val() == $(item).attr('rel')) {
					return;
				}
			
				if(!ctx.has('params')) { ctx.set({ params : [] }); };
				
				var param = _.findWhere(ctx.get('params'), {key : $(item).attr('name')});
				if(param) {
					param.key = [param.value];
					param.key.push($(item).val());					
				} else {
					ctx.get('params').push({
						key: $(item).attr('name'),
						value: $(item).val()
					});
				}
			}
		);
		
		console.info(this.get('params'));
		// redir to advanced_search?params...
		this.perform();
	}
});