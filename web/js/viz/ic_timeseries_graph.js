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
		this.dims.radius = 3;
		
		
		this.set('data', crossfilter(this.get('data')));
		this.dims.axis = {
			x: [this.get('first_timestamp'), this.get('last_timestamp')], 
			y: this.getMinAndMax()
		};
		_.each(this.get('legend'), function(l) { l.color = getRandomColor(); });
		
		this.scale = {};
		
		var x_range = [0, 
			this.dims.width - (this.dims.padding.left + this.dims.padding.right)];
		
		this.scale.x = d3.scale.linear().domain(this.dims.axis.x).range(x_range);
		var x_axis = d3.svg.axis().scale(this.scale.x).orient("bottom").ticks(10)
			.tickFormat(function(d) { 
				return moment(Number(d)).format("MM-DD-YYYY HH:mm:ss"); 
			});
		
		var y_range = [(this.dims.height - this.dims.padding.bottom),
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
			.call(x_axis)
			.selectAll("text")
			.attr("transform", "rotate(-75)");
		
		this.svg.append("svg:g")
			.attr({
				"transform" : "translate(" + this.dims.padding.left  + ",0)",
				"class" : "ic_y_axis"
			})
			.call(y_axis);
		
		this.buildLegend();
		this.buildData();
		
		g_scale = this.scale;
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
	buildData: function() {
		var cf = this.get('data');
		var ctx = this.svg;
		var r = this.dims.radius;
		var offs = this.dims.padding.left;
		var scale = this.scale;
		
		scale.lineFunction = {
			x : function(point) {
				return scale.x(point.timestamp) + offs;
			},
			y: function(point, key) {
				return scale.y(drillToKey(point.sensorPlayback, key)[0]);
			}
		};
		
		var previous_point;
		_.each(this.get('legend'), function(l) {
			var d = cf.dimension(function(se) {
				return drillToKey(se.sensorPlayback, l.key)[0];
			});
			
			var last_point;
			var line_data = [];
			var c_name = l.key.replace(/\W+/g, "_");
			
			ctx.selectAll("circle.ic_point_" +  c_name)
				.data(d.top(Infinity)).enter()
				.append("svg:circle").style('fill', l.color).attr({
					"r" : r,
					"cx" : function(point) {	
						return scale.x(point.timestamp) + offs;
					},
					"cy" : function(point) {
						return scale.y(drillToKey(point.sensorPlayback, l.key)[0]);
					},
					"class" : "ic_point_" + c_name
				})
				.each(function(point, i) {
					line_data.push({
						x : last_point ? Number($(last_point).attr("cx")) - offs: 0,
						y : last_point ? Number($(last_point).attr("cy")) : 0
					});
					last_point = this;
				});
						
			ctx.append("svg:path").attr({
				"d" : (d3.svg.line()
					.x(function(p) { return p.x + offs; })
					.y(function(p) { return p.y; })
					.interpolate("cardinal"))(line_data.sort(function(a, b) {
						return a.x < b.x ? -1 : 1;
					})),
				"stroke" : l.color,
				"class" : "uv_graph ic_path_" + c_name
			});

		});
	}
});