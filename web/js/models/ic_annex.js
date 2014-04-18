var InformaCamAnnex = Backbone.Model.extend({
	constructor: function() {
		this.annex_bundle = {}
	},
	buildDefaults: function() {
		console.info("build defaults");
		return annex.parseFields();
	},
	buildExtras: function() {
		if(!annex.parseFields()) { return false; }
		return informaCamAnnex.buildAll();
	},
	buildAll: function() {
		for(var key in annex.annex_bundle) {
			if(key.match(/^informacam/)) {
				var val = annex.annex_bundle[key];
				informaCamAnnex.annex_bundle[key] = val;
				delete annex.annex_bundle[key];
			}
		}
		
		// send off informa stuff
		doInnerAjax("init_informacam", "post",
			JSON.stringify(informaCamAnnex.annex_bundle),
			function(json) {
				json = JSON.parse(json.responseText);
				if(json.result == 200) {
					
				}
			}
		);
		
		return true;
	},
	setRepository: function(repository) {
		if(!this.repository) { this.repository = {}; }
		this.repository.name = repository;
	},
	clearForms: function() {
	
	}
});