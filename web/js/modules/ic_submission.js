var submission = null;

$(document).ready(function() {	
	_id = location.search.split('_id=')[1];
	doInnerAjax("documents", "post", { _id : _id }, function(json) {
		json = JSON.parse(json.responseText);
		if(json.result == 200) {
			insertTemplate("submission_single.html", json.data,
				"#ic_submission_holder", function() {
					submission = new InformaCamSubmission(json.data);
				});
		}
	});
});