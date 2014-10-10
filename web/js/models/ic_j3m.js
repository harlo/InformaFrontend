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


	app.InformaCamJ3MTimeStampedCollection = Backbone.Collection.extend({
		initialize: function() {
		}
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
			this.xLabel = options.xLabel;
			this.yLabel = options.yLabel;
			this.model.fetch();
		},
		render: function() {
			json = {values: this.model.get("values")};
			html = Mustache.to_html(this.template, json);
			this.$el.html(html);
			return this;
		},
	});

	app.InformaCamJ3MLineChart = Backbone.View.extend({
		initialize: function(options) {
			this.model.fetch();
			this.key = options.key;
		},
		render: function() {
			var data = this.model.get("values");
			data.sort(function(a, b) {
				if (a == b) { return 0 }
				return a.timestamp > b.timestamp;
			});
			var key = this.key;
			var margin = {top: 20, right: 20, bottom: 30, left: 50},
			totalWidth = 960, totalHeight = 500,
			width = totalWidth - margin.left - margin.right,
			height = totalHeight - margin.top - margin.bottom;

			var x = d3.time.scale()
				.range([0, width]);

			var y = d3.scale.linear()
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.tickFormat(d3.time.format('%H:%M:%S.%L'));

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			var line = d3.svg.line()
				.x(function(d) { return x(d.timestamp); })
			.y(function(d) { return y(d[key]); });

			var svg = d3.select(this.el).append("svg")
				.attr({width: totalWidth,
				height:totalHeight,
				viewBox: "0 0 " + totalWidth + " " + totalHeight})
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			x.domain(d3.extent(data, function(d) { return d.timestamp; }));
			y.domain([0, d3.max(data, function(d) { return d[key]; })]);

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(this.yLabel);

			svg.append("path")
				.datum(data)
				.attr("class", "line")
				.attr("d", line);
				
				scaleGraphs();

			return this;
		},
		
		
	});

	app.InformaCamJ3MAppView = Backbone.View.extend({
		el: '#ic_submission_view_holder',
		initialize: function() {

			this.headerView = new app.InformaCamJ3MHeaderView({
				model: new app.InformaCamJ3MHeader({
					id: app.docid
				})
			});

			this.lightMeterView = new app.InformaCamJ3MLineChart({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/lightMeter',
					id: app.docid
				}),
				el: '#ic_lightMeterValue_view_holder',
				key: 'lightMeterValue',
			});
			
			this.gps_bearingView = new app.InformaCamJ3MTimeStampedDataView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/GPSBearing',
					id: app.docid
				}),
				el: '#ic_gps_bearing_view_holder',
				template: getTemplate("j3m_gps_bearing.html"),
			}); 
			
			this.gps_coordsView = new app.InformaCamJ3MTimeStampedDataView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/GPSCoords',
					id: app.docid
				}),
				el: '#ic_gps_coords_view_holder',
				template: getTemplate("j3m_gps_coords.html"),
			}); 
			
			this.gps_accuracyView = new app.InformaCamJ3MLineChart({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/GPSAccuracy',
					id: app.docid
				}),
				el: '#ic_gps_accuracy_view_holder',
				key: 'gps_accuracy',
			}); 

			this.pressureAltitudeView = new app.InformaCamJ3MTimeStampedDataView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/pressureAltitude',
					id: app.docid
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

			this.listenTo(this.gps_accuracyView.model, 'change', function() {
				this.gps_accuracyView.$el.append(this.gps_accuracyView.render().el);
			});

			this.listenTo(this.pressureAltitudeView.model, 'change', function() {
				this.pressureAltitudeView.$el.append(this.pressureAltitudeView.render().el);
			});

		},
	});

	app.docid = /submission\/([a-z0-9]{32})\//.exec(window.location)[1];
	new app.InformaCamJ3MAppView;
	

	function $c(foo) {
		console.log(foo);
	}
});

