function updateUI(message_template) {
	$("#ic_import_dropzone_holder").remove();
	$("#ic_upload_instructions_desktop").html(message_template);
}

function parse_result(res) {
	console.info(res);

	if(res.result != 200 || !(
		(_.has(res.data, 'count') && _.has(res.data, 'documents')) ||
		(_.has(res.data, '_id') && (_.has(res.data, 'mime_type') || _.has(res.data, 'uploaded')))
	)) {
		var message_text = "Sorry, that didn't work.";

		if (typeof res !== null && typeof res === 'object') {
			if (_.contains([403, 412], res.result)) {
				message_text = "We could not find a match, and you cannot upload a new file from here."
			}
		}

		var er_tmpl = _.template('<%= mt %><br /><a href="/simple/">Try again?</a>');
		return updateUI(er_tmpl({mt : message_text}));
	}

	var submission_permalink;
	 
	if(_.has(res.data, 'count') && _.has(res.data, 'documents')) {
		submission_permalink = res.data.documents[0].media_id + '/';
	} else {
		submission_permalink = res.data._id + '/';
	}

	if(res.data.mime_type == UV.MIME_TYPES.pgp) {
		submission_permalink = '/source/' + submission_permalink;
	} else {
		submission_permalink = '/submission/' + submission_permalink;
	}
	
	var sp_tmpl = _.template('<a href="<%= sp %>"><%= sp_full %></a>');

	$("head").append($(document.createElement('base')).prop('target', '_parent'));
	return updateUI(sp_tmpl({ 
		sp : submission_permalink, 
		sp_full : window.location.protocol + "//" +  window.location.host + submission_permalink
	}));
}

function onConfLoaded() {
	var public_hash_holder = $($("#ic_public_hash").children("input")[0]);

	public_hash_holder.keypress(function(evt) {
		if(evt.which == 13) {
			$("#ic_upload_instructions_desktop").html('Searching <img src="/web/images/wait_spinner.gif" />');
			parse_result(doInnerAjax(
				"documents", "post", 
				{
					public_hash : public_hash_holder.val(),
					doc_type : "ic_j3m"
				},
				 null, false)
			);
		}
	});

	discoverDropzones({url : "/import/"}, "#ic_import_dropzone_holder",
		function(file, message) {
			// onSuccess
			console.log(message);
			return parse_result(message);
		},
		function(file, message) {
			// onError
			this.disable();
			return parse_result(message);
		},
		function(file) {
			$("#ic_upload_instructions_desktop").html('Processing <img src="/web/images/wait_spinner.gif" />');
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