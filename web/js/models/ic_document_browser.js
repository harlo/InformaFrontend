var InformaCamDocumentBrowser = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		this.set('group_tmpl', getTemplate("document_browser_group.html"));

		if(!this.has('root_el')) { this.set('root_el', $('body')); }

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
	}
})