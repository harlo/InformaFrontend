var app = app || {};//global Backbone

app.InformaCamTSVDownloadView = Backbone.View.extend({
	el: '#ic_tsv_download_view_holder',
	template: getTemplate("tsv_download.html"),
	initialize: function(options) {
		this.header = this.model.get('header');
		this.timestamped = this.model.get('timestamped');
		this.header.get('J3MHeader').bind('change', this.render, this);
		this.header.get('documentSource').bind('change', this.render, this);
		this.header.get('appendedUserData').bind('change', this.render, this);
		this.header.get('documentWrapper').bind('change', this.render, this);
	},
	render: function() {
		$c('render');
//		html = Mustache.to_html(this.template, json);
//		this.$el.html(html).addClass("rendered");
		return this;
	},
});
