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
	exportAs: function(extension) {
		var export_func;
		
		var toXSV = function(d, delim, indent) {
			var result = [];
			for(var key in d) {
				var line = [];
				for(var i=0; i<indent; i++) {
					line.push("");
				}
				
				if(d[key] instanceof Array || d[key] instanceof Object) {
					line.push(key + " : ");
					result.push(line.join(delim));
					result.push(toXSV(d[key]), delim, (indent + 1));
				} else {
					if(d instanceof Array) {
						line.push(d[key]);
					} else {
						line.push(key + " : ");
						line.push(JSON.stringify(d[key]));
					}
					
					result.push(line.join(delim));
				}
			}
			
			return result.join('\n');
		};
		
		var toHTML = function(d) {
			var result = [];
			result.push("<ul>");
			
			for(var key in d) {
				var line = [];
				
				if(d[key] instanceof Array || d[key] instanceof Object) {
					line.push("<li>" + key + " :</li>");
					result.push(line.join(""));
					result.push(toHTML(d[key]));
				} else {
					if(d instanceof Array) {
						line.push("<li>" + d[key] + "</li>");
					} else {
						line.push(
							"<li>" + key + " : " + JSON.stringify(d[key] + "</li>"));
					}
					
					result.push(line.join(""));
				}
			}
			
			result.push("</ul>");
			return result.join('\n');
		};
		
		var export_data = this.toJSON();
		
		switch(extension) {
			case "csv":
				export_data = toXSV(export_data, ',', 0);
				break;
			case "tsv":
				export_data = toXSV(export_data, '\t', 0);
				break;
			case "html":
				export_data = [
					"<html><head></head><body>",
					toHTML(export_data),
					"</body></html>"
				].join('\n');
				break;
		}
		
		var export_blob = new Blob([export_data], { type : "text/plain" });		
		return {
			file_name : this.get('media_id') + "." + extension,
			blob_url : URL.createObjectURL(export_blob),
		};
	},
	massage: function() {
		// pare down the sensor capture data: it's overkill
		// append the first 200, last 50 and sample the middle
		console.info("DO WE NEED TO SAMPLE?");
		console.info(this.get('data').sensorCapture.length);
		
		if(this.get('data').sensorCapture && 
			this.get('data').sensorCapture.length > UV.DATA_MAX
		) {
			console.info("SAMPLING DATA BECAUSE SIZE = " + 
				this.get('data').sensorCapture.length);

			var first_sample = 200;
			
			this.get('data').sensorCapture = _.union(
				_.first(this.get('data').sensorCapture, first_sample),
				_.sample(_.rest(this.get('data').sensorCapture, first_sample - 1),
					UV.DATA_MAX - (first_sample + 1)),
				_.last(this.get('data').sensorCapture)
			);
			
			console.info("DATA SAMPLED TO SIZE " + this.get('data').sensorCapture.length);
			this.is_sampled = true;
		}
		
		// format the form data so it can be parsed by Mustache
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
				.attr({ 'id' : id });
			
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