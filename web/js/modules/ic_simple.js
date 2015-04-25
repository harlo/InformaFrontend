function updateUI(message_template) {
	$("#ic_import_dropzone_holder").remove();
	$("#ic_upload_instructions_desktop").html(message_template);
}

function onConfLoaded() {
	discoverDropzones({url : "/import/"}, "#ic_import_dropzone_holder",
		function(file, message) {
			// onSuccess
			console.log(message);
			var submission_permalink = '/submission/' + message.data._id + '/';
			var sp_tmpl = _.template('<a href="<%= sp %>"><%= sp_full %></a>');

			$("head").append($(document.createElement('base')).prop('target', '_parent'));
			updateUI(sp_tmpl({ 
				sp : submission_permalink, 
				sp_full : window.location.protocol + "//" +  window.location.host + submission_permalink
			}));

			
		},
		function(file, message) {
			// onError
			var message_text = '';

			if (typeof message !== null && typeof message === 'object') {
				if (message.result == 403) {
					message_text = "We could not find a match, and you cannot upload a new file from here."
					
				}
			} else {
				message_text = "Sorry, that didn't work.";
			}

			this.disable();
			var er_tmpl = _.template('<%= mt %><br /><a href="/simple/">Try again?</a>');

			return updateUI(er_tmpl({mt : message_text}));
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