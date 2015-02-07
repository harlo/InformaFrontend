var app = app || {};//global Backbone

jQuery(document).ready(function($) {

//http://stackoverflow.com/questions/6535948/nested-models-in-backbone-js-how-to-approach

	app.TSVHeaderDataRow = Backbone.Model.extend({
		initialize: function(options) {
			this.id = options.id;
			this.model.documentWrapper.set('id', this.id);
		},
		model: {
			documentWrapper: new app.InformaCamDocumentWrapper,
//			J3MHeader: new app.InformaCamJ3MHeader,
		},

		parse: function(response){
			for (var key in this.model) {
				var embeddedClass = this.model[key];
				var embeddedData = response[key];
				response[key] = new embeddedClass(embeddedData, {parse:true});
			}
			return response;
		}
	});
	
	
	app.InformaCamTSVDownloadView = Backbone.View.extend({
		el: '#xxx',
		initialize: function() {
			this.jimmy = new app.TSVHeaderDataRow({
				id: '385a36afc6c868b1b4f9144339622602'
			});

			this.jimmy.model.documentWrapper.fetch();
	
			this.listenTo(this.jimmy.model.documentWrapper, 'change', function() {
				$c('change');
			});
		},
	});
	
	new app.InformaCamTSVDownloadView;



});