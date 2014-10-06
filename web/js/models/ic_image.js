var InformaCamImage = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		
		this.root_el = $(document.createElement('canvas'))
			.attr('id', "ic_img_" + randomString())
			.addClass('ic_image');
		
		this.canvas = this.root_el.get(0).getContext('2d');
		this.image = new Image();
		
		var ctx = this.canvas;
		
		if(this.has('on_load')) {
			this.image.src = this.getImageAsset(this.get('on_load'));
			this.image.onload = function() {
				console.info("HI");
				console.info(this);
				ctx.drawImage(this, 0, 0);
			}
		}
		
		console.info($(this.get('parent')));
		console.info($(this.root_el));
		$(this.get('parent')).append($(this.root_el));
	},
	
	getImageAsset: function(tag) {
		try {
			return "/files/" + this.get('asset').get('base_path') + "/" +
				this.get('asset').getAssetsByTagName(tag)[0].file_name;
		} catch(err) {
			console.warn(err);
		}
		
		return "/web/images/no_media.png";
	}
});