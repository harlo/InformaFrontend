var app = app || {};//global Backbone

var niceDataNames = {lightMeter: 'Light Meter', Accelerometer: 'Accelerometer', lightMeterValue: 'Light Meter',  acc_x: 'Accelerometer X', acc_y: 'Accelerometer Y', acc_z: 'Accelerometer Z', pressureAltitude: 'Pressure Altitude', pressureHPAOrMBAR: 'Pressure HPA or MBAR'};

var niceDataUnits = {lightMeter: 'lux', Accelerometer: 'meters/second^2', lightMeterValue: 'lux', acc_x: 'Accelerometer X', acc_y: 'Accelerometer Y', acc_z: 'Accelerometer Z', pressureAltitude: 'meters', pressureHPAOrMBAR: 'millibars'};

jQuery(document).ready(function($) {
	/* BACKBONE MODELS */

	app.InformaCamJ3MHeader = Backbone.Model.extend({
		urlRoot: '/j3mheader',
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
	
	app.InformaCamProgressNotifierView = Backbone.View.extend({
		initialize: function(options) {
			this.tasksCompleted = [];
		},
		render: function(message) {
			var status = message.status;
			if (message.doc_id != app.docid || status != 200) {
				return;
			}
			if (this.tasksCompleted.length == 0) {
				this.$el.prepend('<h2>Task Progress</h2>');
				this.$el.addClass("rendered");
			}
			if (message.task_queue !== undefined) {
				$('#tasksTotal').html(message.task_queue.length);
				var task_path = message.task_path;
				if (!_.contains(this.tasksCompleted, task_path)) {
					this.tasksCompleted.push(task_path);
					$('#tasksComplete').html(this.tasksCompleted.length);
					this.$el.append(task_path + '<br>');
				}
			}
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
			$('<a>download JSON</a>').appendTo(this.$el).click( function() {
				 onDownloadRequested('j3m.json', this);
			});
			return this;
		},
	});

	app.InformaCamAppendedUserDataVIew = Backbone.View.extend({
		el: $('#ic_appended_user_data'),
		render: function() {
			this.$el.html('<h3>Appended User Data</h3>' + toHTML(this.model.attributes));
			return this;
		},
	});

	app.InformaCamDocumentWrapperView = Backbone.View.extend({
		el: $('#ic_documentwrapper_view_holder'),
		template: getTemplate("document_wrapper.html"),
		render: function() {
			var json = this.model.toJSON().data;
			json.dateAddedFormatted = moment(Number(json.date_added)).format("MM/DD/YYYY HH:mm:ss");
			if (json.upload_attempts === undefined) {
				json.upload_attempts = 1;
			}
			if (json.j3m_verified === undefined) {
				json.j3m_verified = 'unverified';
			} else {
				json.j3m_verified = json.j3m_verified ? 'passed (j3m data was signed, and the signature verified good)' : 'failed';
			}
			
			if (json.media_verified === undefined) {
				json.media_verified = 'unverified';
			} else {
				json.media_verified = json.media_verified ? 'passed (the pixelhash check matched j3m data signature)' : 'failed';
			}
			var html = Mustache.to_html(this.template, json);
			this.$el.html(html);
			return this;
		},
	});

	app.InformaCamJ3MTimeseriesMapView = Backbone.View.extend({
		initialize: function(options) {
			this.maps = [];
			this.header = options.header;

			this.overviewIcon = L.icon({
				iconUrl: '/web/images/ic_map_icon.png',
				iconRetinaUrl: '/web/images/ic_map_icon.png',
				iconSize: [18, 18]
			});
			
			this.zoomIcon = L.icon({
				iconUrl: '/web/images/ic_map_icon.png',
				iconRetinaUrl: '/web/images/ic_map_icon.png',
				iconSize: [7, 7]
			});
			
			this.zoomBearingIcon = L.icon({
				iconUrl: '/web/images/ic_map_icon_bearing.png',
				iconRetinaUrl: '/web/images/ic_map_icon_bearing.png',
				iconSize: [6, 8]
			});
		},
		render: function() {
			this.$el.prepend('<h2>' + this.header + '</h2>');
			this.json = {values: this.model.get("values")};
			this.loadMap('mapOverview', [this.json.values[0]], 4);
			this.loadMap('mapZoom', this.json.values, 19);
			$c(this.json);
			return this;
		},
		
		loadMap: function(mapID, values, zoom) {
			$('#' + mapID).addClass("rendered");
			this.maps[mapID] = L.map(mapID).setView([values[0].gps_lat, values[0].gps_long], zoom);
			
			//create map tile layer
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				maxZoom: 19,
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
			}).addTo(this.maps[mapID]);
			
			if (mapID == 'mapZoom') {
				latlngs = _.map(values, function(latlong){ return [latlong.gps_lat,latlong.gps_long]; });
				L.polyline(latlngs, {color: 'red', weight:2, opacity:1.0 }).addTo(this.maps[mapID]);
			}

			
			_.each(values, function(latlong) {
				timestamp = moment(Number(latlong.timestamp)).format("MM/DD/YYYY HH:mm:ss");
				
				var angle = 0;
				if (mapID == 'mapZoom') {
					if (latlong.gps_bearing === undefined) {
						var icon = this.zoomIcon;
					} else {
						var icon = this.zoomBearingIcon;
						angle = latlong.gps_bearing;	
					}
				} else {
					var icon = this.overviewIcon;
				}
			
				L.rotatedMarker([latlong.gps_lat,latlong.gps_long], {angle: angle, opacity:1.0})
				.setIcon(icon)
				.addTo(this.maps[mapID])
				.bindPopup(timestamp);
		
				if (mapID == 'mapZoom') {
					if (latlong.gps_accuracy) {
						radius = 36 / latlong.gps_accuracy;
						opacity = .7 / radius;
						$c(radius + " " + opacity);

						L.circle([latlong.gps_lat,latlong.gps_long], radius, {stroke:false, fillOpacity: opacity}).addTo(this.maps[mapID]).bringToBack();

					}
				}
			}, this);
			//workaround for Leaflet.js rendering bug on WebKit, where layers aren't aligned
			this.maps[mapID].panBy([1, 0]);
		},
	});
	
	app.InformaCamJ3MLineChartMultiView = Backbone.View.extend({
		initialize: function(options) {
			this.model.get('pressureAltitude').bind('change', this.render, this);
			this.model.get('lightMeter').bind('change', this.render, this);
			this.model.get('Accelerometer').bind('change', this.render, this);
			this.model.get('pressureHPAOrMBAR').bind('change', this.render, this);
			this.model.get('dateCreated').bind('change', this.render, this);

			this.margin = {top: 20, right: 20, bottom: 30, left: 50},
			this.totalWidth = 960, this.totalHeight = 500,
			this.width = this.totalWidth - this.margin.left - this.margin.right,
			this.height = this.totalHeight - this.margin.top - this.margin.bottom;
			this.xDomain = [];
			this.graphsPlotted = 0;
		},
		render: function(model) {
			var div_id = model.urlRoot.substring(1);
			if (div_id == 'j3mheader') {
				this.dateCreated = model.toJSON().data.genealogy.dateCreated;
				if (this.$el.find('svg').length) {
					this.renderDateCreated();
				}
				return;
			}
			
			if (!$('#graph_select').length) {
				$('<select multiple id="graph_select"></select>')
				.appendTo('#graph_controls')
				.change(function() {
					$('g.y.axis, g path.line, g .label').hide();
					_.each($(this).val(), function(line) {
						$('text.label.' + line).show();
						$('path.' + line).show();
						$('g.y.axis.' + line).show();
					});
				});
			}

			var data = model.get("values");
			
			$('<option value="' + div_id + '" selected>' + niceDataNames[div_id] + '</option>').appendTo('#graph_select');

			//lump all Y vals into one array for determining domain
			this.allYVals = [];
			_.each(model.get("keys"), function(key) {
				this.allYVals = this.allYVals.concat(_.pluck(data, key));
			}, this);
			
			this.graphsPlotted++;

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
		
			if (d3.min(this.allYVals) < 0) {
				y.domain(d3.extent(this.allYVals));
			} else {
				y.domain([0, d3.max(this.allYVals)]);
			}

			if (this.$el.find('svg').length == 1) {
				this.model.get("dateCreated").fetch();
			}

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + this.height + ")")
				.call(xAxis);

			svg.append("g")
				.attr("class", "y axis " + div_id)
				.attr("transform", "translate(" + (-50 * (this.graphsPlotted - 1)) + ",0)")
				.call(yAxis)
				.append("text")
				.attr("class", "y label " + div_id)
				.attr("text-anchor", "end")
				.attr("y", 6)
				.attr("dy", "-2em")
				.attr("transform", "rotate(-90)")
				.text(niceDataUnits[div_id]);
			
			_.each(model.get("keys"), function(key) {
				var line = d3.svg.line()
					.interpolate("basis")
					.x(function(d) { return x(d.timestamp); })
					.y(function(d) { return y(d[key]); });
					
				svg.append("path")
					.datum(data)
					.attr("class", "line " + div_id + " " + key)
					.attr("d", line);
									
				var labelX = x(data[data.length - 1]['timestamp']) + 5;
				var labelY = y(data[data.length - 1][key]);
					
				svg.append("text")
					.attr("transform", "translate(" + labelX + "," + labelY + ")")
					.attr("dy", ".35em")
					.attr("text-anchor", "start")
					.attr("class", "label " + div_id + " " + key)
					.text(niceDataNames[key]);
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
				model: new Backbone.Model({
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
					urlRoot: '/GPSData',
					id: app.docid
				}),
				el: '#ic_gps_coords_view_holder',
				header: 'GPS Coordinates',
			});
			
			this.InformaCamProgressNotifierView = new app.InformaCamProgressNotifierView({
				model: new InformaCamNotifier(),
				el: $('#ic_progressNotifierViewHolder'),
			});
			
			

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
			
			
			this.InformaCamProgressNotifierView.model.get('message_map').push(
				_.bind(this.InformaCamProgressNotifierView.render, this.InformaCamProgressNotifierView)
			);
			

			this.listenTo(this.documentSourceView.model, 'change', function() {
				this.documentSourceView.$el.append(this.documentSourceView.render().el);
			});

			this.documentSourceView.model.fetch({url: '/files/.data/' + app.docid + '/j3m.json'});
			

			this.listenTo(this.appendedUserDataView.model, 'change', function() {
				this.appendedUserDataView.$el.append(this.appendedUserDataView.render().el);
			});
			this.appendedUserDataView.model.fetch();
		},
	});


	function $c(foo) {
		console.log(foo);
	}
	
});



L.RotatedMarker = L.Marker.extend({
    options: {
        angle: 0
    },

    _setPos: function (pos) {
        L.Marker.prototype._setPos.call(this, pos);
        
        if (L.DomUtil.TRANSFORM) {
            // use the CSS transform rule if available
            this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
        } else if(L.Browser.ie) {
            // fallback for IE6, IE7, IE8
            var rad = this.options.angle * (Math.PI / 180),
                costheta = Math.cos(rad),
                sintheta = Math.sin(rad);
            this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' + 
                costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';                
        }
    }
});

L.rotatedMarker = function (pos, options) {
    return new L.RotatedMarker(pos, options);
};

/*
think about these:

Has bearing as well as accuracy
http://localhost:8888/GPSData/4c20d05a772723f1b5e97166ca1f3709/


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

