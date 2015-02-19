var app = app || {};//global Backbone

app.InformaCamDocumentWrapperView = Backbone.View.extend({
	el: '#ic_documentwrapper_view_holder',
	template: getTemplate("document_wrapper.html"),
	render: function() {
		var json = this.model.toJSON().data;
		switch (json.j3m_verified) {
			case 'passed':
				json.j3m_verified = '<span class="verify_passed">passed (j3m data was signed, and the signature verified good)</span>';
			break;
			case 'failed':
				json.j3m_verified = '<span class="verify_failed">failed</span>';
			break;
			case 'unverified':
			default:
				json.j3m_verified = '<span class="verify_unknown">unverified</span>';
			break;
		}

		switch (json.media_verified) {
			case 'passed':
				json.media_verified = '<span class="verify_passed">passed (the pixelhash check matched j3m data signature)</span>';
			break;
			case 'failed':
				json.media_verified = '<span class="verify_failed">failed</span>';
			break;
			case 'unverified':
			default:
				json.media_verified = '<span class="verify_unknown">unverified</span>';
			break;
		}

		var html = Mustache.to_html(this.template, json);
		this.$el.html(html);
		return this;
	},
});