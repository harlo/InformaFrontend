import tornado.web
import time
from tornado import gen
from tornado.escape import json_decode
from tornado.httpclient import AsyncHTTPClient
from conf import  DEBUG, buildServerURL


objectHandle = ""
j3mObject = ""

class J3MHeaderHandler(tornado.web.RequestHandler):
    
        @gen.coroutine
        def get(self,param):
            http_client = AsyncHTTPClient()
            url = "%s%s%s" % (buildServerURL(),"/documents/?_id=" ,param)
            if DEBUG: print "SENDING REQUEST TO %s" % url
            response = yield http_client.fetch(url)
            try:
                self.objectHandle = json_decode(response.body)
                if DEBUG: print self.objectHandle['data']['j3m_id']
                
                url = "%s%s%s%s%s" % (buildServerURL(),"/documents/?doc_type=ic_j3m&_id=" ,self.objectHandle['data']['j3m_id'], '&media_id=', self.objectHandle['data']['_id'])
                if DEBUG: print "SENDING REQUEST TO %s" % url
                self.j3mObject = yield http_client.fetch(url)
                j3mResponse = yield http_client.fetch(url)
                self.j3mObject = json_decode(j3mResponse.body)
                del self.j3mObject['data']['data']['sensorCapture']
                self.write(self.j3mObject)

            except Exception, e:
                self.write('No Document found')  
                print 'no Doc retrieved EXCEPTION!', e
                
            self.finish()
            self.flush()

class V2J3MVeiwerHandler(tornado.web.RequestHandler):
    
        
        @tornado.web.asynchronous
        def get(self,param):
            url = "%s%s%s" % (buildServerURL(),"/documents/?_id=" ,param)
            if DEBUG: print "SENDING REQUEST TO %s" % url
            http_client = AsyncHTTPClient()
            http_client.fetch(url, callback=self.on_doc_get)
            
        @tornado.web.asynchronous    
        def on_doc_get(self, result):
            try:
                self.objectHandle = json_decode(result.body)
                if DEBUG: print self.objectHandle['data']['j3m_id']
                self.writePart('j3m id ' + self.objectHandle['data']['j3m_id']) 
                self.flush()
                self.get_j3m()
            except Exception, e:
                self.write('No Document found') 
                self.flush()
                print 'no Doc retrieved EXCEPTION!', e
                self.finish()
            
        
        @tornado.web.asynchronous
        def get_j3m(self):
            url = "%s%s%s%s%s" % (buildServerURL(),"/documents/?doc_type=ic_j3m&_id=" ,self.objectHandle['data']['j3m_id'], '&media_id=', self.objectHandle['data']['_id'])
            if DEBUG: print "SENDING REQUEST TO %s" % url
            http_client = AsyncHTTPClient()
            http_client.fetch(url, callback=self.on_j3m_get)
 
              
        @tornado.web.asynchronous
        def on_j3m_get(self, result):
            try:
                self.j3mObject = json_decode(result.body)
                
                self.writePart(self.getTimeAdded(self.j3mObject))
                self.writePart(self.getTimeCreated(self.j3mObject))
                self.writePart(self.getUserData(self.j3mObject))
                
            except Exception, e:
                self.write('No J3m found') 
                print 'no Doc retrieved EXCEPTION!', e
                self.flush()
            self.finish()
       
        @tornado.web.asynchronous
        def getTimeAdded(self, j3m):
            return 'Date Added: ' + self.formatTimeStamp(j3m['data']['date_added'])
       
        @tornado.web.asynchronous
        def getTimeCreated(self, j3m):
            return 'Date Created: ' + self.formatTimeStamp(j3m['data']['genealogy']['dateCreated'])
        
        @tornado.web.asynchronous
        def getUserData(self, j3m):
            try:
                return 'User Data: ' + str(j3m['data']['data']['userAppendedData'][0]['associatedForms'][0])
            except Exception, e:
                print 'no User data found', e
        
        def formatTimeStamp(self, stamp):
            return time.strftime('%B %d %Y %H:%M:%S',  time.gmtime(float(stamp)/1000))
            
        def writePart(self, part):
            if DEBUG: print part
            self.write(part+ '<br>') 
            self.flush()
            
      
        @tornado.web.asynchronous
        def old_get(self,param):
            url = "%s%s%s" % (buildServerURL(),"/documents/?_id=" ,param)
            if DEBUG: print "SENDING REQUEST TO %s" % url
            resp = yield self.fetch_json(self, url)
            if DEBUG: print resp
            self.finish()
            
        
        
        @gen.coroutine
        def fetch_json(self, url):
            http_client = AsyncHTTPClient()
            response = yield http_client.fetch(url)
            if DEBUG: print response
            raise gen.Return(json_decode(response.body))
        