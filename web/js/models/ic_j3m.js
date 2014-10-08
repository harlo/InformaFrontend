var app = app || {};//global Backbone

jQuery(document).ready(function($) {

	//do we still need this?
	app.InformaCamJ3M = Backbone.Model.extend({
		constructor: function() {
			Backbone.Model.apply(this, arguments);
		},
	});

	/* BACKBONE MODELS */

	app.InformaCamJ3MHeader = Backbone.Model.extend({
		urlRoot: '/j3mheader',
	});

	app.InformaCamJ3MStripped = Backbone.Model.extend({
		urlRoot: '/j3mretrieve',
	});

	app.InformaCamJ3MTimeStampedData = Backbone.Model.extend({
		initialize: function(options) {
			this.urlRoot = options.urlRoot;
		},
		parse: function(response) {
			this.set({values: response}, {silent: true});
			return response;
		},
	});


	/* BACKBONE VIEWS */

	app.InformaCamJ3MHeaderView = Backbone.View.extend({
		el: $('#ic_j3mheader_view_holder'),
		template: getTemplate("j3m_header.html"),
		initialize: function() {
			this.model.fetch();
		},
		render: function() {
			json = this.model.toJSON().data;
			html = Mustache.to_html(this.template, json);
			this.$el.html(html);
			return this;
		},
	});

	//abstracted class for arrays of 2-tuples, one of which is a timestamp
	app.InformaCamJ3MTimeStampedDataView = Backbone.View.extend({
		initialize: function(options) {
			this.template = options.template;
			this.model.fetch();
		},
		render: function() {
			json = {values: this.model.get("values")};
			html = Mustache.to_html(this.template, json);
			$c(html);
			$c(json);
			this.$el.html(html);
			return this;
		},
	});

	app.InformaCamJ3MAppView = Backbone.View.extend({
		el: '#ic_submission_view_holder',
		initialize: function() {

			this.headerView = new app.InformaCamJ3MHeaderView({
				model: new app.InformaCamJ3MHeader({
					id: gid
				})
			});

			this.lightMeterView = new app.InformaCamJ3MTimeStampedDataView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/lightMeter',
					id: gid
				}),
				el: '#ic_lightMeterValue_view_holder',
				template: getTemplate("j3m_lightMeterValue.html"),
			}); 
			
			this.gps_bearingView = new app.InformaCamJ3MTimeStampedDataView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/GPSBearing',
					id: gid
				}),
				el: '#ic_gps_bearing_view_holder',
				template: getTemplate("j3m_gps_bearing.html"),
			}); 
			
			this.gps_coordsView = new app.InformaCamJ3MTimeStampedDataView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/GPSCoords',
					id: gid
				}),
				el: '#ic_gps_coords_view_holder',
				template: getTemplate("j3m_gps_coords.html"),
			}); 
			
			this.pressureAltitudeView = new app.InformaCamJ3MTimeStampedDataView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/pressureAltitude',
					id: gid
				}),
				el: '#ic_pressureAltitude_view_holder',
				template: getTemplate("j3m_pressureAltitude.html"),
			}); 
			
			//LISTENERS

			this.listenTo(this.headerView.model, 'change', function() {
				this.headerView.$el.append(this.headerView.render().el);
			});

			this.listenTo(this.lightMeterView.model, 'change', function() {
				this.lightMeterView.$el.append(this.lightMeterView.render().el);
			});

			this.listenTo(this.gps_bearingView.model, 'change', function() {
				this.gps_bearingView.$el.append(this.gps_bearingView.render().el);
			});

			this.listenTo(this.gps_coordsView.model, 'change', function() {
				this.gps_coordsView.$el.append(this.gps_coordsView.render().el);
			});

			this.listenTo(this.pressureAltitudeView.model, 'change', function() {
				this.pressureAltitudeView.$el.append(this.pressureAltitudeView.render().el);
			});

		},
	});

	var gid = /submission\/([a-z0-9]{32})\//.exec(window.location)[1];
	new app.InformaCamJ3MAppView;

	function $c(foo) {
		console.log(foo);
	}
});
