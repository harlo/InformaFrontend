var InformaCamSearch = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);

		this.set('search_type', "any");
		
		this.set({
			search_bar : VS.init({
				container : this.get('search_el'),
				query : '',
				callbacks: {
					search: this.addParamsFromSearchBar,
					facetMatches: this.facetMatches,
					valueMatches: this.valueMatches
				}
			}),
			advanced_search : {
				container : this.get('advanced_el'),
				clause_tmpl : getTemplate("advanced_search_clause_builder.html")
			}
		});

		$("#ic_search_button").click(_.bind(this.buildAndPerform, this));
		$("#ic_av_add_clause").click(_.bind(this.addClause, this));
		$("#ic_av_search_type").change(_.bind(this.setSearchType, this, $("#ic_av_search_type")));
	},
	buildAndPerform: function() {
		window.location = "/search/?" + this.build()[1];
	},
	perform: function(query) {		
		if(_.isString(query)) {
			if(query[0] == "?") { query = query.substr(1); }

			query = _.map(query.split("&"), function(kvp) {
				return _.object([kvp.split("=")]);
			});

			return this.perform(_.reduce(query, function(m, n) {
				return _.extend(m, n);
			}, {}))
		}

		if(!(_.isObject(query))) { return null; }
		return doInnerAjax("documents", "post", query, null, false);
	},
	setSearchType: function(search_type) {
		if(_.isObject(search_type)) {
			search_type = $("#ic_av_search_type").val();
			$("#ic_av_search_clause_holder").empty();
		}

		if(search_type == "informacam/j3m") { search_type = "j3m"; }
		this.set('search_type', search_type);
	},
	addClause: function() {
		var clause_li = $(this.get('advanced_search').clause_tmpl).clone();
		var clause_opts = $(clause_li).children('.ic_clause_options').children('a');

		$(clause_opts[0]).click(_.bind(this.removeClause, this, clause_opts[0]));
		$(clause_opts[1]).click(_.bind(this.addClause, this));

		var clause_ui = $(document.createElement('li')).append(clause_li);

		var stub = "____________________________";
		var default_stub = $(document.createElement('option')).html(stub);
		$($(clause_ui).find(".ic_clause_selector")[0]).append(default_stub);

		var clause_selector = this.get('search_type') == "application/pgp" ? "source" : "submission";

		_.each(UV.SEARCH_CLAUSE_SELECTORS[clause_selector], function(cs) {
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
	addParamsFromSearchBar: function(query, search_collection) {
		if(!(_.isEmpty(search_collection.models))) {
			search.set('search_bar_params', _.map(search_collection.models, function(m) {
				if(m.get('category') == "Mime Type") { search.setSearchType(m.get('value')); }
				
				return {
					key : (function(m) {
						try {
							return _.findWhere(UV.FACET_VALUES, { category : m }).uri_label;
						} catch(err) { console.warn(err); }

						return m;
						})(m.get('category')),
					value : m.get('value')
				}
			}));
		}
	},
	facetMatches: function(callback) { callback(UV.SEARCH_FACETS); },
	valueMatches: function(facet, search_term, callback) {
		var values = _.findWhere(UV.FACET_VALUES, { category : facet });
		if(values) {
			callback(values.values);
		}				
	},
	build: function() {
		params = this.get('search_bar_params') || [];
		
		_.each($(this.get('advanced_el')).find("input"),
			function(item) {
				// for all inputs
				// might need some massaging beforehand, but:
				// if value is not null: push kvp
				if($(item).attr('rel') ==  "ic_av_noinc") { return; }
				if($(item).val() == "") { return; }
				if($(item).attr('rel') && $(item).val() == $(item).attr('rel')) {
					return;
				}

				if(this.get('search_type') != "j3m") {
					this.setSearchType("j3m");
				}
			
				var key = $(item).attr('name');
				var value = $(item).val();
				
				var trans = _.find(UV.TRANSLATE_VALUES, function(k) {
					return _.contains(k.keys, key);
				});
				
				if(trans) { value = trans.enc(value); }
								
				var param = _.findWhere(params, {key : key});
				if(param) {
					param.value = [param.value, value];
				} else {
					params.push({
						key: key,
						value: value
					});
				}
			}, this);

		var doc_type = "uv_document";
		
		if(this.get('search_type') != "any") {
			var m = _.findWhere(params, { key : "mime_type" });
			if(!m) {
				m = params[Number(params.push({ key : "mime_type" })) - 1];
			}

			switch(this.get('search_type')) {
				case "j3m":
					doc_type = "ic_j3m";
					mime_type = "informacam/j3m";

					params.push({
						key : "cast_as",
						value : "media_id"
					});
					break;
				default:
					mime_type = this.get('search_type');
					break;
			}

			m.value = mime_type;
		}

		params = _.union(params, [
			{
				key : "doc_type",
				value : doc_type
			}
		]);

		var search_uri = _.map(params, function(p) {
			return p.key + "=" + JSON.stringify(p.value);
		}).join("&").replace(/\"/g, "");

		return [params, search_uri];
	}
});