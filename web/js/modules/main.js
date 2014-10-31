var documents, search;

function failOut() {
	$("#ic_content_header").html("Sorry.  No documents found.");
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

		$("#content")
			.prepend(getTemplate("search.html", null, "/web/layout/views/module/"));

		search = new InformaCamSearch({
			search_el : $("#ic_visual_search_holder"),
			advanced_el : $("#ic_extended_search_holder"),
			result_el : $("#ic_search_view_holder")
		});
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