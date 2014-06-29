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
	}
	/*
	buildJ3M: function() {
		
		console.info("loading j3m into view");
		
		this.j3m_info = {};
		var sensorEvents = crossfilter(this.get("j3m").data.sensorCapture);
		var d = CFSort(sensorEvents.dimension(function(se) { return se.timestamp; }));
		var ts = { f : d[0].timestamp, l : d[d.length - 1].timestamp };
		
		this.j3m_info.gpsTrace = {
			label : "Movement",
			legend: [],
			filter: d.filter(function(se) {
				return parseSensorEventKeys(["gps_coords"], se);
			}),
			build: function() {}
		};
		
		this.j3m_info.pitchRollAzimuth = {
			label: "Pitch, Roll, Azimuth",
			build: function(id) {
				return new InformaCamTimeseriesGraph({
					data : d.filter(function(se) {
						return parseSensorEventKeys(["pitch", "pitchCorrected", "roll",
							"rollCorrected", "azimuth", "azimuthCorrected"], se);
					}),
					root_el : id,
					first_timestamp: ts.f,
					last_timestamp: ts.l,
					legend : [
						{ key : "pitch", label : "Pitch" }, 
						{ key : "roll", label : "Roll" }, 
						{ key : "azimuth", label : "Azimuth" }
					]
				});
			}
		};
		
		this.j3m_info.accelerometer = {
			label : "Accelerometer",
			build: function(id) {
				return new InformaCamTimeseriesGraph({
					data : d.filter(function(se) {
						return parseSensorEventKeys(["acc_x", "acc_y", "acc_z"], se);
					}),
					root_el : id,
					first_timestamp: ts.f,
					last_timestamp: ts.l,
					legend : [
						{ key : "acc_x", label : "X" }, 
						{ key : "acc_y", label : "Y" }, 
						{ key : "acc_z", label : "Z" }
					]
				});
			}
		};
		
		this.j3m_info.lightMeterValue = {
			label : "Light Meter",
			build: function(id) {
				return new InformaCamTimeseriesGraph({
					data : d.filter(function(se) {
						return parseSensorEventKeys(["lightMeterValue"], se);
					}),
					root_el : id,
					first_timestamp: ts.f,
					last_timestamp: ts.l,
					legend : [{ key : "lightMeterValue", label : "Light Meter" }]
				});
			}
		};
		
		this.j3m_info.visibleCellTowers = {
			label : "Nearby Cell Towers",
			build: function(id) {
				return new InformaCamTimeseriesChart({
					data : d.filter(function(se) {
						return parseSensorEventKeys(["cellTowerId", "MCC", "LAC"], se);
					}),
					root_el : id,
					first_timestamp: ts.f,
					last_timestamp: ts.l,
					legend : [{ key : "cellTowerId", label : "Cell Tower ID" }]
				});
			}
		};
		
		this.j3m_info.visibleBluetoothDevices = {
			label : "Visible Bluetooth Devices",
			build: function(id) {
				return new InformaCamTimeseriesChart({
					data : d.filter(function(se) {
						return parseSensorEventKeys(["bluetoothDeviceAddress"], se);
					}),
					root_el : id,
					first_timestamp: ts.f,
					last_timestamp: ts.l,
					legend : [{
						key : "bluetoothDeviceAddress", 
						label : "Bluetooth Device (hashed)" 
					}]
				});
			}
		};
		
		this.j3m_info.visibleWifiNetworks = {
			label : "Visible Wifi Networks",
			build: function(id) {
				return new InformaCamTimeseriesChart({
					data : d.filter(function(se) {
						return parseSensorEventKeys(["visibleWifiNetworks"], se);
					}),
					root_el : id,
					first_timestamp: ts.f,
					last_timestamp: ts.l,
					legend : [{
						key : "visibleWifiNetworks.bssid", 
						label : "Wifi Network" 
					}]
				});
			}
		};
		
		
		
	}
	*/
});