var informaCamAnnex = new InformaCamAnnex();

function initInformaCamAnnex() {
	annex.buildSteps.push(informaCamAnnex.buildOrganization);
	annex.buildSteps.push(informaCamAnnex.buildICTD);
}

function onAnnexAvailable(msg) {
	initInformaCamAnnex();
}

function onFormLoaded(pos) {
	switch(Number(pos)) {
		case 2:
			console.info("form 2 loaded");
			discoverDropzones(
				{ url: ("/post_batch/" + annex.batch_root + "/") },
				"#uv_setup_view_holder"
			);
			
			break;
	}
}