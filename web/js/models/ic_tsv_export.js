var app = app || {};//global Backbone

jQuery(document).ready(function($) {

//http://stackoverflow.com/questions/6535948/nested-model-in-backbone-js-how-to-approach

/*
adding a row to collection triggers adding rowView to collectionView
when row model changes, rowView alerts collectionView to update rendering
*/
	app.TimestampDatasets = Backbone.Collection.extend();
	
	app.Datasets = Backbone.Collection.extend();
	
	app.DataSet = Backbone.Model.extend({
		initialize: function(options) {
			this.model_id = options.model_id;
			this.modelCount = 0;
			
			_.each(this.models, function(model) {
				model.set('id', this.get('model_id'));
				model.fetch();
			}, this);
			
			_.each(this.models, function(model) {
				//fire change event when all nested models have loaded
				this.listenTo(model, 'sync', function() {
					this.modelCount++;
					if (this.modelCount == _.size(this.models)) {
						this.set({ready: true});
						this.trigger('render');
					}
				});
			}, this);

		},
	});
	
	app.HeaderDataSet = app.DataSet.extend({
		initialize: function(options) {
			this.models = {
				documentWrapper: new app.InformaCamDocumentWrapper(),
				J3MHeader: new app.InformaCamJ3MHeader(),
			};
			app.DataSet.prototype.initialize.apply(this, arguments);
		},
		parseMe: function() {
			data = {};
			json = this.models.documentWrapper.toJSON().data;
			data.j3m_id = json.j3m_id;
			data.dateAddedFormatted = json.dateAddedFormatted;
			data.upload_attempts = json.upload_attempts;
			data.j3m_verified = json.j3m_verified;
			data.media_verified = json.media_verified;
			json = this.models.J3MHeader.toJSON().data;
			data.dateCreatedFormatted = json.dateCreatedFormatted;
			return data;
		}
	});
	
	app.TimestampDataSet = app.DataSet.extend({
		initialize: function(options) {
			this.models = {
				J3MTimeStampedData: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/GPSData',
				}),
			};
			app.DataSet.prototype.initialize.apply(this, arguments);
		},
		parseMe: function() {
			data = this.models.J3MTimeStampedData.get("values");
			return data;
		}
	});
	
	app.TableView = Backbone.View.extend({
		initialize: function(options) {
			this.template = getTemplate(options.template);
			this.views = [];
			this.listenTo(this.collection, "add", function(model) {
				this.views.push(new app.TableRowView({ model: model, parentView: this }));
			});
			this.listenTo(this.collection, "remove", function(model) {
				this.views = _.without(this.views, _.findWhere(this.views, {model: model, parentView: this}));
				this.render();
			});
		},
		render: function() {
			if (this.$el.attr('id') == 'ic_tsv_timestampdata') {
				app.timestampTablesView.render();
			} else {
				if (this.views.length) {
					var json = [];
					_.each(this.views, function(view) {
						if (view.model.get('ready')) {
							json.push(view.render());
						}
					}, this);
					$('#ic_tsv_download_view_holder').addClass("rendered");
					html = Mustache.to_html(this.template, json);
					this.$el.html(html);
				} else {
					this.$el.html('');
				}
			}
		},
	});

	app.TableRowView = Backbone.View.extend({
		initialize: function (options) {
			this.model.on("render", this.modelChanged, this);
			this.parentView = options.parentView;
		},
		render: function () {
			return this.model.parseMe();
		},
		modelChanged: function (model, changes) {
			this.parentView.render();
		},
	});
	
	app.TimestampTablesView = Backbone.View.extend({
		initialize: function (options) {
			this.views = [];
			this.listenTo(this.collection, "add", function(model) {
				tableView = new app.TableView({collection: new app.Datasets(), el: "#ic_tsv_timestampdata", template: "tsv_timestampdata_table.html", model_id: 2555});
				this.views.push(tableView);
				tableView.collection.add(new app.TimestampDataSet({model_id: model.get('model_id')}));
			});

			this.listenTo(this.collection, "remove", function(model) {
				var viewToRemove = _.filter(this.views, function(view) {
					return _.where(view.views[0].model, {model_id: model.model_id}).length > 0;
				});
				this.views = _.without(this.views, viewToRemove[0]);
				this.render();
			});
		},
		template: getTemplate("tsv_timestampdata_table.html"),
		el: "#ic_tsv_timestampdata",
		render: function () {
			var html = '';
			if (this.views.length) {
				$('#ic_tsv_download_view_holder').addClass("rendered");
				_.each(this.views, function(views) {
					_.each(views.views, function(view) {
						if (view.model.get('ready')) {
							json = view.render();
							if (json.length) {
								json.model_id = view.model.model_id;
								html += Mustache.to_html(this.template, json);
							}
						}
						this.$el.html(html);
					}, this);
				}, this);
			} else {
				this.$el.html(html);
			}
		},
	});
	
	
	
//maybe this? https://gist.github.com/geddski/1610397
	
	app.tsvHeaderTableView = new app.TableView({collection: new app.Datasets({model: app.HeaderDataSet}), el: "#ic_tsv_headerdata", template: "tsv_headerdata_table.html"});
	
	app.timestampTablesView = new app.TimestampTablesView({collection: new app.TimestampDatasets()});
	
	$('#export_tsv').click(function() {
		if ($('#ic_tsv_download_view_holder').hasClass("rendered")) {
			$('#ic_tsv_download_view_holder').removeClass("rendered");
		} else {
			if (!app.addDatasetToTSV(app.docid)) {
				$('#ic_tsv_download_view_holder').addClass("rendered");
			}
		}
	});
	
	app.addDatasetToTSV = function(hash) {
		if (app.tsvHeaderTableView.collection.findWhere({model_id: hash})) {
			return false;
		}
		app.tsvHeaderTableView.collection.add(new app.HeaderDataSet({model_id: hash}));

		app.timestampTablesView.collection.add(new app.TimestampDataSet({model_id: hash}));
	};

	app.removeDatasetFromTSV = function(hash) {
			app.tsvHeaderTableView.collection.remove(app.tsvHeaderTableView.collection.where({model_id: hash}));
			app.timestampTablesView.collection.remove(app.timestampTablesView.collection.where({model_id: hash}));
	};

});