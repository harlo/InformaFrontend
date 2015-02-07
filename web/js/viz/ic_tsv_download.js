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
		
//		this.timestamped.get('accelerometer').bind('change', this.render, this);
		
		this.dataSetsHeader = [{DocumentWrapper: ['dateAddedFormatted', 'j3m_id']}, ];
		this.timestampedHeader = [{Accelerometer: ['acc_x', 'acc_y', 'acc_x', ]}, {Lightmeter: ['jim', 'jam', ] }, ];
		this.dataSetsKeys = _.map(this.dataSetsHeader, function(d){ return _.keys(d)[0]; });
		this.timestampedKeys = _.map(this.timestampedHeader, function(d){ return _.keys(d)[0]; });
	},
	render: function(model) {
		var div_id = model.urlRoot.substring(1);
		var json = model.toJSON().data;
		
		
		$c(model);
		$c(div_id);
		$c(json);
		
		
		if (_.contains(this.dataSetsKeys, div_id)) {
		
			var headers = _.find(this.dataSetsHeader, function(d){ return _.keys(d)[0] == div_id; })[div_id];
			if (div_id == 'DocumentWrapper') {
				json.dateAddedFormatted =  moment(Number(json.date_added)).format("MM/DD/YYYY HH:mm:ss");
			}

			_.each(headers, function(d) {
				cellIndex = $('#header_tsv th#tsv_' + d).index();
				cell = $('#header_tsv tbody td:nth-child(' + (cellIndex + 1) + ')');
				cell.html(json[d]);
			});
		} else if (_.contains(this.timestampedKeys, div_id)) {
			var xx = model.get("values");
			$c('values');
			$c(xx);
		}

		this.$el.addClass("rendered");
		return this;
	},
});
