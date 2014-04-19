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
		
		this.sensorFilters = {};
		var sensorEvents = crossfilter(this.get("j3m").data.sensorCapture)
		var d = CFSort(sensorEvents.dimension(function(se) { return se.timestamp; }));
		
		this.sensorFilters.pitchRollAzimuth = d.filter(function(se) {
				return parseSensorEventKeys(["pitch", "pitchCorrected", "roll",
					"rollCorrected", "azimuth", "azimuthCorrected"], se);
		});
		
		this.sensorFilters.accelerometer = d.filter(function(se) {
			return parseSensorEventKeys(["acc_x", "acc_y", "acc_z"], se);
		});
		
		this.sensorFilters.lightMeterValue = d.filter(function(se) {
			return parseSensorEventKeys(["lightMeterValue"], se);;
		});
		
		this.sensorFilters.visibleCellTowers = d.filter(function(se) {
			return parseSensorEventKeys(["cellTowerId", "MCC", "LAC"], se);
		});
		
		this.sensorFilters.visibleBluetoothDevices = d.filter(function(se) {
			return parseSensorEventKeys(["bluetoothDeviceAddress"], se);
		});
		
		this.sensorFilters.visibleBluetoothDevices = d.filter(function(se) {
			return parseSensorEventKeys(["bluetoothDeviceAddress"], se);
		});
		
		this.sensorFilters.visibleWifiNetworks = d.filter(function(se) {
			return parseSensorEventKeys(["visibleWifiNetworks"], se);
		});
		
	}
});