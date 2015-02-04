var app = app || {};//global Backbone

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
