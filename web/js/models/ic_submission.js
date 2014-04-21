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

var InformaCamSubmission = Backbone.Model.extend({
	constructor: function(inflate) {
		Backbone.Model.apply(this, arguments);
		this.idAttribute = "_id";
	},
	
	buildJ3M: function() {
		console.info("loading j3m into view");
		
		this.j3m_info = {};
		var sensorEvents = crossfilter(this.get("j3m").data.sensorCapture)
		var d = CFSort(sensorEvents.dimension(function(se) { return se.timestamp; }));
		
		this.j3m_info.gpsTrace = {
			label : "Movement",
			legend: [],
			filter: d.filter(function(se) {
				return parseSensorEventKeys(["gps_coords"], se);
			})
		};
		
		this.j3m_info.pitchRollAzimuth = {
			label : "Pitch, Roll, Azimuth",
			legend : [{ key : "pitch" }, { key : "roll" }, { key : "azimuth" }],
			filter: d.filter(function(se) {
				return parseSensorEventKeys(["pitch", "pitchCorrected", "roll",
					"rollCorrected", "azimuth", "azimuthCorrected"], se);
			})
		};
		
		this.j3m_info.accelerometer = {
			label : "Accelerometer",
			legend : [],
			filter: d.filter(function(se) {
				return parseSensorEventKeys(["acc_x", "acc_y", "acc_z"], se);
			})
		};
		
		this.j3m_info.lightMeterValue = {
			label : "Light Meter",
			legend: [],
			filter: d.filter(function(se) {
				return parseSensorEventKeys(["lightMeterValue"], se);;
			})
		};
		
		this.j3m_info.visibleCellTowers = {
			label : "Nearby Cell Towers",
			legend : [],
			fitler : d.filter(function(se) {
				return parseSensorEventKeys(["cellTowerId", "MCC", "LAC"], se);
			})
		};
		
		this.j3m_info.visibleBluetoothDevices = {
			label : "Visible Bluetooth Devices",
			legend : [],
			filter : d.filter(function(se) {
				return parseSensorEventKeys(["bluetoothDeviceAddress"], se);
			})
		}
		
		this.j3m_info.visibleWifiNetworks = {
			label : "Visible Wifi Networks",
			legend : [],
			filter : d.filter(function(se) {
				return parseSensorEventKeys(["visibleWifiNetworks"], se);
			})
		};
	}
});