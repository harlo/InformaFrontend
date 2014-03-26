var CompassUIHandle = Backbone.Model.extend({
	constructor: function(handle, shadow, class_name, id) {
		this.handle = handle;
		
		this.origin = {
			left: this.handle.offset().left, 
			top: this.handle.offset().top - (this.handle.height() * 1.6),
			width: this.handle.width(),
			height: this.handle.height()
		};
				
		this.shadow = shadow.set(this.origin);
		this.shadow.hasControls = this.shadow.hasBorders = false;
		this.setOnMove(this);
		
		if(!class_name) {
			class_name = "default";
		}
		
		this.class_name = class_name;
		if(id) { this.id = id; }		
	},
	
	setActive: function() {
		this.shadow.set({
			opacity: 1
		});
		this.active = true;
		compass_canvas.canvas.renderAll();
	},
	
	setInactive: function() {
		this.shadow.set({
			opacity: 0
		});
		this.active = false;
		compass_canvas.canvas.renderAll();
	},
	
	setOnMove: function(handle) {
		handle.shadow.on('moving', function() {
			compass_canvas.shadowUIAsset(handle, this);
			this.set({
				opacity: 0.7
			});
		});
	},
	
	setOnMouseUp: function(handle, callback) {
		handle.shadow.on('mouseup', function() {
			window[callback].apply(this, [handle, this])
		});
		handle.setInactive();
	},
	
	setOnMouseDown: function(handle, callback) {
		handle.shadow.on('mousedown', function() {
			window[callback].apply(this, [handle, this])
		});
		handle.setActive();
	}
});

var CompassObjectHandle = Backbone.Model.extend({
	constructor: function(ui_root, obj_handle) {
		this.ui_root = ui_root;
		this.obj_handle = obj_handle;
		
		this.holder = $(document.createElement('div'))
			.addClass("c_obj_handle")
			.prop('id', "c_declared_obj_" + this.obj_handle.index);
		
		insertTemplate("object_handle.html", this.obj_handle, this.holder);		
		$(this.ui_root).append(this.holder);
		
	}
});