var documents, search, annex_channel;

function failOut() {
	$("#ic_content_header").html("Sorry.  No documents found.");
}

function onDropzoneSuccess(file, message) {
	console.log(message);
	
	if(message.data) { 
		documents.resolveInport(message.data);
	}
}

function onDropzoneError(file, message) {
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

function onDropzoneFileAdded(file) {
	console.info("added file:");
	console.info(file);	
}

function onConfLoaded() {
	try {
		documents = new InformaCamDocumentBrowser(_.extend(
			doInnerAjax("documents", "post", 
				{ mime_type : "[" + UV.DEFAULT_MIME_TYPES.join() + "]", doc_type : "uv_document" }, null, false),
			{ root_el : $("#ic_document_browser") }));

		if(documents.get('result') != 200) {
			failOut();
			return;
		}

		documents.unset('result');

		$("#ic_main_search_holder")
			.html(getTemplate("search.html", null, "/web/layout/views/module/"));

		annex_channel = new InformaCamNotifier();
		annex_channel.get('message_map').push(_.bind(documents.onImportProgress, documents));

		search = new InformaCamSearch({
			search_el : $("#ic_visual_search_holder"),
			advanced_el : $("#ic_extended_search_holder"),
			result_el : $("#ic_search_view_holder")
		});

		discoverDropzones({url : "/import/", extra_classes : ["ic_dz_main"]}, 
			"#ic_main_dropzone_holder",
			onDropzoneSuccess,
			onDropzoneError,
			onDropzoneFileAdded
		);
	} catch(err) {
		console.error(err);
		failOut();
	}
}

(function($) {
	var content_sammy = $.sammy("#content", function() {

		this.get('/#import', function() {
			loadHeaderPopup("import");
		});
	});
	
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
		
		content_sammy.run();
	});
})(jQuery);