var InformaCamNotifier = UnveillanceNotifier.extend({
	constructor: function() {
		window.onSocketConnect = _.bind(this.onSocketConnect, this);
		window.onSocketOpen = _.bind(this.onSocketOpen, this);
		window.onSocketClose = _.bind(this.onSocketClose, this);
		window.onSocketMessage = _.bind(this.onSocketMessage, this);

		UnveillanceNotifier.prototype.constructor.apply(this, arguments);
	},

	onSocketOpen: function(args) {},

	onSocketClose: function(args) {},

	onSocketConnect: function() {},

	onSocketMessage: function(args) {
		console.info("MESSAGE RECEIVED: WHAT DO WE DO?");
		console.info(args);
	}
});