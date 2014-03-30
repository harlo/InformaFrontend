var informaCamAnnex = new InformaCamAnnex();

function initInformaCamAnnex() {
	annex.buildSteps.push(informaCamAnnex.buildOrganization);
	annex.buildSteps.push(informaCamAnnex.buildICTD);
}

$(document).ready(function() {
	
});