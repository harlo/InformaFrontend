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

			this.appendedUserDataView = new app.InformaCamAppendedUserDataView({
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
				el: '#ic_progressNotifierViewHolder',
			});
			
			

			/* MULTI-VIEW LINE CHART */	
					// http://stackoverflow.com/questions/7385629/backbone-js-complex-views-combining-multiple-models
					// http://stackoverflow.com/questions/7734559/backbone-js-passing-2-models-to-1-view
			this.lineChartMultiView = new app.InformaCamLineChartMultiView({
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

