var informacam_user = null;

function initUser() {
	informacam_user = new InformaCamUser();
}

function loadHeaderPopup(view, onSuccess) {
	if(!toggleElement($("#ic_header_popup"))) { toggleElement($("#ic_header_popup")); }
	
	insertTemplate((view + ".html"), null, $("#ic_header_popup_content"), 
		onSuccess, "/web/layout/views/popup/");
}

(function($) {
	var header_sammy = $.sammy("#header", function() {
		this.get(/(.*)\#search/, function(context) {
			loadHeaderPopup("search", null);
		});
		
		this.get(/(.*)\#me/, function(context) {
			loadHeaderPopup("me", null);
		});
		
		this.get(/(.*)\#login/, function(context) {
			loadHeaderPopup("login", null);
		});
		
		this.get(/(.*)\#logout/, function(context) {
			loadHeaderPopup("logout", null);
		});
	});
	
	$(function() {
		var css = document.createElement('link');
		css.setAttribute("rel",  "stylesheet");
		css.setAttribute("type", "text/css");
		css.setAttribute("href", "/web/css/informacam.css");
		document.getElementsByTagName("head")[0].appendChild(css);
		
		initUser();
		header_sammy.run();
	})
})(jQuery);