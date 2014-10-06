var InformaCamUser = UnveillanceUser.extend({
	constructor: function() {
		UnveillanceUser.prototype.constructor.apply(this, arguments);
		
		var actions = [
			{
				label : "Register a new user",
				el: "register_new_user"
			},
			{
				label : "Import media",
				el : "import_media"
			},
			{
				label : "Change your password",
				el: "change_password"
			}
		];

		if(this.has('actions')) {
			this.set('actions', _.extend(this.get('actions'), actions));
		} else {
			this.set('actions', actions);
		}
	},
	registerNewUser: function() {

	},
	importMedia: function() {

	},
	changePassword: function() {

	},
	showAction: function(id) {
		if(toggleElement("#" + id)) {
			insertTemplate("user_" + id + ".html", null, null);
		}
	}
});