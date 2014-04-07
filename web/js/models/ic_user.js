var InformaCamUser = Backbone.Model.extend({
	constructor: function(username, password) {
		if(username && password) {
			this.doLogin(username, password);
		} else {
			doInnerAjax("get_status", "post", null, function(json) {
				json = JSON.parse(json.responseText);
				console.info(json);
				if(json.result == 200) {
					status = Number(json.data);
				}
			});
		}
	},
	
	loadUser: function() {
		var user_data = JSON.parse(localStorage.getItem('informacam_user'));
		if(!user_data) { return false; }
		
		for(var key in user_data) {
			this.set(key, user_data[key]);
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
		if(!username && !password) {
			// parse field for username and password
			username = "";
			password = "";
		}
		
		doInnerAjax("login", "post", 
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
			// parse field for password
			user_data = {
				username : this.username , 
				password : "", 
				user : this.render()
			};
		}
	
		doInnerAjax("logout", "post", user_data, function(json) {
			json = JSON.parse(json.responseText);
			if(json.result == 200) { informacam_user.unsetUser(); }
		});
	}
});