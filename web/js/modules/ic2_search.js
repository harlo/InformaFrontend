var search;

function loadSearchResult(search_result) {
	if(search_result == null || search_result.result != 200) {
		failOut($("#ic_search_results_holder"));
		return;
	}

	search_result = search_result.data;
	search_result.documents = _.map(search_result.documents, function(doc) {
		return _.extend(doc,
			{ doc_stub : doc.mime_type == "application/pgp" ? "source" : "submission" });
	});
	
	$("#ic_search_results_holder").
		append(Mustache.to_html(getTemplate("search_result.html"), search_result));

	$("#ic_export_holder").append(getTemplate("export.html"));
}

function onConfLoaded() {
	$("#search_content").prepend(getTemplate("search.html", null, "/web/layout/views/module/"));
	
	window.setTimeout(function() {
		search = new InformaCamSearch({
			search_el : $("#ic_visual_search_holder"),
			advanced_el : $("#ic_extended_search_holder"),
			result_el : $("#ic_search_view_holder")
		});

		if(window.location.search == "") { return; }

		loadSearchResult(search.perform(window.location.search));
	}, 100);
}

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