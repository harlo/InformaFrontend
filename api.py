class InformaAPI():
	def __init__(self):
		print "InformaAPI Started...??"
	
	def do_submissions():
		print "getting all submissions"
		
		return self.do__query({'type': 'submissions'})
	
	def do_submission(args):
		_id = args['_id']
		
		print "getting submission id %s" % _id
		
		return None
	
	def do_sources():
		print "getting all sources"
		
		return None
	
	def do_source(args):
		_id = args['_id']
		
		print "getting source id %s" % _id
		return self.get(_id)
	
	def do_query(args):
		doc_type = args['type']
		
		try:
			query = args['query']
		except KeyError as e: query = None
		
		print "querying type %s with args %s" % (doc_type, query)
		
		return None