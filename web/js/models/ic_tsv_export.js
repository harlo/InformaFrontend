var app = app || {};//global Backbone

jQuery(document).ready(function($) {

//http://stackoverflow.com/questions/6535948/nested-models-in-backbone-js-how-to-approach

	app.TSVHeaderDataRow = Backbone.Model.extend({
		initialize: function(options) {
			this.id = options.id;
			this.model.documentWrapper.set('id', this.id);
			this.model.documentWrapper.fetch();
			this.listenTo(this.model.documentWrapper, 'change', function() {
				$c('documentWrapper change');
				$c(this.model.documentWrapper);
			});
		},
		model: {
			documentWrapper: new app.InformaCamDocumentWrapper,
//			J3MHeader: new app.InformaCamJ3MHeader,
		},
	});
	
	app.headerDataCollection = Backbone.Collection.extend({
		model: app.TSVHeaderDataRow
	});

	app.TSVHeaderDataRowView = Backbone.View.extend({
	});

	app.TSVHeaderDataTableView = Backbone.View.extend({
		el: '#ic_TSV_header_data',
		initialize: function() {
			this.views = [];
		},
		render: function() {
		},
	});

	app.InformaCamTSVDownloadView = Backbone.View.extend({
		el: '#xxx',
		initialize: function() {
			this.TSVHeaderDataTableView = new app.TSVHeaderDataTableView({
				collection: this.collection.headerDataCollection,
			});
			/*
			this.TSVTimestampDataTableView = new app.TSVTimestampDataTableView({
				collection: this.collection.timestampDataCollection,
			});
			*/
			
			this.listenTo(this.collection.headerDataCollection, 'add', function() {
				$c('add headerDataCollection');
				this.TSVHeaderDataTableView.views.push(new app.TSVHeaderDataRowView);
				this.TSVHeaderDataTableView.render();
			});

		},
		collection: {
			headerDataCollection: new app.headerDataCollection,
//			timestampDataCollection: new app.timestampDataCollection,
		},
		add: function(options) {
			this.collection.headerDataCollection.add(new app.TSVHeaderDataRow(options));
//			this.collection.timestampDataCollection.add(new app.TSVTimestampDataRow(options));
		},
	});
	
	
	var ddd = new app.InformaCamTSVDownloadView;
	ddd.add({id: '385a36afc6c868b1b4f9144339622602'});	
});