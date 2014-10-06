var InformaCamJ3M = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
	},
	getHeader: function() {
		var headerData = doInnerAjax("j3mheader/" + this.get("media_id"), "get", {}, null, false);
		return headerData.data;
	}
});