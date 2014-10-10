import tornado.web
from tornado import gen
from tornado.escape import json_decode, json_encode
from tornado.httpclient import AsyncHTTPClient
from conf import  DEBUG, buildServerURL
from operator import itemgetter

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

class GPSAccuracyHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            try:
                j3m = yield getJ3mDoc(self,param)
                j3mDoc = json_decode(j3m)
                self.write(json_encode(getTimeValues(self,j3mDoc,"gps_accuracy")))
                
            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
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
            print 'no Doc retrieved EXCEPTION!', e
                
        self.finish()
        self.flush() 
        
class DocumentWrapperHandler (tornado.web.RequestHandler):
    @gen.coroutine
    def get(self,param):
        try:
            http_client = AsyncHTTPClient()
            url = "%s%s%s" % (buildServerURL(),"/documents/?_id=" ,param)
            if DEBUG: print "SENDING REQUEST TO %s" % url
    
            response = yield http_client.fetch(url) 
            self.write(response.body)  
                 
        except Exception, e:
            self.write('No Document found')  
            print 'no Doc retrieved EXCEPTION!', e
                
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
                print 'no Doc retrieved EXCEPTION!', e
                
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
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()  