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
		render: function() {
			this.html = 'HTML';
		}
	});

	//collection view
	app.TSVHeaderDataTableView = Backbone.View.extend({
		el: '#ic_TSV_header_data',
		initialize: function() {
			this.rows = [];

			this.listenTo(this.collection, 'add', function() {
				$c('add headerDataCollection');
				this.rows.push(new app.TSVHeaderDataRowView);
			});
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
//				$c('add headerDataCollection');
//				this.TSVHeaderDataTableView.views.push(new app.TSVHeaderDataRowView);
//				this.TSVHeaderDataTableView.render();
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
	
	
//	var ddd = new app.InformaCamTSVDownloadView;
//	ddd.add({id: '385a36afc6c868b1b4f9144339622602'});
	
	
	
//TAKE 2
//https://bardevblog.wordpress.com/2012/12/13/re-learning-backbone-js-nested-views/
	var Datasets = Backbone.Collection.extend({
		model: app.InformaCamDocumentWrapper
	});
	
	var TableView = Backbone.View.extend({
		el: "#ic_tsv",
		collection: new Datasets(),
		initialize: function() {
			this.views = [];
			this.listenTo(this.collection, "add", function(model) {
				this.views.push(new TableRowView({ model: model, parentView: this }));
			});
			this.listenTo(this.collection, "remove", function(model) {
				this.views = _.without(this.views, _.findWhere(this.views, {model: model}));
				this.render();
			});
		},
		render: function() {
			this.$el.html('');
			if (this.views.length) {
				var table = $('<table>');
				table.append('<thead><tr><th>Date</th></tr></thead>');
				this.$el.append(table);
				_.each(this.views, function(view) {
					row = view.render();
					table.append(row.$el);
				}, this);
			}
		},
	});

	var TableRowView = Backbone.View.extend({
		//el: since we're setting the tagName, we don't need set the el
		tagName: "tr",
		initialize: function (options) {
			this.model.on("change", this.modelChanged, this);
			this.parentView = options.parentView;
		},
		render: function () {
			var json = this.model.toJSON().data;
			this.$el.html('<td>' + json.date_added + '</td>');
			return this;
		},
		modelChanged: function (model, changes) {
			this.parentView.render();
		},
	});
	
	var tableView = new TableView();
	var newRow = new app.InformaCamDocumentWrapper({id: '385a36afc6c868b1b4f9144339622602'});
	tableView.collection.add(newRow);
	newRow.fetch();	
//	dataset.remove(newRow);
});