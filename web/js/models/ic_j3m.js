var app = app || {};//global Backbone

jQuery(document).ready(function($) {
app.InformaCamJ3M = Backbone.Model.extend({
	constructor: function() {
		Backbone.Model.apply(this, arguments);
		var header = new app.InformaCamJ3MHeader({id: this.get("media_id")});
		header.fetch({
			success:function(header) {
				console.log(header.toJSON());
			}
		});
		this.set("header", header);
	},
	getHeader: function() {
/*
		var headerData = doInnerAjax("j3mheader/" + this.get("media_id"), "get", {}, null, false);
		if (headerData.result != 200) {
			console.error("headerData.result " + headerData.result);
			return false;
		}
		return headerData.data;
*/
	},
	
	getStrippedJ3M : function() {
		var strippedData = doInnerAjax("j3mretrieve/" + this.get("media_id"), "get", {}, null, false);
		if (strippedData.result != 200) {
			console.error("strippedData.result " + strippedData.result);
			return false;
		}
		return strippedData.data;
	},
	
	getLightMeterValues : function() {
		var lightMeterValues = doInnerAjax("lightMeter/" + this.get("media_id"), "get", {}, null, false);
		return {"lightmeter": lightMeterValues};
	},
});

app.InformaCamJ3MHeader = Backbone.Model.extend({
	urlRoot: '/j3mheader',
});

app.InformaCamJ3MHeaderView = Backbone.View.extend({
	template: getTemplate("j3m_header.html"),
	className: "doodoo",
    initialize: function() {
		this.model.fetch();
    },
    render: function() {
		html = Mustache.to_html(this.template, this.model.toJSON().data);
		this.$el.html(html);
		return this;
    },
});

app.InformaCamJ3MAppView = Backbone.View.extend({
	el: '#ic_submission_view_holder',
	initialize: function() {
		var headerView = new app.InformaCamJ3MHeaderView({
			model: new app.InformaCamJ3MHeader({
				id: gid
			})
		});
		this.listenTo(headerView.model, 'change', function() {
			this.$el.append(headerView.render().el);
		});
	},
});

var gid = /submission\/([a-z0-9]{32})\//.exec(window.location)[1];
new app.InformaCamJ3MAppView;

});
