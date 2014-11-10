import tornado.web
from tornado import gen
from tornado.escape import json_decode, json_encode
from tornado.httpclient import AsyncHTTPClient
from conf import  DEBUG, buildServerURL
from operator import itemgetter
from collections import OrderedDict

@gen.coroutine
def getDocWrapper(self,param):
    doc = J3mCache.getWrapFromCache(param)
    if doc is None :
        http_client = AsyncHTTPClient()
        url = "%s%s%s" % (buildServerURL(),"/documents/?_id=" ,param)
        if DEBUG: print "SENDING REQUEST TO %s" % url
    
        response = yield http_client.fetch(url)   
        doc = response.body
        J3mCache.putWrapInCache(param,doc)

    raise gen.Return(doc)     
    

@gen.coroutine
def getJ3mDoc(self,param):
    j3mDoc = J3mCache.getJ3mFromCache(param)
    if j3mDoc is None :
        http_client = AsyncHTTPClient()
    
        handle = yield getDocWrapper(self,param)
        self.objectHandle = json_decode(handle)  
        if DEBUG: print self.objectHandle['data']['j3m_id']
                
        url = "%s%s%s%s%s" % (buildServerURL(),"/documents/?doc_type=ic_j3m&_id=" ,self.objectHandle['data']['j3m_id'], '&media_id=', self.objectHandle['data']['_id'])
        if DEBUG: print "SENDING REQUEST TO %s" % url
        self.j3mObject = yield http_client.fetch(url)
        j3mResponse = yield http_client.fetch(url)
        
        j3mDoc = j3mResponse.body
        J3mCache.putJ3mInCache(param,j3mDoc)

    raise gen.Return(j3mDoc)
    

def getTimeValues(self,j3mDoc,valueKey):
    sensors = j3mDoc['data']['data']['sensorCapture']
    values=[]
    for element in sensors: 
        try: 
            value = {valueKey: element['sensorPlayback'][valueKey],"timestamp":element['timestamp']}
            values.insert(int(element['timestamp']),value)
        except KeyError: pass
    return sorted(values, key=itemgetter('timestamp'))
    

class J3mCache:
    
    cachedJ3m = OrderedDict()
    cachedWrap = OrderedDict()
    cacheMaxSize = 4 #TODO move to a conf file somewhere?
    
    @classmethod
    def getJ3mFromCache (cls, key):
        if DEBUG: print str(len(cls.cachedJ3m))
        if key not in cls.cachedJ3m :
            return None;
        else:
            return cls.cachedJ3m[key]
            
    @classmethod
    def getWrapFromCache (cls, key):
        if key not in cls.cachedWrap :
            return None;
        else:
            return cls.cachedWrap[key]
    
        
    @classmethod
    def putJ3mInCache (cls, key, doc):
        if DEBUG: print str(len(cls.cachedJ3m))
        if len(cls.cachedJ3m) == cls.cacheMaxSize:
            cls.cachedJ3m.popitem(last=False)
        cls.cachedJ3m[key] = doc
            
    @classmethod
    def putWrapInCache (cls, key, doc):
        if len(cls.cachedWrap) == cls.cacheMaxSize:
            cls.cachedWrap.popitem(last=False)
        cls.cachedWrap[key] = doc
    
   
    
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
                    element['gps_lat'] = element['gps_coords'][0]
                    element['gps_long'] = element['gps_coords'][1]
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