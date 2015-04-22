var app = app || {};//global Backbone

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
			iconSize: [9, 12]
		});
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

					L.circle([latlong.gps_lat,latlong.gps_long], radius, {stroke:false, fillOpacity: opacity}).addTo(this.maps[mapID]).bringToBack();

				}
			}
		}, this);
		//workaround for Leaflet.js rendering bug on WebKit, where layers aren't aligned
		this.maps[mapID].panBy([1, 0]);
	},
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


