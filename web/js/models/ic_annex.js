var InformaCamAnnex = Backbone.Model.extend({
	constructor: function() {
	
	},
	
	buildOrganization: function() {
		var values = $(annex.values_holder).find("input");
		if(values.length == 0) { return false; }
		
		
		
		return false;
	},
	
	buildICTD: function() {
		var values = $(annex.values_holder).find("input");
		if(values.length == 0) { return false; }
		
		return false;
	}
});