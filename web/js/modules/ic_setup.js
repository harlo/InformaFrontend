var informaCamAnnex = new InformaCamAnnex();

function onFormLoaded(pos) {
	switch(Number(pos)) {
		case 2:
			console.info("form 2 loaded");
			annex.buildSteps.push(informaCamAnnex.buildDefaults);
			discoverDropzones(
				{ url : "/post_batch/" + annex.batch_root + "/" }, 
				"#uv_setup_view_holder");			
			break;
		case 3:
			console.info("form 3 loaded");
			annex.buildSteps.push(informaCamAnnex.buildExtras);
			discoverDropzones(
				{ url: ("/post_batch/" + annex.batch_root + "/") },
				"#uv_setup_view_holder"
			);
			
			$("#ic_sync_chooser").change(function(e) {
				var sync_type = $("#ic_sync_chooser").children("option:selected")[0];
				if($(sync_type).val() != "null") {
					informaCamAnnex.setRepository($(sync_type).val());
					insertTemplate($(sync_type).val() + "_setup.html",
						null, "#ic_sync_cred_holder", function() {
							discoverDropzones(
								{ url: ("/post_batch/" + annex.batch_root + "/") },
								"#ic_sync_cred_holder");
						}
					);
				}
			});
	}
}

function onAnnexInited(res) {
	ic_user = new InformaCamUser(informaCamAnnex['informacam.config.admin.username'],
		annex['unveillance.local_remote.password']);
}