var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cm = Components.manager;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const nsIProtocolHandler = Ci.nsIProtocolHandler;

function magnetProtocol() 
{
}

magnetProtocol.prototype = 
{
	scheme: "magnet",
	defaultPort: -1,
	protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
		nsIProtocolHandler.URI_NOAUTH |
		nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

	newURI: function(aSpec, aOriginCharset, aBaseURI)
	{
		var uri = Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);
		uri.spec = aSpec;
		return( uri );
	},

	allowPort: function(aPort, aScheme) 
	{ 
		return( false );
	},

	newChannel: function(aURI)
	{
Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage('!!!!! new channel');		
		Cc["@mozilla.org/childprocessmessagemanager;1"].getService(Ci.nsIMessageSender).sendAsyncMessage("xr-magnet-clicked", {url: aUri.spec});
		var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		return( ios.newChannel("javascript:void()", null, null) );
  	},

  	createInstance: function(aOuter, aIID) 
  	{
  		(new magnetProtocol()).QueryInterface(aIID);
	},
	
	classDescription: "Magnet Protocol Handler",
	contractID: "@mozilla.org/network/protocol;1?namemagnet",
	classID: Components.ID('{a35ad4f8-ad3b-43b9-a2a2-2d9522b981ee}'),	
	QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIProtocolHandler])
};

var magnetProtocolFrame =
{
	init: function()
    	{
Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage('!!!!! init');		    	    	
		Cc["@mozilla.org/childprocessmessagemanager;1"].getService(Ci.nsIMessageListenerManager).addMessageListener("xr-register-magnet", this.message);
//		this.message(null);
    	},

	message: function(message)
    	{
		var registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
		var proto = magnetProtocol.prototype;
		registrar.registerFactory(proto.classID, proto.classDescription, proto.contractID, proto);
Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage('!!!!! message');		    			
    	}
};

magnetProtocolFrame.init();
