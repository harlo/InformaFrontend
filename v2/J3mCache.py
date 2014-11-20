from conf import  DEBUG
from collections import OrderedDict
import time
from tornado.concurrent import Future

class J3mCache:
    cachedJ3m = OrderedDict()
    cachedWrap = OrderedDict()
    cacheMaxSize = 4 #TODO move to a conf file somewhere?
    
    
    @classmethod
    def getJ3mFromCache (cls, key):
        if DEBUG: print str(time.time()) + " about to get, j3m cache" + str(len(cls.cachedJ3m))
        if key not in cls.cachedJ3m :
            return None;
        else:
            return cls.cachedJ3m[key]
            
    @classmethod
    def getWrapFromCache (cls, key):
        if DEBUG: print str(time.time()) + " about to get, wrap cache" + str(len(cls.cachedWrap))
        if key not in cls.cachedWrap :
            return None;
        else:
            return cls.cachedWrap[key]
    
        
    @classmethod
    def putJ3mInCache (cls, key, doc):
        if (key in cls.cachedJ3m) and isinstance(cls.cachedJ3m[key], Future) and isinstance(doc, Future) : 
            if DEBUG: print "don't replace a future, man"
        else:
            if DEBUG: print str(time.time()) + " about to put, j3m cache" + str(len(cls.cachedJ3m))
            if len(cls.cachedJ3m) == cls.cacheMaxSize:
                cls.cachedJ3m.popitem(last=False)
            cls.cachedJ3m[key] = doc
            
    @classmethod
    def putWrapInCache (cls, key, doc):
        if (key in cls.cachedWrap) and isinstance(cls.cachedWrap[key], Future) and isinstance(doc, Future) : 
            if DEBUG: print "don't replace a future, man"
        else:        
            if DEBUG: print str(time.time()) + "about to put, wrap cache" + str(len(cls.cachedWrap))
            if len(cls.cachedWrap) == cls.cacheMaxSize:
                cls.cachedWrap.popitem(last=False)
            cls.cachedWrap[key] = doc
    