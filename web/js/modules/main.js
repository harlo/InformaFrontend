var document_browser, current_collection, current_asset, current_mode;

function initAssetBrowser() {
	doInnerAjax("documents", "post", null, function(json) {
		try {
			json = JSON.parse(json.responseText);
			if(json.result == 200) {
				document_browser = new InformaCamDocumentBrowser({
					root_el: "#ic_asset_browser_holder",
					data: json.data.documents
				});
			}
			
			if(current_asset) { current_asset.updateInfo(); }
			
		} catch(err) { 
			console.warn("COULD NOT UPDATE ASSET BROWSER AT THIS TIME");
			console.warn(err);
		}
	});
}

function loadModule(module_name) {
	$("#ic_module_output_holder").empty();
}

function loadAsset(asset_type, _id) {
	if(asset_type == "submission") {
		current_asset = new InformaCamSubmission({ _id : _id });
	} else if(asset_type == "source") {
		current_asset = new InformaCamSource({ _id : _id });
	}
	
	try {
		current_asset.updateInfo();
	} catch(err) {
		console.warn("COULD NOT LOAD WHOLE ASSET AT THIS TIME");
		console.warn(err);
	}
}

function buildDocumentCollection(collection) {
	current_collection = new InformaCamCollection(collection);
	
	try {
		document_browser.applyCollection();
	} catch(err) {
		console.warn("COULD NOT APPLY COLLECTION AT THIS TIME");
		console.warn(err);
	}
}

function onViewerModeChanged(mode, force_reload) {
	if(!force_reload && mode == current_mode) { return; }
	
	current_mode = mode;	
	var data = null;
	var callback = null;
	
	if(current_mode == "collection" && current_collection) {
		data = { collection_size : current_collection.get('collection').length };
		callback = function(res) {
			try {
				current_collection.update();
			} catch(err) { 
				console.warn("COULD NOT UPDATE COLLECTION AT THIS TIME");
				console.warn(err);
			}
		};
	} else if(current_mode == "asset" && current_asset) {
		data = current_asset.toJSON();
		callback = function(res) {
			try {
				current_asset.initViewer();
				current_asset.setInPanel('info');
				$("#ic_asset_collection_toggle").prop('checked', false);
			} catch(err) {
				console.warn("COULD NOT INIT ASSET VIEWER AT THIS TIME");
				console.warn(err);
			}
		}
	}
	
	insertTemplate(mode + "_status.html", data, 
		$("#ic_viewer_panel"), callback, "/web/layout/views/main/");
}

(function($) {
	var content_sammy = $.sammy("#content", function() {
		this.get('#collection=:collection', function() {
			
			try {
				var collection = JSON.parse(
					"{ \"batch\" : " + 
					decodeURIComponent(this.params['collection']).replace(/\'/g, '"') + 
					"}"
				);
				buildDocumentCollection(collection);
			} catch(err) { 
				console.warn(err);
				console.warn("COULD NOT BUILD DOC COLLECTION AT THIS TIME");
			}
		});
		
		this.get('#(submission|source)/:_id', function() {
			loadAsset(this.params.splat[0], this.this.params['_id']);
		});
		
		this.get('#module/:module', function() {
			loadModule(this.params['module']);
		});
	});
	
	$(function() {
		content_sammy.run();
		window.setTimeout(function() {
			initAssetBrowser();
		}, 2000);
	});
})(jQuery);