var InformaCamDocumentBrowser = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		this.root_el = this.get("root_el");
		this.unset("root_el");
		
		if(!this.has('data') || !this.get('data')) {
			$(this.root_el)
				.css('height', 'auto')
				.html("No files here");
			
			this.invalid = true;
			return;
		}
		
		var ctx = this;
		
		$("#ic_asset_collection_toggle").change(function() {
			if($(this).prop('checked')) {
				window.location = "#collection=" + ctx.buildCollection()
			} else { 
				ctx.clearCollection();
				window.location = "#";
			}
		});

		getTemplate("browser_dir.html", function(res) {
			return (function(ctx) {
				if(res.status == 200) {
					ctx.dir_tmpl = res.responseText;
					getTemplate("browser_item.html", function(res) {
						if(res.status == 200) {
							ctx.item_tmpl = res.responseText;
							ctx.buildDocumentTree();
							ctx.applyCollection();
						}
					});
				}
			})(ctx);
		});
		
	},
	
	clearSelected: function() {
		var ctx = this;
		
		$.each($(this.root_el).find("input:checkbox"), function() {
			$(this).prop('checked', false);
			var _id = $($(this).parent()).attr('id').replace("ic_db_", "");
			ctx.get('collection').removeItem(_id);
		});
	},
	
	buildCollection: function() {
		var selected = [];
		$.each($(this.root_el).find(":checked"), function() {
			selected.push({ _id : $($(this)).parent().attr('id').replace("ic_db_", "")});
		});
		
		return JSON.stringify(selected);
	},
	
	clearCollection: function() {
		$.each($(this.root_el).find("input:checkbox"), function(cb) {
			$(cb).prop('checked', false);
			$(cb).unbind();
		});
		
		if(current_mode != "search") {
			onViewerModeChanged("asset");
		}
		
		$("#ic_asset_collection_toggle").prop('checked', false);
	},
	
	applyCollection: function() {		
		if(!this.has('collection')) {
			if(current_collection) { this.set('collection', current_collection); }
		}
		
		if(!this.has('collection')) { return; }
		
		var collection = this.get('collection');
		var is_real_collection = false;
		
		_.each(collection.get('collection'), function(item) {
			if(item._id) {
				if(!is_real_collection) { is_real_collection = true; }				
				var el = $("#ic_db_" + item._id).children("input:checkbox")[0];
				$(el).prop('checked', true);				
			}
		});
		
		if(is_real_collection) {
			console.info("CURRENT MODE: " + current_mode);
			if(current_mode != "search") {
				onViewerModeChanged("collection");
			}
			
			$("#ic_asset_collection_toggle").prop('checked', true);
			$($(this.root_el).find("input:checkbox")).change(function() {
				var _id = $($(this).parent()).attr('id').replace("ic_db_", "");
				if($(this).prop('checked')) {
					collection.addItem(_id);
				} else {
					collection.removeItem(_id);
				}
			});
		}
	},
	
	exportCollection: function() {
		console.info("EXPORTING CURRENT COLLECTION");
		this.get('collection').save();
	},

	buildDocumentTree: function(dir) {
		$(this.root_el).empty();
		this.clearCollection();
		
		if(!dir) { dir = this.get('data'); }
		
		
		var ctx = this;
		_.each(dir, function(doc) {
			var dir_name = "root";
			var path_segments = doc.file_name.split("/");
			
			if(path_segments.length > 1) {
				_.each(path_segments, function(segment) {
					// drill into segment to create path (TODO, maybe...)
				});
			}
			
			var dir_id = dir_name.replace(/W+/g, "_");
			var dir_el = $(ctx.root_el).find("#" + dir_id + "_list")[0];
			
			var dir_data = {
				dir_id : dir_id,
				dir_name : dir_name
			};
			
			if(!dir_el) {
				dir_el = Mustache.to_html(ctx.dir_tmpl, dir_data);
				$(ctx.root_el).append(dir_el);
				dir_el = $(ctx.root_el).find("#" + dir_id + "_list")[0];
			}
			
			$($(dir_el).children('ul.ic_dir_list')[0])
				.append(Mustache.to_html(ctx.item_tmpl, doc));
		});
	}
});