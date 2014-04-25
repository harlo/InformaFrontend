var InformaCamTimeseriesChart = UnveillanceViz.extend({
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
		this.entities = this.getUniqueEntities();
		this.dims.axis = { 
			x: [first_timestamp, last_timestamp], 
			y: [0, this.entities.length]
		};
		
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
		
		this.buildLegend(_.map(this.entities, function(e) { return { label : e }; }));	
	},
	getUniqueEntities: function() {
		var entities = [];
		var cf = this.get('data');
		_.each(this.get('legend'), function(l) {
			var d = cf.dimension(function(se) {
				var dtk = drillToKey(se.sensorPlayback, l.key);
				var value = dtk[0];
				
				if(value instanceof Array) {
					value = _.map(value, function(v) { return v[dtk[1]]; });
				} else { value = [value]; }
				
				entities = _.union(entities, value);
				return value;
			});			
		});
		
		return _.uniq(entities);
	},
	buildDataTree: function(data) {
		
	}
});