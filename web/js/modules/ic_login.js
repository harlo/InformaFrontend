var current_user;

function init() {
	current_user = new UnveillanceUser();
}

(function($) {
	var login_sammy = $.sammy("#header", function() {
		this.get("#login", function() {
			insertTemplate("login.html", null, $("#ic_header_popup_content"), function() {
				toggleElement("#ic_header_popup");
			}, "/web/layout/views/popup/");
		});
	});
	
	$(function() {
		login_sammy.run();
		init();
		$($("#ic_navigation").find("ul")[0])
			.append($(document.createElement('li'))
				.html('<a href="#login">Log in</a>'));
	});
})(jQuery);