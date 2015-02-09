var app = app || {};//global Backbone

app.InformaCamDocumentWrapperView = Backbone.View.extend({
	el: '#ic_documentwrapper_view_holder',
	template: getTemplate("document_wrapper.html"),
	render: function() {
		var json = this.model.toJSON().data;
		if (json.j3m_verified === undefined) {
			json.j3m_verified = '<span class="verify_unknown">unverified</span>';
		} else {
			json.j3m_verified = json.j3m_verified ? '<span class="verify_passed">passed (j3m data was signed, and the signature verified good)</span>' : '<span class="verify_failed">failed</span>';
		}
		
		if (json.media_verified === undefined) {
			json.media_verified = '<span class="verify_unknown">unverified';
		} else {
			json.media_verified = json.media_verified ? '<span class="verify_passed">passed (the pixelhash check matched j3m data signature)</span>' : '<span class="verify_failed">failed</span>';
		}
		var html = Mustache.to_html(this.template, json);
		this.$el.html(html);
		return this;
	},
});