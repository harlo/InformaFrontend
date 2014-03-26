var c_log;

function onMessageReceived(msg) {
	console.info(msg);
	
	doInnerAjax('run_script', 'post', JSON.stringify(msg), function(json) {
		console.info(json);
	});
}

$(document).ready(function() {
	c_log = new CompassRunLog();
});