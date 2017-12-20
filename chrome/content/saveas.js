if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.saveAs = 
	{
		url: null,
		name: "",
		selected: 0,
		target: null,

		init: function()
		{
			my.i18n.init();
			my.thePrefs.init("extensions.wicked.");
			my.theMessenger.init();	
			this.url  = dialog.mLauncher.source;
			this.name = dialog.mLauncher.suggestedFileName;
			this.target = my.CCSV("@mozilla.org/file/directory_service;1","nsIProperties").get("TmpD", my.Ci.nsIFile);
			this.target.append(this.name);
			this.isTorrent = (dialog.mLauncher.MIMEInfo.MIMEType == "application/x-bittorrent") || (this.name.lastIndexOf(".torrent") != -1);
			my.theMessenger.addListener( "xr-servers", this.loadServers );
			my.theMessenger.send( "xr-get-servers-query" );
			document.documentElement.addEventListener( "dialogaccept", my.saveAs.forceClose );

            document.getElementById('open').disabled = true;
            document.getElementById('openHandler').disabled = true;
            document.getElementById('save').disabled = true;
            document.getElementById('wickedSave').selected = true;

		},

		done: function()
		{
			my.theMessenger.done();
			document.documentElement.removeEventListener( "dialogaccept", my.saveAs.forceClose );
		},

		forceClose: function(evt)
		{
			if(net.wicked.seedbox.saveAs.IsDialogAccepted())
			{
				evt.preventDefault();
				document.documentElement.getButton('cancel').click();
			}
		},
		
		loadServers: function( servers )
		{
			my.theMessenger.removeListener( "xr-servers", my.saveAs.loadServers );
			var list = document.getElementById("wickedList");

			if(servers.length)
			{
				var length = 0, lengthIndex = 0;
				for(var i = 0; i < servers.length; i++)
				{
					var str = servers[i][3] ? servers[i][3] : (servers[i][0] + " (" + servers[i][4] + ")");
					if(length < str.length)
					{
						length = str.length;
						lengthIndex = i;
					}

					var item = document.createElement("menuitem");
					item.setAttribute("label", str);
					
					list.menupopup.appendChild(item);
				}

				document.getElementById("wickedcontainer").collapsed = !my.saveAs.isTorrent;
				document.getElementById("wickedSave").disabled = !my.saveAs.isTorrent;

				list.selectedIndex = lengthIndex;
				my.saveAs.sizeToContent();

				list.selectedIndex = 0;
			}
			else
			{
				document.getElementById("wickedcontainer").collapsed = true;
			}



            /*var wickedSave = document.getElementById('wickedSave');
            wickedSave.selected = true;*/

		},

		IsDialogAccepted: function()
		{
			document.getElementById("wickedcontainer").collapsed = false;
			if(document.getElementById("mode").selectedItem == document.getElementById("wickedSave"))
			{
				this.selected = document.getElementById("wickedList").selectedIndex;
				var persist = my.Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(my.Ci.nsIWebBrowserPersist);
				persist.persistFlags = my.Ci.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES | my.Ci.nsIWebBrowserPersist.PERSIST_FLAGS_CLEANUP_ON_FAILURE;
				persist.progressListener = 
				{
					onLocationChange: function() {},
					onSecurityChange: function() {},
					onProgressChange: function() {},
					onStatusChange:   function() {},

					onStateChange: function(aWebProgress, aRequest, aStatus, aMessage)
					{
						if( (aStatus & my.Ci.nsIWebProgressListener.STATE_STOP) && aRequest )
						{
							if(!Components.isSuccessCode(aStatus) ||
								(aRequest instanceof Components.interfaces.nsIHttpChannel && aRequest.responseStatus >= 400) ||
								!my.saveAs.target.exists())
							{
								if(my.thePrefs.getBool("messagedf"))
									alert(my.t("download_error"));
								return false;
							}
							my.theMessenger.send( "xr-save-as", 
							{
								url: my.saveAs.url,
								selected: my.saveAs.selected,
								name: my.saveAs.name,
							}, my.saveAs.target );
						}
					}
				};
				var nsILoadContext = null;
				try 
				{
					my.Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
					var wm = my.CCSV("@mozilla.org/appshell/window-mediator;1","nsIWindowMediator");
					var win = wm.getMostRecentWindow("navigator:browser");
					nsILoadContext = PrivateBrowsingUtils.getPrivacyContextFromWindow(win);
            			} catch(err) {}
				if( my.ffVersion < 36 )
					persist.saveURI(this.url, null, null, null, "", this.target, nsILoadContext);
				else
					persist.saveURI(this.url, null, null, null, null, "", this.target, nsILoadContext);
				return(true);
			}
			return(false);
		},

		sizeToContent: function()
		{
			try
			{
				window.sizeToContent();
			}
			catch(ex)
			{
				try
				{
					var btn = document.documentElement.getButton('accept');
					window.innerHeight = btn.boxObject.y + 10;
				} catch (ex) {}
			}
		}
	};

	window.addEventListener( "load", function() { my.saveAs.init(); }, false );
	window.addEventListener( "unload", my.saveAs.done, false);
	
	return(my);
})(net.wicked.seedbox || {});

