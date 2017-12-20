if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.Cc = Components.classes;
        my.Ci = Components.interfaces;
        my.Cr = Components.results;
        my.Cu = Components.utils;

	my.CCSV = function(cName, ifaceName)
	{
		if(my.Cc[cName])
			return(my.Cc[cName].getService(my.Ci[ifaceName]));
        };

        my.ffVersion = parseFloat(my.CCSV("@mozilla.org/xre/app-info;1","nsIXULAppInfo").version);

	my.log = function(message) 
	{
		my.CCSV("@mozilla.org/consoleservice;1","nsIConsoleService").logStringMessage('Wicked: '+JSON.stringify(message));
	};        
        
        my.theMessenger = 
	{
		service : null,
		callbacks: {},

		init: function()
		{
			this.service = my.CCSV("@mozilla.org/observer-service;1","nsIObserverService");
		},
	
		done: function()
		{
			for( var id in this.callbacks )
				this.service.removeObserver(this, id, false);
		},

		observe: function(request, id, data)
		{
			if(typeof my.theMessenger.callbacks[id] !== "undefined")
			{
				try { data = JSON.parse( data ) } catch(e) {};
				var callbacks = my.theMessenger.callbacks[id];
				for( var i=0; i<callbacks.length; )
				{
					var callback = callbacks[i];
					if(!callback(data,request))
					{
						if(my.theMessenger.removeListener( id, callback ))
							break;
					}
					else
						i++;
				}
			}
		},

		addListener: function( id, callback )
		{
			if(typeof this.callbacks[id] === "undefined") 
			{
				this.callbacks[id] = [];
				this.service.addObserver(this, id, false);
			}
			this.callbacks[id].push(callback);
		},

		removeListener: function( id, callback )
		{
			if(typeof this.callbacks[id] !== "undefined")
			{
				var ndx = this.callbacks[id].indexOf(callback);
				if(ndx>=0)
				{
					this.callbacks[id].splice(ndx,1);
					if(!this.callbacks[id].length)
					{
						delete this.callbacks[id];
						this.service.removeObserver(this, id, false);
						return(true);
					}
				}
			}
		},

		send: function( id, data, request )
		{
			this.service.notifyObservers( request, id, JSON.stringify( data ) );	
		}
	};

	my.theNotifications = 
        {
		list: [],
		MAX_NOTIES_IN_QUEUE: 15,
		iconURL: null,

		init: function( iconURL )
		{
			this.iconURL = iconURL;
			this.noties = setInterval( function()
			{
				my.theNotifications.show();
			}, 1000);
		},

		done: function()
		{
			clearInterval(this.noties);
		},

		show: function()
		{
			if( this.list.length )
			{
				var notification = this.list.shift();
				var n = new Notification( notification.title, { icon: this.iconURL, body: notification.message })
				if(notification.promo)
					n.onclick = my.extension.onPromoClick;
				else
				if(notification.url)
					n.onclick = function()
					{
						my.extension.showURL( notification.url );
					}
			}
		},

		add: function( title, message, url, promo )
		{
			if(my.extension)
			{
				while( this.list.length > this.MAX_NOTIES_IN_QUEUE )
					this.list.shift();
				this.list.push( { "title": title, "message": message, "url": url, "promo": promo } );
			}
			else
			{
				my.CCSV("@mozilla.org/embedcomp/prompt-service;1","nsIPromptService").alert(null, title, message);
			}				
		}
        };

	my.thePrefs = 
	{
		branch: null,

		init: function(prefix)
		{
			this.branch = my.CCSV("@mozilla.org/preferences-service;1","nsIPrefService").getBranch(prefix);
		},

		has : function(key)
		{
			return(this.branch.prefHasUserValue(key));
		},

		getInt : function(key)
		{
			return( this.branch.getIntPref(key) );
	    	},

		putInt : function(key,value) 
		{
        		this.branch.setIntPref(key, value || 0);
		},

		getBool : function(key)
		{
			return( this.branch.getBoolPref(key) );
	    	},
	    	
		putBool : function(key,value) 
		{
        		this.branch.setBoolPref(key, value);
		},

		getString : function(key)
		{
			return( this.branch.getCharPref(key) );
	    	},

		putString : function(key,value) 
		{
        		this.branch.setCharPref(key, value || "");
		},

		getObject : function(key,def)
		{
			var obj = def;
			if( this.has(key) )
			{
				var str = this.branch.getCharPref(key);
				try { obj = JSON.parse(str) } catch(e) { obj = def; }
			}
			return(obj);
	    	},

		putObject : function(key,value)
		{
			this.putString( key, JSON.stringify(value) );
	    	},

		remove : function(key) 
		{
        		this.branch.clearUserPref(key);
	    	}
	};
	
	my.notify = function(theme, text, url)
	{
		theme = my.t(theme) || theme;
		text = my.t(text) || text;	
		my.log( theme+": "+text );
		my.theNotifications.add(theme,text,url)
	};

	my.addslash = function(s)
	{
		return((s.length && s[s.length-1]!='/') ? s+'/' : s);
	};

	my.fullpath = function(s)
	{
		var arr = s.split('/');
		var ret = [];
		for( var i=0; i<arr.length; i++ )
		{
			if(arr[i]=='' || arr[i]=='.') continue;
			if(arr[i]=='..')
				ret.pop();
			else
				ret.push(arr[i]);
		}
		return(ret.join('/'));
	};

	my.normalize = function(dir)
	{
		return(my.addslash(my.fullpath(dir)));
	};

	my.wicked_badCertListener = function() {};

	my.wicked_badCertListener.prototype =
	{
		getInterface: function (aIID)
		{
			return this.QueryInterface(aIID);
		},

		QueryInterface: function(aIID)
		{
			if(aIID.equals(my.Ci.nsIAuthPrompt)         ||
			   aIID.equals(my.Ci.nsIAuthPromptProvider) ||
			   aIID.equals(my.Ci.nsIBadCertListener2)   ||
			   aIID.equals(my.Ci.nsIInterfaceRequestor) ||
			   aIID.equals(my.Ci.nsISupports))
				return this;
			throw my.Cr.NS_ERROR_NO_INTERFACE;
		},

		notifyCertProblem: function(socketInfo, sslStatus, targetHost)
		{
			var gSSLStatus = sslStatus;
			var gCert = sslStatus.QueryInterface(my.Ci.nsISSLStatus).serverCert;

			var fus = my.CCSV("@mozilla.org/docshell/urifixup;1","nsIURIFixup");
			var uri = fus.createFixupURI(targetHost, 0);

			if(uri.scheme == "http")
				uri.scheme = "https";

			if (uri.port == -1)
				uri.port = 443;

			var overrideService = my.CCSV("@mozilla.org/security/certoverride;1","nsICertOverrideService");
			var flags = 0;

			if(gSSLStatus.isUntrusted)
				flags |= overrideService.ERROR_UNTRUSTED;

			if(gSSLStatus.isDomainMismatch)
				flags |= overrideService.ERROR_MISMATCH;

			if(gSSLStatus.isNotValidAtThisTime)
				flags |= overrideService.ERROR_TIME;

			overrideService.rememberValidityOverride(uri.asciiHost, uri.port, gCert, flags, true);

			return true; // suppress error UI
		},

		getAuthPrompt: function(aPromptReason, aIID)
		{
			throw my.Cr.NS_ERROR_NOT_AVAILABLE;
		},

		prompt: function()
		{
			return false;
		},

		promptUsernameAndPassword: function()
		{
			return false;
		},

		promptPassword: function()
		{
			return false;
		}
	};

	my.ajax = function(options)
	{
		var req = new XMLHttpRequest();
		var self = this;
		req.open(options.method || 'GET', options.url, true, options.user || null, options.password || null);
		req.channel.notificationCallbacks = new my.wicked_badCertListener();
		if(options.headers)
			for( var hdr in options.headers )
				req.setRequestHeader(hdr, options.headers[hdr]);
		if(options.mimeType)
			req.overrideMimeType(options.mimeType);
		if(options.ifModifiedSince)
			req.setRequestHeader("If-Modified-Since", options.ifModifiedSince);			
		var timer = setTimeout(function()
		{
			timer = null;
			req.abort();
			delete req;
			if( options.passErrors )
			{
				if( options.error )
					options.error( -1, null, options.base );
			}
			else
			{				
				if(my.thePrefs.getBool("messagest"))
					my.notify("error",my.t("request_failed")+my.t("timeout_reached"),options.base);
			}					
			if(options.complete)
				options.complete( -1 );
		}, my.thePrefs.getInt("timeout") * 1000);			
		req.onreadystatechange = function()
		{
			if(timer && (req.readyState == 4))
			{
				clearTimeout(timer);
				switch(req.status)
				{
					case 200:
					{
					        if( options.success )
					        {
							var ret = null;
							try{ ret = JSON.parse(req.response); } catch(e) {};
							options.success( ret, req, options.base );
						}
						break;
       		            		}
					case 0:
       	            			{
       	            				if( !options.passErrors )
       	            				{
							if(my.thePrefs.getBool("messagesf"))
								my.notify("error",my.t("request_failed")+my.t("server_unreacheable"), options.base);
							break;
						}							
					}       		            		
       	        	    		case 401:
       	            			{
       	            				if( !options.passErrors )
       	            				{
							if(my.thePrefs.getBool("messagesf"))
								my.notify("error",my.t("request_failed")+my.t("bad_credentials"), options.base);
							break;
						}							
					}
					default:
					{
						if( options.error )
							options.error( req.status, req.responseText, options.base );
						break;								
					}
				}
				if(options.complete)
					options.complete( req.status, req.responseText );
			}
		};
		req.send( options.data || null );
	};

	my.getHost = function( url )
	{
		var arr = url.match(new RegExp('^http(?:s)?\://([^/:]+)', 'im'));
		return( (arr && (arr.length>1)) ? arr[1].toString().toLowerCase() : '' );
	};

	my.trim = function(str)
	{
		return(str.replace(/^\s+|\s+$/g, ''));
	};

	my.i18n = 
	{
		strings: {},

                getMessage: function( key )
                {
                	return( (typeof(this.strings[key]) == "undefined") ? '' : this.strings[key].message );
                },

		init: function( callback )
		{
			var req = new XMLHttpRequest();
			req.open("GET", "chrome://wicked/locale/messages.json", true);
			req.overrideMimeType("text/plain;charset=UTF-8");
      			req.onload = function() 
       			{
				var messagesText = req.responseText;
       				try { var messages = JSON.parse(messagesText); } catch (e) { var messages = {}; }
				for (var i in messages)
					my.i18n.strings[i] = messages[i];
				if(callback)	
					callback();
			};
 
			req.onerror = function() 
			{
				if(callback)			
					callback();
			};
 
			try 
			{ 
				req.send(null); 
			} catch (e) 
			{ 
				if(callback)
					callback(); 
			}
		}
	};

	my.t = function( key )
	{
		return(my.i18n.getMessage(key));
	};

	my.isXivikConfiguration = function( servers )
	{
		var ret = true;
		for( var i in servers )
		{
			var server = servers[i];
			if( my.getHost(server[0]).indexOf( my.conf.wickedDomain )<0 )
			{
				ret = false;
				break;
			}
		}
		return(ret);
	};

	my.bencode = function( file, success, error )
	{
		var i = 0;
		var text = '';
		var parser = function()
		{
			var c = text.charAt(i);
		        switch (c) 
		        {
				case 'i':
				{
			                var matches = text.slice(i).match(/^i(-?\d+)e/);
					if( !matches )
						break;
					i += matches[0].length;
					return Number(matches[1]);
				}					
				case 'l':
				{
					i++;
					var result = [];
					while ( i < text.length && text.charAt(i) != 'e' )
						result.push(parser());
					if( text.charAt(i) != 'e' )
						break;
					i++;
					return result;
				}					
				case 'd':
				{
					i++;
					var result = {};
					while ( i < text.length && text.charAt(i) != 'e' ) 
					{
						var k = parser();
						if(k=='info')
							return result;
						var v = parser();
						result[k] = v;
					}
					if ( text.charAt(i) != 'e' )
						break;
					i++;
					return result;
				}
				default:
				{
					var matches = text.slice(i).match(/^(\d+):/);
					if( !matches )
						break;
					var len = Number(matches[1]);
					var a = i + matches[0].length;
					var b = a + len;
					var result = '';
					if( len < 1024 )	// don't process large fields
					{
						result = text.slice(a, b);
						if( result.length != len )
							break;
					}							
					i = b;
					return result;
				}
			}
			throw new RangeError('Bencode.parse: Illegal at ' + i + ' (0x' + i.toString(16).toUpperCase() + ')');
		};

		var ios = my.CCSV("@mozilla.org/network/io-service;1", "nsIIOService");
		var fileURI = ios.newFileURI(file);
		var channel = ios.newChannelFromURI(fileURI);
		var observer = 
		{
			onStreamComplete : function(aLoader, aContext, aStatus, aLength, aResult)
			{
				try 
				{
					text = '';
					var ab = new Uint16Array(aResult);
					var abLen = ab.length;
					var CHUNK_SIZE = Math.pow(2, 16);
					for(var offset = 0; offset < abLen; offset += CHUNK_SIZE) 
					{
						var len = Math.min(CHUNK_SIZE, abLen-offset);
						var subab = ab.subarray(offset, offset+len);
						text += String.fromCharCode.apply(null, subab);
					}
					var ret = parser();
					var result = {};
					if( ret['announce'] )
						result['{TRACKER}'] = my.getHost(ret['announce']);
					else
					if( ret['announce-list'] && ret['announce-list'].length  && ret['announce-list'][0].length)
						result['{TRACKER}'] = my.getHost(ret['announce-list'][0][0]);
					if( ret['creation date'] )
						result['{CREATION}'] = (new Date(ret['creation date'] * 1000)).toISOString().substr(0,10);
					success(result);
				} catch(e)
				{
					my.log(e);
					error(e);
				}
			}
  		};
		var sl = my.Cc["@mozilla.org/network/stream-loader;1"].createInstance(Components.interfaces.nsIStreamLoader);
		sl.init(observer);
		channel.asyncOpen(sl, channel);
	};

	my.getResponseHeader = function(httpChannel,hdr)
	{
		var ret = null;
		try 
		{
			ret = httpChannel.getResponseHeader(hdr);
		} catch(err) 
		{
			ret = null;
		}
		return(ret);
	};

	return(my);
})(net.wicked.seedbox || {});