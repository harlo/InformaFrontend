var app = app || {};//global Backbone

jQuery(document).ready(function($) {

//http://stackoverflow.com/questions/6535948/nested-model-in-backbone-js-how-to-approach

/*
adding a row to collection triggers adding rowView to collectionView
when row model changes, rowView alerts collectionView to update rendering
*/
	app.Datasets = Backbone.Collection.extend({
		model: app.HeaderDataSet,
	});
	
	app.HeaderDataSet = Backbone.Model.extend({
		initialize: function(options) {
			this.model_id = options.model_id;
			this.modelCount = 0;
			
			this.models = {
				documentWrapper: new app.InformaCamDocumentWrapper(this.model_id),
				J3MHeader: new app.InformaCamJ3MHeader(this.model_id),
			};

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
	
	app.TableView = Backbone.View.extend({
		el: "#ic_tsv",
		collection: new app.Datasets(),
		template: getTemplate("tsv_headerdata_table.html"),
		initialize: function() {
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
			this.$el.html('');
			if (this.views.length) {
				var json = [];
				_.each(this.views, function(view) {
					if (view.model.get('ready')) {
						json.push(view.render());
					}
				}, this);
				html = Mustache.to_html(this.template, json);
				this.$el.html(html);
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
	
	app.tableView = new app.TableView();
});