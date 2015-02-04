var app = app || {};//global Backbone

app.InformaCamJ3MHeaderView = Backbone.View.extend({
	el: '#ic_j3mheader_view_holder',
	template: getTemplate("j3m_header.html"),
	render: function() {
		json = this.model.toJSON().data;
		json.URL = document.URL;
		json.genealogy.dateFormatted = moment(Number(json.genealogy.dateCreated)).format("MM/DD/YYYY HH:mm:ss");
		html = Mustache.to_html(this.template, json);
		$('#ic_header_view_holder').addClass("rendered");
		this.$el.html(html);
		$('#submission_permalink').click(function() {
			this.select();
		});
		return this;
	},
});
