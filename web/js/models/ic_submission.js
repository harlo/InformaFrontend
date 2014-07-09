var InformaCamSubmission = UnveillanceDocument.extend({
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
	setInPanel: function(asset, panel) {
		var callback = null;
		var ctx = this;
		var asset_tmpl = asset;
		
		if(!panel) { panel = "#ic_asset_view_panel"; }
		
		switch(asset) {
			case "info":
				break;
			case "options":
				break;
			case "viewer":
				asset_tmpl += "_submission";
				if(this.getAssetsByTagName("j3m").length > 0) {
					callback = this.loadViewer();
				}
				
				break;
		}
		
		insertTemplate(
			asset_tmpl + ".html", this.toJSON(),
			panel, callback, "/web/layout/views/document/");
		
		if($("#ic_asset_main_ctrl")) {
			$.each($("#ic_asset_main_ctrl").children('li'), function() {
				if($(this).attr('id') == 'ic_d_' + asset) {
					$(this).addClass("ic_active");
				} else {
					$(this).removeClass("ic_active");
				}
			});
		}
	},
	loadViewer: function() {		
		var ctx = this;
		
		doInnerAjax("documents", "post", { _id : this.get("j3m_id") }, function(j3m) {
			j3m = JSON.parse(j3m.responseText);
			if(j3m.result == 200) {
				ctx.set({ j3m : new InformaCamJ3M(j3m.data) });
				ctx.get('j3m').massage();
				
				// merge j3m and submission info
				var merged_asset = ctx.toJSON();
				merged_asset.j3m = ctx.get('j3m').toJSON();
				
				var view_type;
				switch(ctx.get('mime_type')) {
					case "image/jpeg":
						view_type = "image";
						break;
					case "video/x-matroska":
						view_type = "video";
						break;
					case "informacam/log":
						view_type = "log";
						break;
				}
				
				if(!view_type) { return; }
							
				insertTemplate("viewer_" + view_type + ".html", merged_asset,
					"#ic_mime_type_view_holder", function() {
						
						// append j3m viewer to dom
						insertTemplate("j3m_visualizer.html", merged_asset,
							"#ic_j3m_holder", function() {
								// extra magic logic...
								$("#ic_j3m_readout_holder").html(
									JSON.stringify(merged_asset.j3m));
								
								// setup the j3m...
								
								ctx.get('j3m').buildVisualizer("#ic_j3m_visualizer");

							}, "/web/layout/views/document/"
						);

					}, "/web/layout/views/document/"
				);
				
				
			}
		});
	}
});