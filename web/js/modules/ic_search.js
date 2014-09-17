var search;

function onConfLoaded() {
	$("#content").prepend(getTemplate("search.html", null, "/web/layout/views/module/"));
	
	window.setTimeout(function() {
		search = new InformaCamSearch({
			search_el : $("#ic_visual_search_holder"),
			advanced_el : $("#ic_extended_search_holder"),
			result_el : $("#ic_search_view_holder")
		});

		if(window.location.search == "") { return; }

	 	console.info(search.perform(window.location.search));
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