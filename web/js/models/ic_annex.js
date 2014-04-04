var InformaCamAnnex = Backbone.Model.extend({
	constructor: function() {
		this.repository = {};
	},
	
	build: function() {
		if(!annex.parseFields()) { return false; }
		
		
		
		return false;
	},
	
	addToRepository: function(file, res) {		
		if(!this.repository) { return false; }		
		if(res.data != 200) { return false; }
		
		for(var a=0; a<res.data.addedFiles.length; a++) {
			if(!this.repository.assets) { this.repository.assets = []; }
			this.repository.assets.push(res.data.addedFiles[a]);
		}
	},
	
	setRepository: function(repository) {
		this.repository.name = repository;
	},
	
	clearForms: function() {
	
	}
});