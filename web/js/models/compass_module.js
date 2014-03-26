var CompassModule = Backbone.Model.extend({
	constructor: function(context, on_load) {
		$("#c_stage_hotzone").empty();
	
		this.holder = $(document.createElement('iframe'))
			.attr('src', "/" + context + "/")
			.load(on_load);
	
		$("#c_stage_hotzone").append(this.holder);
	}
});