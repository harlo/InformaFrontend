function receiver(event) {	
	if(event.origin !== "http://localhost:" + API_PORT) {
		console.info("wrong HOST : " + event.origin);
		return; 
	}
	
	onMessageReceived(event.data);
}

$(document).ready(function() {
	if(window.addEventListener) { addEventListener("message", receiver, false); }
	else { attachEvent("onmessage", receiver); }
});