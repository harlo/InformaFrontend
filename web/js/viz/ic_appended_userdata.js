var app = app || {};//global Backbone

app.InformaCamAppendedUserDataView = Backbone.View.extend({
	el: '#ic_appended_user_data',
	render: function() {
		this.$el.html('<h2>Appended User Data</h2>' + toHTML(this.model.attributes));
		return this;
	},
});
