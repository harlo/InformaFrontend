var CompassRunLog = Backbone.Model.extend({
	constructor: function() {
		this.ui_holder = $("#c_log_output");
	},
	log: function(message) {
		this.ui_holder.append(
			$(document.createElement('li')).html(message));
	},
	clear: function() {
		this.ui_holder.empty();
	}
});