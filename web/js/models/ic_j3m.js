function parseSensorEventKeys(keep_keys, sensorEvent) {
	var keys_found = 0;
	for(key in sensorEvent.sensorPlayback) {
		if(keep_keys.indexOf(key) != -1) { keys_found++; }
	}
	
	return keys_found == keep_keys.length;
}

function CFSort(dimension) {
	return dimension.top(Infinity).sort(function(a, b) {
		return a.timestamp < b.timestamp ? -1 : 1;
	});
}

var InformaCamJ3M = Backbone.Model.extend({
	constructor: function(inflate) {
		Backbone.Model.apply(this, arguments);
		this.massage();
	},
	buildVisualizer: function(el) {
		$(el).empty();
		this.build();
		
		_.each(this.j3m_info, function(ji) {
			var ji_id = "ic_j3m_" + randomString().toLowerCase();
			var ji_holder = $(document.createElement('div'))
				.attr({ id : ji_id })
				.addClass("ic_j3m_info_viz")
				.append($(document.createElement('h3')).html(ji.label));
			
			$(el).append($(document.createElement('li')).append(ji_holder));
			ji.build("#" + ji_id);
		});
	},
	massage: function() {
		if(this.get('data').userAppendedData) {
			_.each(this.get('data').userAppendedData, function(ad) {
				_.each(ad.associatedForms, function(form) {
					form.answer_kvp = [];
					for(var key in form.answerData) {
						form.answer_kvp.push({
							key: key,
							value: form.answerData[key]
						});
					};
				}); 
			});
			
		}
		
		if(!this.get('data').exif) {
			this.get('data').exif = {};
		}
		
		if(!this.get('data').exif.location) {
			var sensorEvents = crossfilter(this.get("data").sensorCapture);
			var d = CFSort(sensorEvents.dimension(function(se) { return se.timestamp; }));
			var gps = d.filter(function(se) {
				return parseSensorEventKeys(["gps_coords"], se);
			})[0];
			
			if(gps) {
				this.get('data').exif.location = gps.sensorPlayback.gps_coords;
			}
		}
	},
	setInfo: function(item) {
		var info_holder = $(document.createElement('div'));
		insertTemplate("j3m_info.html", item, info_holder, function() {
			var id = item.label.replace(/ /g, "").replace(/,/g, "").toLowerCase();
		
			$($(info_holder).find(".ic_j3m_info_vizualization")[0])
				.attr({
					'id' : id
				});
			$("#ic_j3m_info_holder").append(info_holder);
		
			item.viz = item.build("#" + id);
		});
	},
	build: function() {		
		this.j3m_info = {};
		var sensorEvents = crossfilter(this.get("data").sensorCapture);
		var d = CFSort(sensorEvents.dimension(function(se) { return se.timestamp; }));
		var ts = { f : d[0].timestamp, l : d[d.length - 1].timestamp };
		
		this.j3m_info.gpsTrace = {
			label : "Location and Movement",
			build: function(id) {
				return new InformaCamTimeseriesMap({
					data : d.filter(function(se) {
						return parseSensorEventKeys(["gps_coords"], se);
					}),
					root_el : id
				});
			}
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
});