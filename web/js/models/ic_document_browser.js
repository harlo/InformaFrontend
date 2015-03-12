var InformaCamDocumentBrowser = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		this.set('group_tmpl', getTemplate("document_browser_group.html"));
		this.set('preview_tmpls', {})

		if(!this.has('root_el')) {
			this.set('root_el', $('body'));
		}

		if(!this.has('data')) {
			return;
		}

		_.each(UV.MIME_TYPES, function(mime_type) {
			var preview_tmpl;
			switch(mime_type) {
				case UV.MIME_TYPES.image:
					preview_tmpl = "display_image.html";
					break;
				case UV.MIME_TYPES.video:
					preview_tmpl = "display_image.html";
					break;
				case UV.MIME_TYPES.log:
					preview_tmpl = "display_log.html";
					break;
				case UV.MIME_TYPES.pgp:
					preview_tmpl = "display_source.html";
					break;
			}

			if(!(_.isUndefined(preview_tmpl))) {
				this.get('preview_tmpls')[mime_type] = getTemplate(preview_tmpl);
			}
		}, this);

		_.each(_.groupBy(this.get('data').documents, function(doc) { return doc.mime_type;}), 
			function(group) {
				var group_name = group[0].mime_type;
				var group_hash = MD5(String(group_name));
				var group_type = _.map([group_name], function(n) {
					if(n == UV.MIME_TYPES.pgp) { return "source"; }
					else if(_.contains([UV.MIME_TYPES.image, UV.MIME_TYPES.video, UV.MIME_TYPES.log], n)) { return "submission"; }
				});
				
				group = {
					group_hash : group_hash,
					group_name : group_name,
					group_type : group_type,
					documents : group
				};

				$(this.get('root_el'))
					.append(Mustache.to_html(this.get('group_tmpl'), group));
			}, this);

		this.showPreview();
		translate($(this.get('root_el')));
	},
	showPreview: function() {
		_.each($("[id^=ic_doc_list]").children('li'), function(li) {
			var _id = _.last(_.reject(
				$(li).find('a').prop('href').split('/'), 
				function(seg) { return seg == ""; }
			));
			var doc = _.findWhere(this.get('data').documents, { _id : _id });

			if(_.isUndefined(doc)) {
				return;
			}

			if(_.contains([UV.MIME_TYPES.image, UV.MIME_TYPES.video], doc.mime_type)) {
				var display_thumb = _.find(doc.assets, function(a) { return _.contains(a.tags, UV.ASSET_TAGS.THUMB); });
				if(_.isObject(display_thumb) && !(_.isUndefined(display_thumb.file_name))) {
					doc.display_thumb = "/" + ["files", doc.base_path, display_thumb.file_name].join('/');
				}
			}

			$(li).find('a').html(Mustache.to_html(this.get('preview_tmpls')[doc.mime_type], doc));
		}, this);
	}
})