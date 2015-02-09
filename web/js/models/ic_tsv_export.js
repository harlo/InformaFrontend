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
		el: "#ic_search_results_holder",  //the view should be decoupled from the DOM, but for this example this will do.
		//collection:  This will be passed in during initialization
		initialize: function () {
			this.views = [];
			this.listenTo(this.collection, "add", function(model, collection, options) {
				$c('add');
				$c(model);
				this.views.push(new TableRowView({ model: model, parentView: this }));
			});
		},
		render: function() {
			$c('TableView render');
			_.each(this.views, function(view) {
				view.render();
			}, this);
		},
	});

	var TableRowView = Backbone.View.extend({
		//el: since we're setting the tagName, we don't need set the el
		tagName: "div",
        className: "tableRow",
		initialize: function (options) {
			this.model.on("change", this.modelChanged, this);
			this.parentView = options.parentView;
			$c(options.parentView);
		},
		render: function () {
			var outputHtml = this.model.toJSON().data;
			$c(outputHtml.j3m_id);
			this.$el.html(outputHtml.date_added);
			return this;
		},
		modelChanged: function (model, changes) {
		//	$c(model);
			var json = model.toJSON().data;
			console.log("modelChanged: " + json.date_added);
			this.parentView.render();
		},
	});
	
	var dataset = new Datasets();
	var tableView = new TableView({ collection: dataset });
	var newRow = new app.InformaCamDocumentWrapper({id: '385a36afc6c868b1b4f9144339622602'});
	dataset.add(newRow);
	newRow.fetch();	
});