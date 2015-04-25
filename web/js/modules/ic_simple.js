function onConfLoaded() {
	discoverDropzones({url : "/import/"}, "#ic_import_dropzone_holder",
		function(file, message) {
			// onSuccess
			console.log(message);
			var submission_permalink = '/submission/' + message.data._id + '/';
			var sp_tmpl = _.template('<a href="<%= sp %>"><%= sp_full %></a>');

			$("head").append($(document.createElement('base')).prop('target', '_parent'));

			$("#ic_import_dropzone_holder").remove();
			$("#ic_upload_instructions_desktop").html(sp_tmpl({ 
				sp : submission_permalink, 
				sp_full : window.location.protocol + "//" +  window.location.host + submission_permalink
			}));
		},
		function(file, message) {
			// onError
			console.error(message);
			messagetext = '';
			if (typeof message !== null && typeof message === 'object') {
				if (message.result == 403) {
					messagetext = "It's not you, it's us. We're looking into the problem. Please try again later. (" + message.result + ")";
					this.disable();
				}
			} else {
				messagetext = message;
			}
			return file.previewElement.querySelector("[data-dz-errormessage]").textContent = messagetext;
		}
	);
}

(function($) {	
	$(function() {
		try {
			updateConf();
		} catch(err) {
			console.warn(err);
			console.warn("no updateConf()");
		}
		
		try {
			onConfLoaded();
		} catch(err) {
			console.warn(err);
			console.warn("no onConfLoaded()");
		}
		
	});
})(jQuery);