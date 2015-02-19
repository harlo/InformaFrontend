var app = app || {};//global Backbone

app.InformaCamLineChartMultiView = Backbone.View.extend({
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
		var niceDataNames = {lightMeter: 'Light Meter', Accelerometer: 'Accelerometer', lightMeterValue: 'Light Meter',  acc_x: 'Accelerometer X', acc_y: 'Accelerometer Y', acc_z: 'Accelerometer Z', pressureAltitude: 'Pressure Altitude', pressureHPAOrMBAR: 'Pressure HPA or MBAR'};

		var niceDataUnits = {lightMeter: 'lux', Accelerometer: 'meters/second^2', lightMeterValue: 'lux', acc_x: 'Accelerometer X', acc_y: 'Accelerometer Y', acc_z: 'Accelerometer Z', pressureAltitude: 'meters', pressureHPAOrMBAR: 'millibars'};

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
