function doInnerAjax(url, method, data, callback) {
	$.ajax({
		url: "/" + url + "/",
		dataType: "json",
		data: data,
		method: method,
		success: callback
	});
}

function getTemplate(tmpl, on_complete) {
	var a_obj = {
		url : "/web/layout/tmpl/" + tmpl,
		method: "get",
		dataType: "html"
	};
	
	if(on_complete) { a_obj.complete = on_complete; }
	
	$.ajax(a_obj);
}

function insertTemplate(url, data, append_root, on_complete) {
	if(data == null) { data = {}; }
	var a_obj = {
		url : "/web/layout/tmpl/" + url,
		method: "get",
		dataType: "html",
		success: function(html) {
			$(append_root).html(Mustache.to_html(html, data));
		}
	};
	
	if(on_complete) { a_obj.complete = on_complete; }
	
	$.ajax(a_obj);
}

function removeEl() {
	console.info("removing a genereric element");
	console.info(this);
}

function doPost(endpoint, in_el, out_el) {
	if(in_el[0] != "#") {
		in_el = "#" + in_el;
	}
	
	if(out_el[0] != "#") {
		out_el = "#" + out_el;
	}
	
	console.info(endpoint);
	
	data = {}
	
	switch($(in_el).get(0).tagName.toLowerCase()) {
		case "textarea":
			data['input'] = $(in_el).val();
			break;
	}
	
	doInnerAjax(endpoint, "post", data, function(json) {
		console.info(json);
		console.info($(out_el));
		$(out_el).html(JSON.stringify(json));
	});
}