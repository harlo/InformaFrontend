var app = app || {};//global Backbone

jQuery(document).ready(function($) {

//http://stackoverflow.com/questions/6535948/nested-model-in-backbone-js-how-to-approach

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
/*
adding a row to collection triggers adding rowView to collectionView
when row model changes, rowView alerts collectionView to update rendering
*/
	var Datasets = Backbone.Collection.extend({
		model: HeaderDataSet
	});
	
	var HeaderDataSet = Backbone.Model.extend({
		initialize: function(options) {
			this.id = options.id;
			this.modelCount = 0;

			_.each(this.model, function(model) {
				model.set('id', this.id);
				model.fetch();
				
				//fire change event when all nested models have loaded
				this.listenTo(model, 'change', function() {
					this.modelCount++;
					if (this.modelCount == _.size(this.model)) {
						this.trigger('change');
					}
				});
			}, this);

		},
		model: {
			documentWrapper: new app.InformaCamDocumentWrapper,
			J3MHeader: new app.InformaCamJ3MHeader,
		},
		parseMe: function() {
			data = {};
			json = this.model.documentWrapper.toJSON().data;
			$c(json);
			data.dateAddedFormatted = json.dateAddedFormatted;
			data.upload_attempts = json.upload_attempts;
			data.j3m_verified = json.j3m_verified;
			data.media_verified = json.media_verified;
			json = this.model.J3MHeader.toJSON().data;
			$c(json);
			return data;
		}
	});
	
	var TableView = Backbone.View.extend({
		el: "#ic_tsv",
		collection: new Datasets(),
		initialize: function() {
			this.views = [];
			this.listenTo(this.collection, "add", function(model) {
				$c('add');
				$c(model.model.documentWrapper);
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
		tagName: "tr",
		initialize: function (options) {
			this.model.on("change", this.modelChanged, this);
			this.parentView = options.parentView;
		},
		render: function () {
			$c(this.model.parseMe());
			var json = this.model.model.documentWrapper.toJSON().data;
			this.$el.html('<td>' + json.date_added + '</td>');
			return this;
		},
		modelChanged: function (model, changes) {
			this.parentView.render();
		},
	});
	
	var tableView = new TableView();
	
	var newRow = new HeaderDataSet({id: '385a36afc6c868b1b4f9144339622602'});
	tableView.collection.add(newRow);
});