var submission;

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
		new UVIndentedTree({
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
		var id = item.label.replace(/ /g, "").replace(/,/g, "").toLowerCase();
		
		$($(info_holder).find(".ic_j3m_info_vizualization")[0])
			.attr({
				'id' : id
			});
		$("#ic_j3m_info_holder").append(info_holder);
		
		item.viz = item.build("#" + id);
	});
}

function initSubmission() {	
	var _id = location.search.split('_id=')[1];
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
									submission.set({ j3m : new InformaCamJ3M(j3m.data) });
									insertTemplate("submission_extended.html",
										submission.toJSON(), 
										"#ic_submission_extended",
										function() {
											submission.get('j3m').build();
											_.each(
												submission.get('j3m').j3m_info,
												setJ3MInfo
											);
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