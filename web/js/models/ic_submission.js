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
	setInPanel: function(asset) {
		var callback = null;
		var ctx = this;
		
		switch(asset) {
			case "info":
				break;
			case "options":
				break;
			case "viewer":
				var has_j3m = this.getAssetsByTagName("j3m").length > 0;
				if(has_j3m) {
					callback = this.loadJ3M();
				}
				
				var mt = "image";
				switch(this.get('mime_type')) {
					case "informacam/log":
						mt = "log";
						break;
					case "video/x-matroska":
						mt = "video";
						break;
				}
				asset += ("_" + mt);
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
	},
	loadJ3M: function(el) {
		if(!el) { el = "#ic_j3m_holder"; }
		
		var ctx = this;
		doInnerAjax("documents", "post", { _id : this.get("j3m_id") }, function(j3m) {
			j3m = JSON.parse(j3m.responseText);
			if(j3m.result == 200) {
				ctx.set({ j3m : new InformaCamJ3M(j3m.data) });
				insertTemplate("j3m_stub.html", ctx.get('j3m').toJSON(), el, function() {
					$("#ic_j3m_output").html(JSON.stringify(ctx.get('j3m').toJSON()));
				});
			}
		});
	}
});