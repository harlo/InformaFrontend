var submission = null;

(function($) {
	var sub_sammy = $.sammy("#content", function() {
		this.get(/.*\#j3m/, function(context) {
			console.info("J3M");
		});
		
		this.get(/.*\#(json|csv|tsv|html)/, function(context) {
			var format = this.params.splat[0];
			console.info("DOWNLOAD AS " + format);
		});
	});
	
	$(function() {
		sub_sammy.run();
		initSubmission();
	});
})(jQuery);

function showJ3M() {
	var el = "#ic_j3m_readout_holder";
	if(toggleElement(el) && $(el).children().length == 0) {
		j3m_view = new UVIndentedTree({
			data : {
				'data' : submission.toJSON().j3m.data,
				'intent' : submission.toJSON().j3m.intent,
				'genealogy' : submission.toJSON().j3m.genealogy
			},
			root_el : el
		});
	}
}

function loadView() {
	var el = "#ic_media_holder";
	if(toggleElement(el) && $(el).children().length == 0) {
		var media;
		if(submission.get('mime_type') == "image/jpeg") {
			media = $(document.createElement('img'));
			media.attr({
				'src' : "/files/.data/" + submission.get('_id') + "/" + submission.getAssetsByTagName('low_res')[0].file_name
			});
		} else if(submission.get('mime_type') == "video/x-matroska") {
			media = $(document.createElement('video'));
		}
		
		if(media) {$(el).append(media);}
	}
}

function setJ3MInfo(item) {
	var info_holder = $(document.createElement("div"));
	insertTemplate("j3m_info.html", item, info_holder, function() {
		$($(info_holder).find(".ic_j3m_info_vizualization")[0]).attr({
			'id' : item.label.replace(/ /g, "").replace(/,/g, "").toLowerCase()
		});
		$("#ic_j3m_info_holder").append(info_holder);
		item.build();
	});
}

function buildChart(obj) {
	var id = ("#" + obj.label.replace(/ /g, "").replace(/,/g, "").toLowerCase());

	var w = $(window).width();
	var h = $(window).height() * 0.33;
	var pl = 0;
	var pt = h * 0.85;
	
	var x = d3.scale.linear().rangeRound([0, w]);
	var x_axis = d3.svg.axis().scale(x).orient("bottom");
	
	var y = d3.scale.linear().rangeRound([h, 0]);
	var y_axis = d3.svg.axis().scale(y).orient("left");
	
	var viz = d3.select(id);
	var svg = viz.append("svg:svg").attr({
			'width' : w,
			'height' : h,
			'class' : 'ic_viz'
	});
	
	svg.append("svg:g")
		.attr({
			'transform' : "translate(" + pl + "," + pt + ")",
			'class' : 'x_axis',
		})
		.call(x_axis);
			
	svg.append("svg:g")
		.attr({
			'transform' : "translate(" + (pl + 40) + "," + 0 + ")",
			'class' : 'y_axis'
		})
		.call(y_axis);
	
	return svg;
}

function initSubmission() {	
	_id = location.search.split('_id=')[1];
	doInnerAjax("documents", "post", { _id : _id }, function(json) {
		json = JSON.parse(json.responseText);
		
		if(json.result == 200) {
			submission = new InformaCamSubmission(json.data);
			
			insertTemplate("submission_single.html", submission.toJSON(),
				"#ic_submission_holder", function() {
					if(submission.has("j3m_id")) {
						doInnerAjax("documents", "post", 
							{ _id : submission.get("j3m_id") },
							function(j3m) {
								j3m = JSON.parse(j3m.responseText);
								if(j3m.result == 200) {
									submission.set({ j3m : j3m.data });
									insertTemplate("submission_extended.html",
										submission.toJSON(), 
										"#ic_submission_extended",
										function() {
											submission.buildJ3M();
											_.each(submission.j3m_info, setJ3MInfo);
										}
									);
								}
							}
						);
						
						return;
					}
					
					$("#ic_submission_extended").html("This submission has no J3M");
				}
			);
		}
	});
}