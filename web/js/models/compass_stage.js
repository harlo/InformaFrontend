var CompassStage = Backbone.Model.extend({
	constructor: function() {
		this.object_holder = new CompassUIHandle($("#c_stage_hotzone"),
			new fabric.Rect(), "c_pit", "ui_stage");
		
		this.object_holder.shadow.set({
			top: 0,
			width: this.object_holder.handle.width(),
			lockMovementY: true,
			lockMovementX: true,
			lockRotation: true,
			opacity: 0.1
		});
		
		compass_canvas.addAsset(this.object_holder);
		
		Backbone.Model.apply(this, arguments);
	},
	
	setGroup: function() {
		this.loadStage('get_context', function() {
			$("#c_stage_hotzone iframe")[0].contentWindow.postMessage(
				compass_documents.getGroup(true),
				"http://localhost:"	+ API_PORT
			);
		});
	},
	
	loadStage: function(context, callback) {
		this.module = new CompassModule(context, callback);
	}
});