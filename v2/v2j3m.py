import tornado.web
from tornado import gen
from tornado.escape import json_decode, json_encode
from tornado.httpclient import AsyncHTTPClient
from conf import  DEBUG, buildServerURL
from operator import itemgetter
from tornado.concurrent import Future
from J3mCache import J3mCache
from xml.sax.saxutils import escape

html_escape_table = {
    '"': "&quot;",
    "'": "&apos;"
}
def html_escape(text):
    return escape(text, html_escape_table)

def json_html_escape(obj):
    for key, value in obj.iteritems():
        try:
            if len(value.keys()) > 0:
                obj[key] = json_html_escape(value)
        except Exception: 
            obj[key] = html_escape(value)
    return obj

@gen.coroutine
def getDocWrapper(self,param):
    doc = J3mCache.getWrapFromCache(param)
    if doc is None :
        
        url = "%s%s%s" % (buildServerURL(),"/documents/?_id=" ,param)
        if DEBUG: print str(self) +"SENDING REQUEST TO %s" % url
        http_client = AsyncHTTPClient()
        future = http_client.fetch(url) 
        if DEBUG: print str(self) +"got future" 
        J3mCache.putWrapInCache(param,future) 
        if DEBUG: print str(self) +"put in cache"
        response = yield future
        J3mCache.putWrapInCache(param,response)
        if DEBUG: print str(self) +"returning"
        raise gen.Return(response.body)   
    elif isinstance(doc, Future)  :
        if DEBUG: print str(self) +"is future"
        response = yield doc
        J3mCache.putWrapInCache(param,response)
        raise gen.Return(response.body) 
    else :
        if DEBUG: print str(self) +"got otherwise: " + str(doc)
        raise gen.Return(doc.body)    
        
        
   
    

@gen.coroutine
def getJ3mDoc(self,param):
    j3mDoc = J3mCache.getJ3mFromCache(param)
    if j3mDoc is None :
       
    
        handle = yield getDocWrapper(self,param)
        self.objectHandle = json_decode(handle)  
        if DEBUG: print self.objectHandle['data']['j3m_id']
                
        url = "%s%s%s%s%s" % (buildServerURL(),"/documents/?doc_type=ic_j3m&_id=" ,self.objectHandle['data']['j3m_id'], '&media_id=', self.objectHandle['data']['_id'])
        if DEBUG: print str(self) +"SENDING REQUEST TO %s" % url
        
        http_client = AsyncHTTPClient()
        future = http_client.fetch(url) 
        
        if DEBUG: print str(self) + "got j3m future" 
        J3mCache.putJ3mInCache(param,future) 
        if DEBUG: print str(self) + "put j3m in cache"
        response = yield future
        if DEBUG: print str(self) + "returning j3m"
        raise gen.Return(response.body)   
    elif isinstance(j3mDoc, Future)  :
        if DEBUG: print str(self) + "is j3mDoc future"
        response = yield j3mDoc
        J3mCache.putJ3mInCache(param,response)
        raise gen.Return(response.body) 
    else :
        if DEBUG: print str(self) +"got j3mDoc otherwise"
        raise gen.Return(j3mDoc.body)    
        
    

def getTimeValues(self,j3mDoc,valueKey):
    sensors = j3mDoc['data']['data']['sensorCapture']
    values=[]
    for element in sensors: 
        try: 
            value = {valueKey: element['sensorPlayback'][valueKey],"timestamp":element['timestamp']}
            values.insert(int(element['timestamp']),value)
        except KeyError: pass
    return sorted(values, key=itemgetter('timestamp'))
    


   
    
class J3MRetrieveHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                self.write(j3m)
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION (J3MRetrieveHandler)!', e
                
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
                print 'no Doc retrieved EXCEPTION (J3MHeaderHandler)!', e
                
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
                print 'no Doc retrieved EXCEPTION! (LightMeterHandler)', e
                
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
                print 'no Doc retrieved EXCEPTION! (pressureHPAOrMBARHandler)', e
                
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
                print 'no Doc retrieved EXCEPTION! (pressureAltitudeHandler)', e
                
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
                print 'no Doc retrieved EXCEPTION! (GPSBearingHandler)', e
                
            self.finish()
            self.flush()    

class GPSCoordsHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                vals = getTimeValues(self,j3mDoc,"gps_coords")
                for element in vals:
                    element['gps_long'] = element['gps_coords'][0]
                    element['gps_lat'] = element['gps_coords'][1]
                    del element['gps_coords']
                self.write(json_encode(vals))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION! (GPSCoordsHandler)', e
                
            self.finish()
            self.flush()    

class GPSAccuracyHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                self.write(json_encode(getTimeValues(self,j3mDoc,"gps_accuracy")))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION! (GPSAccuracyHandler)', e
                
            self.finish()
            self.flush()  
              
class AppendedUserDataHandler (tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                values=[]
                try: 
                    for element in j3mDoc['data']['data']['userAppendedData']: 
                        for form in element['associatedForms']:
                            values.append(json_html_escape(form))
                except KeyError: pass
                
                self.write(json_encode(values))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION! (AppendedUserDataHandler)', e
                
            self.finish()
            self.flush()    

class VisibleWifiNetworksHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self,param):
        try:
            j3m = yield getJ3mDoc(self,param)
            j3mDoc = json_decode(j3m)
            sensors = j3mDoc['data']['data']['sensorCapture']
            values=[]
            for element in sensors: 
                try:
                    for wifi in element['sensorPlayback']['visibleWifiNetworks']:
                        wifi['timestamp'] = element['timestamp']
                        values.insert(int(element['timestamp']),wifi)
                except KeyError: pass    
            self.write(json_encode(sorted(values, key=itemgetter('timestamp'))))
                
        except Exception, e:
            self.write('No Document found')  
            print 'no Doc retrieved EXCEPTION (VisibleWifiNetworksHandler)!', e
                
        self.finish()
        self.flush() 
        
class DocumentWrapperHandler (tornado.web.RequestHandler):
    @gen.coroutine
    def get(self,param):
        try:
            handle = yield getDocWrapper(self,param)
            self.write(handle)  
                 
        except Exception, e:
            self.write('No Document found')  
            print 'no Doc retrieved EXCEPTION! (DocumentWrapperHandler)', e
                
        self.finish()
        self.flush()   

class AccelerometerHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                
                sensors = j3mDoc['data']['data']['sensorCapture']
                values=[]
                for element in sensors: 
                    try:
                        value = {"acc_x":element['sensorPlayback']['acc_x']}
                        value['acc_y'] = element['sensorPlayback']['acc_y']
                        value['acc_z'] = element['sensorPlayback']['acc_z']
                        value['timestamp'] = element['timestamp']
                        
                        values.insert(int(element['timestamp']),value)
                    except KeyError: pass
                self.write(json_encode(sorted(values, key=itemgetter('timestamp'))))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION! (AccelerometerHandler)', e
                
            self.finish()
            self.flush()  
            
class PitchRollAzimuthHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                   
                sensors = j3mDoc['data']['data']['sensorCapture']
                values=[]
                for element in sensors: 
                    try:
                        value = {"azimuth":element['sensorPlayback']['azimuth']}
                        value['pitch'] = element['sensorPlayback']['pitch']
                        value['roll'] = element['sensorPlayback']['roll']
                        try:
                            value['azimuthCorrected'] = element['sensorPlayback']['azimuthCorrected']
                            value['pitchCorrected'] = element['sensorPlayback']['pitchCorrected']
                            value['rollCorrected'] = element['sensorPlayback']['rollCorrected']
                        except KeyError: pass
                        value['timestamp'] = element['timestamp']
                        
                        values.insert(int(element['timestamp']),value)
                    except KeyError: pass
                self.write(json_encode(sorted(values, key=itemgetter('timestamp'))))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION! (PitchRollAzimuthHandler)', e
                
            self.finish()
            self.flush()  