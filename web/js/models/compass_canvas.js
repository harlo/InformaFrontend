var compass_group_handle;

var LabeledRect = fabric.util.createClass(fabric.Rect, {
	type: 'LabeledRect',
	
	initialize: function(opts) {
		opts || (opts = { });

		this.callSuper('initialize', opts);
		this.set({
			label: opts.label || '',
			rx : 5,
			ry: 5
		});
	},
	
	toObject: function() {
		return fabric.util.object.extend(this.callSuper('toObject'), {
		  label: this.get('label')
		});
	},
	
	_render: function(ctx) {
		this.callSuper('_render', ctx);

		ctx.font = '12px Helvetica';
		ctx.fillStyle = '#ffffff';
		ctx.fillText(this.label, -this.width/2, -this.height/2 + 12);
	}
});

var CompassCanvas = Backbone.Model.extend({
	constructor: function() {
		var canvas = document.createElement('canvas');
		$(canvas).prop({
			'width' : $("#c_canvas").width(),
			'height' : $("#c_canvas").height()
		});

		$(canvas).prop('id', 'c_canvas_c');
		$("#c_canvas").append($(canvas));

		this.canvas = new fabric.Canvas('c_canvas_c');
		this.canvas.on({
			'object:moving' : this.onObjMove,
		});
		
		fabric.Canvas.prototype.getAbsoluteCoords = function(obj) {
			return {
				left: obj.left + this._offset.left,
				top: obj.top + this._offset.top
			}
		};	
	},
	
	onMouseMove: function(e) {},
	
	onObjMove: function(options) {
		options.target.setCoords();
		compass_canvas.canvas.forEachObject(function(obj) {
			if(obj === options.target || obj.type === "LabeledRect") { return; }

			var intersects = options.target.intersectsWithObject(obj);			
			obj.setOpacity(intersects ? 0.5 : 0.1);
		});
	},
	
	addAsset: function(asset) {	
		this.canvas.add(asset.shadow);
		
		if(!this.ui_assets) {
			this.ui_assets = [];
		}
		
		this.ui_assets.push(asset);		
	},
	
	setUXContextByShadow: function(handle_obj, shadow) {
		var asset = this.getAssetByShadow(shadow);
		if(asset == -1) { return; }
		
		var ctx = this.ui_assets[asset]; 
		if(ctx.class_name != "c_pit") { return; }
		
		if(ctx.id == "ui_stage") {
			compass_stage.setGroup();
		} else if(ctx.id == "ui_console") {
			compass_console.setGroup();
		}
	},
	
	getAssetByShadow: function(shadow) {
		var range = [];
		
		while(range.push(x++)<this.ui_assets.length);
		for(var x in range) {
			if(compass_canvas.ui_assets[x].shadow == shadow) { return x; }
		}
		
		return -1;
	},
	
	removeAsset: function(asset) {		
		asset.shadow.remove();
		this.canvas.renderAll();
		
		this.ui_assets.splice(this.ui_assets.indexOf(asset), 1);
	},
	
	hideAsset: function(asset, redraw) {
		asset.shadow.setOpacity(0);
		if(redraw) { this.canvas.renderAll(); }
	},
	
	showAsset: function(asset, redraw) {
		asset.shadow.setOpacity(1);
		if(redraw) { this.canvas.renderAll(); }
	},
	
	shadowUIAsset: function(handle_obj, e) {
		if(!this.isPromoted) { promoteCanvas(); }
	},
	
	returnToOrigin: function(handle_obj, e) {
		this.canvas.forEachObject(function(obj) {
			if(obj === handle_obj.shadow) { return; }
			var intersects = handle_obj.shadow.intersectsWithObject(obj);
			
			if(intersects) {
				compass_canvas.setUXContextByShadow(handle_obj, obj);
			}
		});
		
		
		this.canvas.forEachObject(function(obj) {
			if(obj === e.target) { return; }
		
		});	
	
		handle_obj.shadow.set({
			left: handle_obj.origin.left,
			top: handle_obj.origin.top,
			opacity: handle_obj.active ? 1 : 0
		});

		handle_obj.shadow.setCoords();

		compass_canvas.canvas.forEachObject(function(obj) {
			if(obj.type === "LabeledRect") { return; }
			obj.setOpacity( 0.1);
		});
		
		this.canvas.renderAll();
		demoteCanvas();
	}
});

function returnToOrigin(handle_obj, e) { compass_canvas.returnToOrigin(handle_obj, e); }

function promoteCanvas(handle_obj, e) {
	$("#c_canvas").css('z-index', 300);
	compass_canvas.isPromoted = true;
}

function demoteCanvas() {
	$("#c_canvas").css('z-index', 100);
	delete compass_canvas.isPromoted;
}

function initGroupHandle() {
	compass_group_handle = new CompassUIHandle($("#c_file_group_handle"), 
		new LabeledRect({
			label: "GROUP",
			fill: "#ccc"
		}), undefined, "c_file_group_handle"
	);
	compass_group_handle.setOnMouseUp(compass_group_handle, "returnToOrigin");
	compass_canvas.addAsset(compass_group_handle);
}