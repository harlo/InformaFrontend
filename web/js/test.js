var assets = [{"assets": [{"file_name": "sample_split.pdf.orig", "description": "Original document copied to Dropbox", "tags": "original_document"}, {"file_name": "extracted_text.txt", "description": "Text extracted from PDF from embedded text objects. (Not OCR; please reference \"ocr_text.txt\" if available for OCR'ed result.)", "tags": ["embedded_text", "prefered_text"]}, {"file_name": "bag_of_words.txt", "description": "bag of words", "tags": "bag_of_words"}, {"file_name": "key_words_gensim.txt", "description": "keywords, as list, and parsable by gensim", "tags": "keywords"}, {"file_name": "gensim.dict", "description": "gensim dictionary for document"}, {"file_name": "corpus.mm", "description": "Market Matrix (sparse vector)"}, {"file_name": "corpus.lda-c", "description": "Blei (sparse vector)"}, {"file_name": "corpus.low", "description": "Gibbs LDA++ (sparse vector)"}, {"file_name": "corpus.svmlight", "description": "Joachim (sparse vector)"}, {"file_name": "model.lsi", "description": "LSI model for document"}, {"file_name": "model.lda", "description": "LDA model for document"}], "file_name": "sample_split.pdf", "base_path": "/.compass/data/551e25b12e04e93e5bf71b4668b0abfd", "date_inserted": 1393017550305.321, "file": "sample_split.pdf", "owner": "474ecf6a3cf083626040fd21ddd2b3c9", "_id": "551e25b12e04e93e5bf71b4668b0abfd", "mime_type": "application/pdf"}, {"assets": [{"object_map": {"two": "fish", "one": "fish"}, "file_name": "script.py.txt", "description": "A user-added script", "annotations": {"alias": "Hello World?", "notes": "This script should print \"AYO TECHNOLOGY TO THE CONSOLE?\""}}], "base_path": "/.compass/data/e6bb2edad270ea5a04f750993464df67", "date_inserted": 1392916711647.54, "file": "e6bb2edad270ea5a04f750993464df67/c_script", "owner": "474ecf6a3cf083626040fd21ddd2b3c9", "_id": "e6bb2edad270ea5a04f750993464df67"}];

function setDummyData() {
	console.info(assets.length);
	compass_documents.addDocuments(assets, false, false);
	
	var flt = function(doc) {
		return true;
	};
	
	compass_documents.resort([flt], "assets");
	compass_documents.redraw();
}