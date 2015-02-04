var app = app || {};//global Backbone

app.InformaCamTSVDownloadView = Backbone.View.extend({
	el: '#ic_tsv_download_view_holder',
	initialize: function(options) {
		this.header = this.model.get('header');
		this.timestamped = this.model.get('timestamped');
//		this.header.get('J3MHeader').bind('change', this.render, this);
//		this.header.get('documentSource').bind('change', this.render, this);
//		this.header.get('appendedUserData').bind('change', this.render, this);
		this.header.get('documentWrapper').bind('change', this.render, this);
		
		this.dataSets = {DocumentWrapper: ['dateAddedFormatted', 'j3m_id']};
	},
	render: function(model) {
		var div_id = model.urlRoot.substring(1);
		var json = model.toJSON().data;
		
		if (div_id == 'DocumentWrapper') {
			json.dateAddedFormatted =  moment(Number(json.date_added)).format("MM/DD/YYYY HH:mm:ss");
		}

		$c('render ' + div_id);
		$c(json);
//		$c(this.dataSets[div_id]);
		
		
		
		_.each(this.dataSets[div_id], function(d) {
			$c('d ' + d);
			$c(json[d]);
		});

//		html = Mustache.to_html(this.template, json);
		this.$el.addClass("rendered");
		return this;
	},
});
