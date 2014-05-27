var InformaCamMap = UnveillanceViz.extend({
	constructor: function() {
		UnveillanceViz.prototype.constructor.apply(this, arguments);
		if(this.invalid) { return; }
		
		console.info($(this.svg));
		$(this.svg[0]).remove();
		delete this.svg;
		
		$(this.root_el).css({
			'width' : this.dims.width,
			'height' : '60%'
		});
		console.info(this.get('data'));
		
		this.map = L.map($(this.root_el).attr('id')).setView([
			this.get('data')[0].lat_lng[1].toFixed(3),
			this.get('data')[0].lat_lng[0].toFixed(3)
		], 8);
		L.tileLayer(
			UV.CM_API.AUTH_STR,
			{ maxZoom: UV.CM_API.MAX_ZOOM, attribution: UV.CM_API.ATTRIBUTION}
		).addTo(this.map);
		
		_.each(this.get('data'), function(loc) {
			console.info(loc);
			var marker = L.marker([
				loc.lat_lng[1].toFixed(3), loc.lat_lng[0].toFixed(3)]);
			marker.addTo(this.map);
		}, this);
	}
});