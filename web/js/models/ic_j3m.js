var InformaCamJ3M = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
	},
	getHeader: function() {
		var headerData = doInnerAjax("j3mheader/" + this.get("media_id"), "get", {}, null, false);
		if (headerData.result != 200) {
			console.error("headerData.result " + headerData.result);
			return false;
		}
		return headerData.data;
	},
	
	getStrippedJ3M : function() {
		var strippedData = doInnerAjax("j3mretrieve/" + this.get("media_id"), "get", {}, null, false);
		if (strippedData.result != 200) {
			console.error("strippedData.result " + strippedData.result);
			return false;
		}
		return strippedData.data;
	},
	
	getLightMeterValues : function() {
		var lightMeterValues = doInnerAjax("lightMeter/" + this.get("media_id"), "get", {}, null, false);
		return {"lightmeter": lightMeterValues};
	},
});