var InformaCamSubmission = UnveillanceDocument.extend({
	constructor: function(inflate) {
		UnveillanceDocument.prototype.constructor.apply(this, arguments);

		if(this.get('data').j3m_id) {
			try {
				var j3m = new InformaCamJ3M(doInnerAjax("documents", "post", {
					"_id" : this.get('data').j3m_id,
					"doc_type" : "ic_j3m"
				}, null, false).data);
			} catch(err) {
				console.warn(err);
				console.warn("Could not get j3m data for document " + this.get('data')._id);
				return;
			}

			this.set('j3m', j3m);
			console.info("J3M for document " + this.get('data')._id + " found.");
		} else { console.info("No J3M document " + this.get('data')._id); }
	}
});