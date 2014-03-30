var InformaCamAnnex = Backbone.Model.extend({
	constructor: function() {
	
	},
	
	buildOrganization: function() {
		return annex.parseFields();
	},
	
	buildICTD: function() {
		return annex.parseFields();
	}
});