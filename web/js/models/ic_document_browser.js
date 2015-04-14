var InformaCamDocumentBrowser = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		this.set('group_tmpl', getTemplate("document_browser_group.html"));
		this.set('progress_holder_tmpl', getTemplate("progress_holder.html"))

		this.set('preview_tmpls', {});
		this.set('imports_in_progress', []);
		this.set('finished_statuses', [410]);

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
					if(n == UV.MIME_TYPES.pgp) {
						return "source"; 
					} else if(_.contains([UV.MIME_TYPES.image, UV.MIME_TYPES.video, UV.MIME_TYPES.log], n)) { 
						return "submission"; 
					}
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

			this.setPreview(doc, li);
		}, this);
	},
	setPreview: function(doc, li) {
		var href_path = "/submission/";
		if(_.contains([UV.MIME_TYPES.image, UV.MIME_TYPES.video, UV.MIME_TYPES.log], doc.mime_type)) {

			var display_thumb = _.find(doc.assets, function(a) { return _.contains(a.tags, UV.ASSET_TAGS.THUMB); });
			if(_.isObject(display_thumb) && !(_.isUndefined(display_thumb.file_name))) {
				doc.display_thumb = "/" + ["files", doc.base_path, display_thumb.file_name].join('/');
			}
		} else {
			href_path = "/source/";
		}

		$(li).find('a')
			.html(Mustache.to_html(this.get('preview_tmpls')[doc.mime_type], doc))
			.prop('href', href_path + doc._id + "/");
		translate($(li));
	},
	onImportProgress: function(message) {
		if(!message.doc_id) {
			return;
		}

		if(_.contains(this.get('imports_in_progress'), message.doc_id)) {
			var doc = doInnerAjax("documents", "post", { _id : message.doc_id }, null, false);

			if(_.isUndefined(doc) || doc.result != 200) {
				return;
			}

			doc = doc.data;
			var progress_holder = $("#ic_progress_holder_" + doc._id);
			
			if($(progress_holder).length == 0) {
				progress_holder = Mustache.to_html(this.get('progress_holder_tmpl'), {
					_id : doc._id
				});

				var group = $("#ic_doc_list_" + MD5(String(doc.mime_type)));				
				$(group).prepend(progress_holder);
			}

			$($(progress_holder).find('span.status_label')[0]).html(message.task_path);
			$($(progress_holder).find('span.status_bar')[0]).html((_.indexOf(message.task_queue, message.task_path) + 1) + " / " + message.task_queue.length);

			if(_.contains(this.get('finished_statuses'), message.status)) {
				this.set('imports_in_progress', _.without(this.get('imports_in_progress'), doc._id));
				this.setPreview(doc, $(progress_holder).parents('li')[0]);
			}
		}
	},
	resolveInport: function(new_doc) {		
		if(!_.contains(this.get('imports_in_progress'), new_doc._id)) {
			this.get('imports_in_progress').push(new_doc._id);
		}
	}
})