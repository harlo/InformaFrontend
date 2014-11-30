var app = app || {};//global Backbone

jQuery(document).ready(function($) {
	/* BACKBONE MODELS */

	app.InformaCamJ3MHeader = Backbone.Model.extend({
		urlRoot: '/j3mheader',
	});

	app.InformaCamDocumentSource = Backbone.Model.extend({
//		url: '/documents/',
	});

	app.InformaCamDocumentWrapper = Backbone.Model.extend({
		urlRoot: '/DocumentWrapper',
	});

	app.InformaCamAppendedUserData = Backbone.Model.extend({
		urlRoot: '/AppendedUserData',
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
	
	app.progressNotifierView = Backbone.View.extend({
		initialize: function(options) {
			this.taskCount = 0;
		},
		render: function(message) {
			var status = message.status;
			if (message.doc_id != app.docid || status != 200) {
				return;
			}
			if (this.taskCount == 0) {
				this.$el.prepend('<h2>Task Progress</h2>');
				this.$el.addClass("rendered");
				$('#tasksTotal').html('??? (to come)');
			}
			var task_path = message.task_path;
			this.taskCount++;
			$('#tasksComplete').html(Math.round(this.taskCount / 2));
			$c(task_path + " " + " " + status);
			this.$el.append(task_path + '<br>');
		}
	});

	app.InformaCamJ3MHeaderView = Backbone.View.extend({
		el: $('#ic_j3mheader_view_holder'),
		template: getTemplate("j3m_header.html"),
		render: function() {
			json = this.model.toJSON().data;
			json.URL = document.URL;
			json.genealogy.dateFormatted = moment(Number(json.genealogy.dateCreated)).format("MM/DD/YYYY HH:mm:ss");
			html = Mustache.to_html(this.template, json);
			$('#ic_header_view_holder').addClass("rendered");
			this.$el.html(html);
			$('#submission_permalink').click(function() {
				this.select();
			});
			return this;
		},
	});

	app.InformaCamDocumentSourceView = Backbone.View.extend({
		el: $('#ic_download_j3m'),
		render: function() {
			var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.model));
			this.$el.html('<a href="data:' + data + '" download="data.json">download JSON</a>');
			return this;
		},
	});

	app.InformaCamAppendedUserDataVIew = Backbone.View.extend({
		el: $('#ic_appended_user_data'),
		render: function() {
			this.$el.html('<h3>Appended User Data</h3>' + JSON.stringify(this.model));
			return this;
		},
	});

	app.InformaCamDocumentWrapperView = Backbone.View.extend({
		el: $('#ic_documentwrapper_view_holder'),
		template: getTemplate("document_wrapper.html"),
		render: function() {
			json = this.model.toJSON().data;
			json.dateAddedFormatted = moment(Number(json.date_added)).format("MM/DD/YYYY HH:mm:ss");
			if (json.upload_attempts === undefined) {
				json.upload_attempts = 1;
			}
			html = Mustache.to_html(this.template, json);
			this.$el.html(html);
			return this;
		},
	});

	app.InformaCamJ3MTimeseriesMapView = Backbone.View.extend({
		initialize: function(options) {
			this.maps = [];
			this.header = options.header;
		},
		render: function() {
			this.$el.prepend('<h2>' + this.header + '</h2>');
			this.json = {values: this.model.get("values")};
			this.loadMap('mapOverview', [this.json.values[0]], 4);
			this.loadMap('mapZoom', this.json.values, 19);

			return this;
		},
		
		loadMap: function(mapID, values, zoom) {
			$('#' + mapID).addClass("rendered");
			this.maps[mapID] = L.map(mapID).setView([values[0].gps_lat, values[0].gps_long], zoom);
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
			}).addTo(this.maps[mapID]);
			
			if (values.length > 1) {
				latlngs = _.map(values, function(latlong){ return [latlong.gps_lat,latlong.gps_long]; });
				L.polyline(latlngs, {color: 'red', weight:2}).addTo(this.maps[mapID]);
				var myIcon = L.icon({
					iconUrl: '/web/images/ic_map_icon.png',
					iconRetinaUrl: '/web/images/ic_map_icon.png',
					iconSize: [5, 5]
        		});
			} else {
				var myIcon = L.icon({
					iconUrl: '/web/images/ic_map_icon.png',
					iconRetinaUrl: '/web/images/ic_map_icon.png',
					iconSize: [18, 18]
        		});
			}

			_.each(values, function(latlong) {
				timestamp = moment(Number(latlong.timestamp)).format("MM/DD/YYYY HH:mm:ss");
				L.marker([latlong.gps_lat,latlong.gps_long]).setIcon(myIcon).addTo(this.maps[mapID])
				.bindPopup(timestamp);
			}, this);
		},
	});
	
	app.InformaCamJ3MLineChartMultiView = Backbone.View.extend({
		initialize: function(options) {
			this.model.get('pressureAltitude').bind('change', this.render, this);
			this.model.get('lightMeter').bind('change', this.render, this);
			this.model.get('GPSAccuracy').bind('change', this.render, this);
			this.model.get('GPSBearing').bind('change', this.render, this);
			this.model.get('Accelerometer').bind('change', this.render, this);
			this.model.get('pressureHPAOrMBAR').bind('change', this.render, this);
			this.model.get('dateCreated').bind('change', this.render, this);

			this.margin = {top: 20, right: 20, bottom: 30, left: 50},
			this.totalWidth = 960, this.totalHeight = 500,
			this.width = this.totalWidth - this.margin.left - this.margin.right,
			this.height = this.totalHeight - this.margin.top - this.margin.bottom;
			this.xDomain = [];
		},
		render: function(model) {
			$c(model);
			var div_id = model.urlRoot.substring(1);
			$c(div_id);
			if (div_id == 'j3mheader') {
				$c('j3mheader');
				this.dateCreated = model.toJSON().data.genealogy.dateCreated;
				if (this.$el.find('svg').length) {
					this.renderDateCreated();
				}
				return;
			}

			var data = model.get("values");
			$("#" + div_id + "_check, label[for='" + div_id + "_check']").addClass("rendered");
			$("#" + div_id + "_check").change(function() {
				if (this.checked) {
					$('path.' + div_id).show();
					$('g.y.axis.' + div_id).show();
				} else {
					$('path.' + div_id).hide();
					$('g.y.axis.' + div_id).hide();
				}
			});
			

			//lump all Y vals into one array for determining domain
			this.allYVals = [];
			_.each(model.get("keys"), function(key) {
				this.allYVals = this.allYVals.concat(_.pluck(data, key));
			}, this);

			var x = d3.time.scale()
				.range([0, this.width]);

			var y = d3.scale.linear()
				.range([this.height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.tickFormat(d3.time.format('%H:%M:%S.%L'));

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			var svg = d3.select(this.el).insert("svg", '#graph_controls')
				.attr({width: this.totalWidth,
				height:this.totalHeight,
				viewBox: "0 0 " + this.totalWidth + " " + this.totalHeight})
				.append("g")
				.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

			xDomain = d3.extent(data, function(d) { return d.timestamp; });
			x.domain(xDomain);
			this.xDomain = d3.extent(this.xDomain.concat(xDomain));
			$c(this.xDomain);
		
			if (d3.min(this.allYVals) < 0) {
				y.domain(d3.extent(this.allYVals));
			} else {
				y.domain([0, d3.max(this.allYVals)]);
			}

			if (this.$el.find('svg').length == 1) {
				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + this.height + ")")
					.call(xAxis);
				this.model.get("dateCreated").fetch();
			}

			svg.append("g")
				.attr("class", "y axis " + div_id)
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(this.yLabel);

			_.each(model.get("keys"), function(key) {
				var line = d3.svg.line()
					.interpolate("basis")
					.x(function(d) { return x(d.timestamp); })
					.y(function(d) { return y(d[key]); });
					
				svg.append("path")
					.datum(data)
					.attr("class", "line " + div_id + " " + key)
					.attr("d", line);
			}, model);

			scaleGraphs();
			
			return this;
		},
		
		renderDateCreated: function() {
			var svg = d3.select(this.el).insert("svg", '#graph_controls')
				.attr({width: this.totalWidth,
				height:this.totalHeight,
				viewBox: "0 0 " + this.totalWidth + " " + this.totalHeight})
				.append("g")
				.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
				
			x = (this.dateCreated - this.xDomain[0]) / (this.xDomain[1] - this.xDomain[0]) * this.width;
			svg.append("line")
				.attr("x1", x)
				.attr("y1", 0)
				.attr("x2", x)
				.attr("y2", this.height)
				.attr("stroke-width", 2)
				.attr("stroke", "red");

			scaleGraphs();
		},
	});



	app.InformaCamJ3MAppView = Backbone.View.extend({
		el: '#ic_submission_view_holder',
		initialize: function() {
			this.J3MHeaderView = new app.InformaCamJ3MHeaderView({
				model: new app.InformaCamJ3MHeader({
					id: app.docid
				})
			});

			this.documentSourceView = new app.InformaCamDocumentSourceView({
				model: new app.InformaCamDocumentSource({
					id: app.docid
				})
			});

			this.appendedUserDataView = new app.InformaCamAppendedUserDataVIew({
				model: new app.InformaCamAppendedUserData({
					id: app.docid
				})
			});

			this.documentWrapperView = new app.InformaCamDocumentWrapperView({
				model: new app.InformaCamDocumentWrapper({
					id: app.docid
				})
			});

			this.gps_coordsView = new app.InformaCamJ3MTimeseriesMapView({
				model: new app.InformaCamJ3MTimeStampedData({
					urlRoot: '/GPSCoords',
					id: app.docid
				}),
				el: '#ic_gps_coords_view_holder',
				header: 'GPS Coordinates',
			});
			
			this.progressNotifierView = new app.progressNotifierView({
				model: new InformaCamNotifier(),
				el: $('#ic_progressNotifierViewHolder'),
			});
			
			$c(this.progressNotifierView.model);
			

			/* MULTI-VIEW LINE CHART */	
					// http://stackoverflow.com/questions/7385629/backbone-js-complex-views-combining-multiple-models
					// http://stackoverflow.com/questions/7734559/backbone-js-passing-2-models-to-1-view
			this.lineChartMultiView = new app.InformaCamJ3MLineChartMultiView({
				model: new Backbone.Model({
					pressureAltitude: new app.InformaCamJ3MTimeStampedData({
						urlRoot: '/pressureAltitude',
						id: app.docid,
						title: 'Pressure Altitude',
						keys: ['pressureAltitude'],
					}),
					lightMeter: new app.InformaCamJ3MTimeStampedData({
						urlRoot: '/lightMeter',
						id: app.docid,
						title: 'Light Meter',
						keys: ['lightMeterValue'],
					}),
					GPSAccuracy: new app.InformaCamJ3MTimeStampedData({
						urlRoot: '/GPSAccuracy',
						id: app.docid,
						title: 'GPS Accuracy',
						keys: ['gps_accuracy'],
					}),
					GPSBearing: new app.InformaCamJ3MTimeStampedData({
						urlRoot: '/GPSBearing',
						id: app.docid,
						title: 'GPS Bearing',
						keys: ['gps_bearing'],
					}),
					Accelerometer: new app.InformaCamJ3MTimeStampedData({
						urlRoot: '/Accelerometer',
						id: app.docid,
						title: 'Accelerometer',
						keys: ['acc_x', 'acc_y', 'acc_z', ],
					}),
					pressureHPAOrMBAR: new app.InformaCamJ3MTimeStampedData({
						urlRoot: '/pressureHPAOrMBAR',
						id: app.docid,
						title: 'pressureHPAOrMBAR',
						keys: ['pressureHPAOrMBAR', ],
					}),
					dateCreated: new app.InformaCamJ3MHeader({
						id: app.docid,
					}),
				}),
				el: '#ic_linechart_view_holder',
			});	

			this.lineChartMultiView.model.get("pressureAltitude").fetch();
			this.lineChartMultiView.model.get("lightMeter").fetch();
			this.lineChartMultiView.model.get("GPSAccuracy").fetch();
			this.lineChartMultiView.model.get("GPSBearing").fetch();
			this.lineChartMultiView.model.get("Accelerometer").fetch();
			this.lineChartMultiView.model.get("pressureHPAOrMBAR").fetch();
			



			/* END MULTI-VIEW LINE CHART */	


			//LISTENERS
			
			views = [this.J3MHeaderView, this.documentWrapperView, this.gps_coordsView, ];
			
			_.each(views, function(view) {
				this.listenTo(view.model, 'change', function() {
					view.$el.append(view.render().el);
				});
				view.model.fetch();
			}, this);
			
			
			this.progressNotifierView.model.get('message_map').push(
				_.bind(this.progressNotifierView.render, this.progressNotifierView)
			);
			

			this.listenTo(this.documentSourceView.model, 'change', function() {
				this.documentSourceView.$el.append(this.documentSourceView.render().el);
			});
			
			this.listenTo(this.appendedUserDataView.model, 'change', function() {
				this.appendedUserDataView.$el.append(this.appendedUserDataView.render().el);
			});
			
			this.documentSourceView.model.fetch({url: '/files/.data/' + app.docid + '/j3m.json'});
			this.appendedUserDataView.model.fetch();
		},
	});


	function $c(foo) {
		console.log(foo);
	}
});

/*
think about these:

http://localhost:8888/GPSAccuracy/4c20d05a772723f1b5e97166ca1f3709/
http://localhost:8888/Accelerometer/4c20d05a772723f1b5e97166ca1f3709/
//acc_x, acc_y, acc_z
http://localhost:8888/DocumentWrapper/8a0daac95f6bb42ffc839dd23db29dec/
http://localhost:8888/PitchRollAzimuth/f76f260fb500ac1a58e0c35c97d5361e/
//pitch, roll, azimuth, plus all 3 corrected
http://localhost:8888/VisibleWifiNetworks/4c20d05a772723f1b5e97166ca1f3709/

http://localhost:8888/j3mheader/8a0daac95f6bb42ffc839dd23db29dec/


http://localhost:8888/GPSAccuracy/f76f260fb500ac1a58e0c35c97d5361e/
http://localhost:8888/GPSCoords/f76f260fb500ac1a58e0c35c97d5361e/


http://localhost:8888/GPSAccuracy/4c20d05a772723f1b5e97166ca1f3709/
http://localhost:8888/GPSBearing/4c20d05a772723f1b5e97166ca1f3709/
gps_bearing
http://localhost:8888/GPSCoords/4c20d05a772723f1b5e97166ca1f3709/

http://localhost:8888/lightMeter/f76f260fb500ac1a58e0c35c97d5361e/

http://localhost:8888/GPSAccuracy/f76f260fb500ac1a58e0c35c97d5361e/

http://localhost:8888/lightMeter/4c20d05a772723f1b5e97166ca1f3709/

http://localhost:8888/pressureAltitude/4c20d05a772723f1b5e97166ca1f3709/

http://localhost:8888/pressureHPAOrMBAR/4c20d05a772723f1b5e97166ca1f3709/

http://localhost:8888/AppendedUserData/a246fcc91b4fcf505376c3481f3eb3bb/
http://localhost:8888/AppendedUserData/4c20d05a772723f1b5e97166ca1f3709/
http://localhost:8888/AppendedUserData/e81e0a914e1358591a44d03f338e5270/
*/

