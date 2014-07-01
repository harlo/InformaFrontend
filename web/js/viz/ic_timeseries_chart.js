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
						
		this.set('data', crossfilter(this.get('data')));
		this.entities = this.getUniqueEntities();
		this.dims.axis = { 
			x: [this.get('first_timestamp'), this.get('last_timestamp')], 
			y: [0, this.entities.length]
		};
		
		this.scale = {}
		var x_range = [0, 
			this.dims.width - (this.dims.padding.left + this.dims.padding.right)];
		this.scale.x = d3.scale.linear().domain(this.dims.axis.x).range(x_range);
		var x_axis = d3.svg.axis().scale(this.scale.x).orient("bottom").ticks(10)
			.tickFormat(function(d) { return moment(Number(d)).format("HH:mm:ss"); });
		
		var y_range = [this.dims.height - this.dims.padding.bottom,
			this.dims.padding.bottom];
		this.scale.y = d3.scale.linear().domain(this.dims.axis.y).range(y_range);
		var y_axis = d3.svg.axis().scale(this.scale.y).orient("left");
		
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
		
		this.entities = _.map(this.entities, function(e) {
			return {
				label : e,
				color: getRandomColor()
			}; 
		});
		this.buildLegend(this.entities);
		this.buildData();	
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
	buildData: function() {
		var cf = this.get('data');
		var entities = this.entities;
		var dims = this.dims;
		var ctx = this.svg;
		var offs = this.dims.padding.left
		var scale = this.scale;
		
		_.each(this.get('legend'), function(l) {
			
			_.each(entities, function(e, i) {
				var d = cf.dimension(function(se) {
					var value = drillToKey(se.sensorPlayback, l.key)[0];
					return value == e.label;
				});
				
				var c_name = e.label.replace(/\W+/g, "_");
				
				ctx.selectAll("rect.ic_rect_" + c_name)
					.data(d.top(Infinity)).enter()
					.append("svg:rect").style('fill', e.color).attr({
						"width" : 40,
						"height" : (dims.height/entities.length) * 0.6,
						"x" : function(point) {
							return scale.x(point.timestamp) + offs;
						},
						"y" : function(point) {
							return scale.y(i) - dims.padding.bottom;
						}
					});
				
			});
		});
	}
});