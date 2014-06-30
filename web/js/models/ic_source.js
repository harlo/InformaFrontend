var InformaCamSource = UnveillanceDocument.extend({
	constructor: function(inflate) {
		UnveillanceDocument.prototype.constructor.apply(this, arguments);
	},
	updateInfo: function() {
		var updated_info = _.findWhere(
			document_browser.get('data'), { _id : this.get('_id') });
		
		if(updated_info) {
			this.set(updated_info);
			onViewerModeChanged("asset", force_reload=true);
		}
	},
	
	initViewer: function() {
		if(!this.has('available_views')) {
			this.set('available_views', []);
		}
	},
	setInPanel: function(asset) {
		var callback = null;
		var ctx = this;
		
		switch(asset) {
			case "info":
				break;
			case "options":
				break;
			case "viewer":
				asset += "_source";
				break;
		}
		
		insertTemplate(
			asset + ".html", this.toJSON(),
			"#ic_asset_view_panel", callback, "/web/layout/views/document/");
		
		$.each($("#ic_asset_main_ctrl").children('li'), function() {
			if($(this).attr('id') == 'ic_d_' + asset) {
				$(this).addClass("ic_active");
			} else {
				$(this).removeClass("ic_active");
			}
		});
	}
});