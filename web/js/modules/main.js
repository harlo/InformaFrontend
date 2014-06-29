var document_browser, current_collection, current_asset, current_mode;

function initAssetBrowser() {
	doInnerAjax("documents", "post", 
		{ mime_type : "[application/pgp,image/jpeg,video/x-matroska,informacam/log]" },
		function(json) {
			try {
				json = JSON.parse(json.responseText);
				if(json.result == 200) {
					document_browser = new InformaCamDocumentBrowser({
						root_el: "#ic_asset_browser_holder",
						data: _.map(json.data.documents, function(doc) {
							switch(doc.mime_type) {
								case "application/pgp":
									asset_type = "source";
									break;
								default:
									asset_type = "submission";
									break;
							}
							
							return _.extend(doc, { asset_type : asset_type });
						})
					});
				}
			
				if(current_asset) { current_asset.updateInfo(); }
			
			} catch(err) { 
				console.warn("COULD NOT UPDATE ASSET BROWSER AT THIS TIME");
				console.warn(err);
			}
		}
	);
}

function loadModule(module_name) {
	$("#ic_module_output_holder").empty();
	var module = _.findWhere(
		current_collection.get('modules'), { name : module_name });
	if(!module) { return; }
	
	var ctx = this;
	var data = {}
	var data_handled = 0;
	
	var onDataHandled = function(callback) {
		console.info("DATA DONE!");
		console.info(data);
		
		getTemplate(module_name + ".html", function(res) {
			if(res.status != 200) { return; }
			
			$("#ic_module_output_holder").html(Mustache.to_html(res.responseText, data));
			callback.call();
			
		}, "/web/layout/views/module/", this);
	};
	
	_.each(module._ids, function(_id) {
		var doc = new UnveillanceDocument(
			_.findWhere(document_browser.get('data'), { _id : _id }));
		if(!doc) { return; }
	
		switch(module_name) {
			case "merge_j3m":		
				try {
					var j3m_file = doc.getAssetsByTagName(UV.ASSET_TAGS['J3M'])[0]
						.file_name;
					j3m_file = doc.get('base_path') + "/" + j3m_file;
				} catch(err) {
					console.error(err);
					return;
				}
				
				getFileContent(data, j3m_file,
					function(json) {
						json = JSON.parse(json.responseText);							
						if(!json.data) { return; }

						console.info(json.data);
						if(!this.contributors) { this.contributors = []; }
						
						this.contributors.push({
							pgpKeyFingerprint : json.intent.pgpKeyFingerprint,
							alias : json.intent.alias,
							exif : json.data.exif
						});
						
						if(!this.sensorCapture) { this.sensorCapture = []; }
						
						var ts_dest = _.pluck(this.sensorCapture, "timestamp");
						var ts_src = _.pluck(json.data.sensorCapture, "timestamp");
													
						var intersection = _.intersection(ts_src, ts_dest);
						
						for(var i in intersection) {
							// pluck out the object
							// if has key, turn into arry and append new value
							// remove from src
						}
						
						this.sensorCapture = _.union(
							this.sensorCapture, json.data.sensorCapture);
							
						if(!this.j3ms) { this.j3ms = []; }
						this.j3ms.push(new InformaCamJ3M({
							data : {
								sensorCapture : json.data.sensorCapture
							},
							root_el : "#ic_j3m_info_holder"
						}));
						
						if(!this.locations) { this.locations = []; }
						this.locations.push({
							lat_lng : json.data.exif.location,
							_id : doc._id
						});
						
						data_handled++;
						
						if(data_handled == module._ids.length) {
							onDataHandled(function() {
								data.map = new InformaCamMap({
									data : data.locations,
									root_el : "#ic_j3m_location_holder"
								});
								
								_.each(data.j3ms, function(j3m) {
									j3m.build();
									_.each(j3m.j3m_info, j3m.setJ3MInfo);
								});
							});
						}
					}
				);		
				break;
		}
	});
	
	
}

function loadAsset(asset_type, _id) {
	console.info(arguments);
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
					"{ \"collection\" : " + 
					decodeURIComponent(this.params['collection']).replace(/\'/g, '"') + 
					"}"
				);
				buildDocumentCollection(collection);
			} catch(err) { 
				console.warn(err);
				console.warn("COULD NOT BUILD DOC COLLECTION AT THIS TIME");
			}
		});
		
		this.get('/#(submission|source)/:_id', function() {
			loadAsset(this.params['_id'], this.params.splat[0]);
		});
	});
	
	$(function() {
		content_sammy.run();
		window.setTimeout(function() {
			initAssetBrowser();
		}, 2000);
	});
})(jQuery);