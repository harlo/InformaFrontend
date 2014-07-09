var current_user;

function initUser() {
	current_user = new InformaCamUser();
}

(function($) {
	var logout_sammy = $.sammy("#header", function() {
		this.get("#logout", function() {
			insertTemplate("logout.html", 
				current_user.toJSON(), $("#ic_header_popup_content"),
				function() {
					toggleElement("#ic_header_popup");
				},
				"/web/layout/views/popup/"
			);
		});
		
		this.get(/\#me$/, function() {
			insertTemplate("user.html",
				current_user.toJSON(), $("#ic_header_popup_content"),
				function() {
					toggleElement("#ic_header_popup");
				},
				"/web/layout/views/popup/"
			);
		});
	});
		
	$(function() {
		logout_sammy.run();
		initUser();
		$($("#ic_navigation").find("ul")[0])
			.append($(document.createElement('li'))
				.html('Hello, <a href="#me">' + current_user.get('username') + '</a>.'))
			.append($(document.createElement('li'))
				.html('<a href="#logout">Log out</a>'));
	});
})(jQuery);