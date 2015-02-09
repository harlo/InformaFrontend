var app = app || {};//global Backbone

jQuery(document).ready(function($) {
	app.InformaCamJ3MHeader = Backbone.Model.extend({
		urlRoot: '/j3mheader',
	});

	app.InformaCamDocumentWrapper = Backbone.Model.extend({
		urlRoot: '/DocumentWrapper',
		parse: function(response) {
			response.data.dateAddedFormatted = moment(Number(response.data.date_added)).format("MM/DD/YYYY HH:mm:ss");;
			if (response.data.upload_attempts === undefined) {
				response.data.upload_attempts = 1;
			}
			return response;
		}
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
});

function $c(foo) {
	console.log(foo);
}


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

