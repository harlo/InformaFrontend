var InformaCamUser = Backbone.Model.extend({
	constructor: function(username, password) {
		if(username && password) {
			this.doLogin(username, password);
		}
	},
	
	setUser: function(user_data) {
		localStorage.setItem('informacam_user', JSON.stringify(user_data));
		window.location.reload();
	},
	
	unsetUser: function() {
		localStorage.clear();
		window.location = "/";
	},
	
	render: function() {
		return { saved_searches : this.saved_searches };
	},
	
	save: function() {
		localStorage.setItem('informacam_user', JSON.stringify(this.render()));
	},
	
	saveSearch: function(path_to_search) {
		this.saved_searches.push(path_to_search);
		this.save();
	},
	
	removeSearch: function(path_to_search) {
		if(this.hasSearch(path_to_search)) {
			var idx = this.saved_searches.indexOf(path_to_search);
			this.saved_searches.splice(idx, 1);
		}
		this.save();
	},
	
	hasSearch: function(path_to_search) {
		if(this.saved_searches.indexOf(path_to_search) >= 0) {
			return true;
		}

		return false;
	},
	
	doLogin: function(username, password) {
		doInnerAjax("/login/", "post", 
			JSON.stringify({ username : username, password : password}),
			function(json) {
				json = JSON.parse(json.responseText);
				if(json.result == 200) {
					informacam_user.setUser(json.data);
				}
			}
		);
	},
	
	doLogout: function(with_password) {
		var user_data = null;
		if(with_password) {
			// parse field for username and password
			user_data = { username : "", password : "", user : this.render() };
		}
	
		doInnerAjax("/logout/", "post", user_data, function(json) {
			json = JSON.parse(json.responseText);
			if(json.result == 200) {
				informacam_user.unsetUser();
			}
		});
	}
});