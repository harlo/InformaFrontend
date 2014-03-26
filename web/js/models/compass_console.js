var CompassConsole = Backbone.Model.extend({
	constructor: function() {		
		this.object_holder = new CompassUIHandle(
			$("#c_object_holder"), new fabric.Rect(), "c_pit", "ui_console");
		
		this.object_holder.shadow.set({
			top: this.object_holder.handle.offset().top * 0.55,
			width: this.object_holder.handle.width(),
			lockMovementY: true,
			lockMovementX: true,
			lockRotation: true,
			opacity: 0.1
		});
		
		compass_canvas.addAsset(this.object_holder);
		Backbone.Model.apply(this, arguments);
	},
	
	onDestroy: function() {
		compass_canvas.removeAsset(this.object_holder);
	},
	
	setGroup: function() {
		this.declareObject("doc_group_");
	},
	
	declareObject: function(label) {
		if(!this.object_map) { this.object_map = []; }
		
		var millis = new Date().getMilliseconds();
		
		this.object_map.push(new CompassObjectHandle("#c_object_holder", { 
			label : label + millis, 
			pointer: compass_documents.getGroup(true),
			index: millis,
			context: "compass_console"
		}));
	},
	
	removeObjectByHandle: function(obj_holder) {		
		var obj = _.find(this.object_map, function(o) {
			return ("#" + $(o.holder).prop('id')) == obj_holder;
		});
		
		this.object_map.splice(this.object_map.indexOf(obj), 1);
		$(obj_holder).remove();
		
	},
	
	export_script: function() {
		return {
			object_map : _.map(this.object_map, function(obj) {
				return { 
					"label" : obj.obj_handle.label,
					"pointer" : obj.obj_handle.pointer 
				};
			}),
			script: $($("#c_script_holder textarea")[0]).val()
		};
	},
	
	save: function() {
		
	},
	
	run: function() {
		compass_stage.loadStage('run_script', function() {
			$("#c_stage_hotzone iframe")[0].contentWindow.postMessage(
				compass_console.export_script(),
				"http://localhost:" + API_PORT
			);
		});
	}
});

function initConsole() {
	compass_console = new CompassConsole();
}

function destroyConsole() {
	compass_console.onDestroy();
	delete compass_console;
}