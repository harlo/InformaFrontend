import re, json, os, sys, yaml, gzip, cStringIO
from base64 import b64encode
import xml.etree.ElementTree as ET

def gzipAsset(path_to_file):
	_out = cStringIO.StringIO()
	_in = open(path_to_file)
	
	z = gzip.GzipFile(fileobj=_out, mode='w')
	z.write(_in.read())
	
	z.close()
	_in.close()
	
	return _out.getvalue()

def initForms(forms_root):
	jr_sentinel = "jr:itext('"
	parse = {"forms" : []}
	forms = []
	
	for root, dir, files in os.walk(forms_root):
		for file in files:
			forms.append(os.path.join(root, file))

	for form in forms:
		xmldoc = ET.parse(form)
		root = xmldoc.getroot()
		translation = None
	
		mapping = {
			"mapping" : [],
			"audio_form_data" : []
		}
	
		# actual text mapping for objects is in the head (root[0]) at head.model.itext.translation
		for el in root[0][1]:
			if re.match(r'{.*}itext', el.tag):
				translation = el[0]
	
		# bindings are described in body (root[1]) at body
		for model_item in root[1]:
			map = None
			# if tag is select, select1, or upload
			if re.match(r'{.*}(select|select1)', model_item.tag):
				# get the binding by drilling down
				map = {}
				tag = model_item.attrib['bind']
				bindings = []
				for mi in model_item:
					if re.match(r'{.*}item', mi.tag):
						key = None
						value = None
						for kvp in mi:
							if re.match(r'{.*}label', kvp.tag):
								key = kvp.attrib['ref'][len(jr_sentinel):-2]
							elif re.match(r'{.*}value', kvp.tag):
								value = kvp.text
								for t in translation:
									if key == t.attrib['id']:
										key = t[0].text
										break

						if key is not None and value is not None:
							bindings.append({ value : key })
				map[tag] = bindings
					
			elif re.match(r'{.*}upload', model_item.tag):
				mapping['audio_form_data'].append(model_item.attrib['bind'])
		
			if map is not None:
				mapping['mapping'].append(map)

		if len(mapping['mapping']) == 0:
			del mapping['mapping']
	
		if len(mapping['audio_form_data']) == 0:
			del mapping['audio_form_data']
			
		if len(mapping.keys()) != 0:
			# get the namespace for this form from head (root[0]) head.title
			for el in root[0]:
				if re.match(r'{.*}title', el.tag):
					mapping['namespace'] = el.text
					break
		
			parse['forms'].append(mapping)
			print mapping
	
	print parse
	m = open(os.path.join(forms_root, "forms.json"), 'wb+')
	m.write(json.dumps(parse))
	m.close()

def scrapeFingerprint(path):
	with open(path, 'rb') as f:
		fingerprint = re.findall(r'Key fingerprint =\s(.*)\suid.*', f.read())

		if len(fingerprint) != 1: return
		print "".join(fingerprint[0].split(" "))

def initICTD():
	conf_dir = "/home/unveillance/conf/"
	forms_root = "/home/unveillance/forms/"
	
	with open(os.path.join(conf_dir, "ictd.yaml"), 'rb') as i:
		ictd = yaml.load(i.read())
		ictd['publicKey'] = b64encode(gzipAsset(ictd['publicKey']))
		
		forms = []
		for f, form in enumerate(ictd['forms']):
			forms.append(b64encode(gzipAsset(os.path.join(forms_root, form))))
	
		del ictd['forms']
		ictd['forms'] = forms
		with open(os.path.join(conf_dir, "%s.ictd" % os.getenv('UV_UUID')), 'wb+') as ictd_file:
			ictd_file.write(json.dumps(ictd))