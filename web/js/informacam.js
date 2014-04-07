var informacam_user = null;

function initUser() {
	informacam_user = new InformaCamUser();
}

(function($) {
	var header_sammy = $.sammy("#header", function() {
		this.get(/(.*)\#search/, function(context) {
			alert("OMIGERD");
		});
		
		this.get(/(.*)\#me/, function(context) {
			alert("USER STUFF");
		});
		
		this.get(/(.*)\#login/, function(context) {
		
		});
		
		this.get(/(.*)\#logout/, function(context) {
		
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