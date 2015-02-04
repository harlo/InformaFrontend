var app = app || {};//global Backbone

app.InformaCamDocumentSourceView = Backbone.View.extend({
	el: '#ic_download_j3m',
	render: function() {
		$('<a>download JSON</a>').appendTo(this.$el).click( function() {
			 onDownloadRequested('j3m.json', this);
		});
		return this;
	},
});
