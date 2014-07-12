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
	
	updateJ3M: function() {
		if(!this.has('j3m_id')) { return; }
		
		var ctx = this;
		
		doInnerAjax("documents", "post", { _id : this.get("j3m_id") },
			function(j3m) {
				j3m = JSON.parse(j3m.responseText);
				if(j3m.result != 200) { return; }
	
				// merge j3m and submission info
				ctx.set({ j3m : new InformaCamJ3M(j3m.data) });
				ctx.get('j3m').massage();
			}, 
		false);
	},
	
	save: function() {
	
	},

	setInPanel: function(asset, panel) {
		var callback = j3m_callback = null;
		var ctx = this;
		
		var asset_tmpl = asset;
		var merged_asset = this.toJSON();
		
		if(!panel) { panel = "#ic_asset_view_panel"; }
		
		switch(asset) {
			case "info":
				break;
			case "options":
				break;
			case "viewer":
				asset_tmpl += "_submission";
				
				if(!this.has("j3m")) { this.updateJ3M(); }
				
				if(this.has("j3m")) {
					merged_asset.j3m = this.get('j3m').toJSON();
					j3m_callback = this.loadViewer;
				}
				
				var view_type;
				switch(this.get('mime_type')) {
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
								
				callback = function() {
					insertTemplate("viewer_" + view_type + ".html", merged_asset,
						"#ic_mime_type_view_holder", j3m_callback,
						"/web/layout/views/document/", ctx
					);
				};

				break;
		}
		
		insertTemplate(
			asset_tmpl + ".html", merged_asset,
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
	showError: function() {
		alert("This submission cannot be displayed.");
	},
	loadViewer: function() {
		var ctx = this;
		console.info(this);
				
		var merged_asset = this.toJSON();
		merged_asset.j3m = this.get('j3m').toJSON();
				
		$("#ic_j3m_holder").html("Loading...");
		
		insertTemplate("j3m_visualizer.html", merged_asset,
			"#ic_j3m_holder", function() {
				
				var j3m_readout = new UVIndentedTree({
					root_el: "#ic_j3m_readout_holder",
					data: merged_asset.j3m
				});
			
				ctx.get('j3m').buildVisualizer("#ic_j3m_visualizer");

			}, "/web/layout/views/document/"
		);
	}
});