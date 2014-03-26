var CompassDocument = Backbone.Model.extend({
	idAttribute: "_id",
	constructor: function() {
		Backbone.Model.apply(this, arguments);
	},
	
	createUIHandle: function(ui_handle) {
		
		this.ui_handle = new CompassUIHandle($(ui_handle), new LabeledRect({
			label: this.has('alias') ? this.get('alias') : this.get('file'),
			fill: '#000000'
		}), undefined, this.get('_id'));
		
		this.ui_handle.setOnMouseUp(this.ui_handle, "returnToOrigin");
		
		compass_canvas.addAsset(this.ui_handle);
	},
	
	onDestroy: function() {
		compass_canvas.removeAsset(this.ui_handle);
	}
});

var CompassDocuments = Backbone.Collection.extend({
	model: CompassDocument
});

var CompassFileSystem = Backbone.Model.extend({
	constructor: function() {
		this.sort_on = "date_inserted";
		this.ui_root = $("#c_file_list_holder ul")[0];
		
		this.as_group = false;
		this.filters = [];
	},
	
	addDocument: function(doc, resort, redraw) {
		
		if(!this.documents) {
			this.documents = new CompassDocuments();
		}
		
		doc = new CompassDocument(doc);
		this.documents.add(doc);
		
		if(!this.crossfilter) {
			this.crossfilter = crossfilter([doc.toJSON()]);
		} else {
			this.crossfilter.add([doc.toJSON()]);
		}
		
		if(resort) { this.resort(); }
		if(redraw) { this.redraw(); }
	},
	
	addDocuments: function(docs, resort, redraw) {
		_.each(docs, function(doc) {
			compass_documents.addDocument(doc);
		});
		
		if(resort) { this.resort(); }
		if(redraw) { this.redraw(); }
	},
	
	resort: function(filter_funcs, sort_on) {
		if(sort_on) { this.sort_on = sort_on; }
		
		if(!this.filters) { 
			this.filter = [];
		}
		
		var filter = {
			'dimension' : this.crossfilter.dimension(function(a) {
				return a[compass_documents.sort_on];
			}),
			'filters' : []
		};
		
		if(filter_funcs) {
			_.each(filter_funcs, function(f) { filter.filters.push(f); });
		}
		
		this.filters.push(filter);
		this.filter(filter);
	},
	
	filter: function(filter, redraw) {
		if(!filter) { filters = this.filters; }
		else filters = [filter];
		
		_.each(filters, function(filter_) {
			_.each(filter_.filters, function(f) {
				filter_.dimension.filterFunction(f);
			});
		});
	},
	
	getGroup: function(as_list) {
		current_group = _.where(this.documents.models, { selected : true });
		if(as_list) {
			current_group = _.map(current_group, function(d) { return d.id; });
		}
			
		return current_group;
	},
	
	redraw: function(filter, direction, limit) {
		if(!filter) { filter = this.filters[this.filters.length - 1]; }		
		if(!limit) { limit = Infinity; }
		
		var r = null;
		if(!direction) {
			r = filter.dimension.top(limit);
		} else {}	// ugh......
		
		if(r == null) { return; }
		
		console.info(r);

		$(this.ui_root).empty();
		insertTemplate("files_list.html", r, this.ui_root, function() {
			var file_handles = $(compass_documents.ui_root).find(".c_object_handle");	
			$.each(file_handles, function(idx, item) {
				$(item).click(function() {
					
					var selected = compass_documents.documents.at(idx).selected;
					if(selected == undefined) {
						compass_documents.documents.at(idx).selected = selected = false;
					}
					
					selected = !selected;
					
					if(selected) { 
						$(this).addClass('c_selected'); 
					} else { 
						$(this).removeClass('c_selected'); 
					}
					
					compass_documents.documents.at(idx).selected = selected;
					updateGroupUIHandle(true);
				});
			});
		});
	}
});

function hideFileHandlers() {
	var range = [];
	x=0;
	while(range.push(x++)<compass_documents.documents.length);
	
	_.each(range, function(x) {
		compass_canvas.hideAsset(compass_documents.documents.at(x).ui_handle);
	});
	compass_canvas.canvas.renderAll();
}

function showFileHandlers() {
	var range = [];
	x=0;
	while(range.push(x++)<compass_documents.documents.length);
	
	_.each(range, function(x) {
		compass_canvas.showAsset(compass_documents.documents.at(x).ui_handle);
	});
	compass_canvas.canvas.renderAll();
}