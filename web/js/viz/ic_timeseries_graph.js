var InformaCamTimeseriesGraph = UnveillanceViz.extend({
	constructor: function() {
		UnveillanceViz.prototype.constructor.apply(this, arguments);
		if(this.invalid) { return; }
				
		this.dims.padding = {
			left: 100,
			top: 110,
			right: 180,
			bottom: 20
		};
		
		var first_timestamp = this.get('data')[0].timestamp;
		var last_timestamp = this.get('data')[this.get('data').length - 1].timestamp;
		
		this.set('data', crossfilter(this.get('data')));
		this.dims.axis = { x: [first_timestamp, last_timestamp], y: this.getMinAndMax() };
		
		var x = d3.scale.linear().rangeRound(
			[0, this.dims.width - (this.dims.padding.left + this.dims.padding.right)]);
		var x_axis = d3.svg.axis().scale(x).orient("bottom");
		
		var y = d3.scale.linear().rangeRound(
			[this.dims.height - this.dims.padding.bottom, this.dims.padding.bottom]);
		var y_axis = d3.svg.axis().scale(y).orient("left");
		
		this.svg.append("svg:g")
			.attr({
				"transform" : "translate(" + 
					this.dims.padding.left + "," +
					(this.dims.height - this.dims.padding.bottom) + ")",
				"class" : "ic_x_axis"
			})
			.call(x_axis);
		
		this.svg.append("svg:g")
			.attr({
				"transform" : "translate(" + this.dims.padding.left  + ",0)",
				"class" : "ic_y_axis"
			})
			.call(y_axis);
		
		this.buildLegend();
	},
	getMinAndMax: function() {
		var min, max;
		var cf = this.get('data');
		_.each(this.get('legend'), function(l) {
			var d = cf.dimension(function(se) {
				return drillToKey(se.sensorPlayback, l.key)[0];
			});

			var min_ = drillToKey(d.bottom(Infinity)[0].sensorPlayback, l.key)[0];
			var max_ = drillToKey(d.top(Infinity)[0].sensorPlayback, l.key)[0];

			if(!min || min > min_) { min =  min_; }
			if(!max || max < max_) { max = max_; }
		});
		
		return [min ? min : 0, max ? max : this.dims.height];
	},
	buildDataTree: function(data) {
		
	}
});