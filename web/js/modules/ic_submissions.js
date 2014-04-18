$(document).ready(function() {
	var sub_query = { mime_type : "image\/jpeg, video\/x-matroska" };
	
	doInnerAjax("documents", "post", sub_query, function(json) {
		json = JSON.parse(json.responseText);
		if(json.result == 200) {
			insertTemplate("submissions_list.html", json.data.documents,
				"#ic_submissions_holder", null);
		}
	});
});