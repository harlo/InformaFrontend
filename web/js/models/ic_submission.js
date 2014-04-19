var InformaCamSubmission = Backbone.Model.extend({
	constructor: function(inflate) {
		Backbone.Model.apply(this, arguments);
		this.idAttribute = "_id";
	},
	
	loadJ3M: function() {
		return true;
	}
});