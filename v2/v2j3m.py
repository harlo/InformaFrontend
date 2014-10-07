import tornado.web
from tornado import gen
from tornado.escape import json_decode, json_encode
from tornado.httpclient import AsyncHTTPClient
from conf import  DEBUG, buildServerURL

@gen.coroutine
def getJ3mDoc(self,param):
    http_client = AsyncHTTPClient()
    url = "%s%s%s" % (buildServerURL(),"/documents/?_id=" ,param)
    if DEBUG: print "SENDING REQUEST TO %s" % url
    
    response = yield http_client.fetch(url)        

    self.objectHandle = json_decode(response.body)
    if DEBUG: print self.objectHandle['data']['j3m_id']
                
    url = "%s%s%s%s%s" % (buildServerURL(),"/documents/?doc_type=ic_j3m&_id=" ,self.objectHandle['data']['j3m_id'], '&media_id=', self.objectHandle['data']['_id'])
    if DEBUG: print "SENDING REQUEST TO %s" % url
    self.j3mObject = yield http_client.fetch(url)
    j3mResponse = yield http_client.fetch(url)
    raise gen.Return(j3mResponse.body)

def getTimeValues(self,j3mDoc,valueKey):
    sensors = j3mDoc['data']['data']['sensorCapture']
    values=[]
    for element in sensors: 
        try: 
            value = {valueKey: element['sensorPlayback'][valueKey],"timestamp":element['timestamp']}
            values.insert(element['timestamp'],value)
        except KeyError: pass
    return values
    

class J3MRetrieveHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                self.write(j3m)
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()
            
class J3MHeaderHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                del j3mDoc['data']['data']['sensorCapture']
                self.write(j3mDoc)
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()
    
    
class LightMeterHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                self.write(json_encode(getTimeValues(self,j3mDoc,"lightMeterValue")))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()    
            
class pressureHPAOrMBARHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                self.write(json_encode(getTimeValues(self,j3mDoc,"pressureHPAOrMBAR")))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()    

class pressureAltitudeHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                self.write(json_encode(getTimeValues(self,j3mDoc,"pressureAltitude")))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()    

class GPSBearingHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                self.write(json_encode(getTimeValues(self,j3mDoc,"gps_bearing")))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()    

class GPSCoordsHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                self.write(json_encode(getTimeValues(self,j3mDoc,"gps_coords")))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()    
