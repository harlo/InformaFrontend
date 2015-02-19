var annex_channel;

function onConfLoaded() {
	console.info("CONF LOADED...");
}

function onReindexRequested(el, task_path) {
	console.info("REINDEXING");
	document_browser.reindex(function(json) {
		json = JSON.parse(json.responseText);		
	}, { _id : document_browser.get('data')._id });

}

function onAssetRequested(file_name) {
	setRawAsset($("#uv_document_asset_viewer"),
		[".data", document_browser.get('data')._id, file_name].join('/'));
}

function initAnnexChannel() {
	annex_channel = new InformaCamNotifier();
	annex_channel.get('message_map').push(
		_.bind(document_browser.updateTaskMessage, document_browser));
}

(function($) {
	var content_sammy = $.sammy("#content", function() {
		this.get(new RegExp("/unveil/[a-z0-9]{" + UV.SHA1_INDEX + "}/#(info|assets|reindexer)"), function() {
			document_browser.setInPanel(this.params.splat[0], $("#ic_document_viewer_panel"));
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

		if(initDocumentBrowser()) {
			content_sammy.run();
			$("#content").prepend(getTemplate('default_task_update.html'));
			initAnnexChannel();
		} else {
			failOut($("#content"), "Sorry, could not find this document.");
		}
	});
})(jQuery);