if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.options =
	{
		servers: [],

		loadData: function()
		{
			my.i18n.init( function()
			{
				my.thePrefs.init("extensions.wicked.");
				document.getElementById("context-capture").selectedIndex = my.thePrefs.getInt("capture");
				document.getElementById("progress-messageds").checked = my.thePrefs.getBool("messageds");
				document.getElementById("progress-messagedf").checked = my.thePrefs.getBool("messagedf");
				document.getElementById("progress-messageus").checked = my.thePrefs.getBool("messageus");
				document.getElementById("progress-messageuc").checked = my.thePrefs.getBool("messageuc");
				document.getElementById("progress-messageuf").checked = my.thePrefs.getBool("messageuf");
				document.getElementById("progress-messagesf").checked = my.thePrefs.getBool("messagesf");
				document.getElementById("progress-messagest").checked = my.thePrefs.getBool("messagest");
				document.getElementById("upload-nostart").checked = my.thePrefs.getBool("nostart");
				document.getElementById("upload-timeout").value = my.thePrefs.getInt("timeout");

				my.options.servers = [];

				var loginManager = my.CCSV("@mozilla.org/login-manager;1","nsILoginManager");
				for(var i = 0; i < 20; i++)
				{
					var index = i + 1;
					var host = my.thePrefs.getString("host-" + index);
					if(host.length)
					{
						var logins = loginManager.findLogins({}, "chrome://wicked/", null, "wicked-host-" + index);
						var server =
						[
							host,
							my.thePrefs.getString("user-" + index),
							(logins && logins[0]) ? logins[0].password : "",
							my.thePrefs.getString("desc-" + index),
							my.thePrefs.getString("client-" + index).replace("rtorrent", "rutorrent"),
							my.thePrefs.getInt("label_selection-" + index),
							my.thePrefs.getString("label-" + index),
							my.thePrefs.getInt("directory_selection-" + index),
							my.thePrefs.getString("directory-" + index)
						];
						my.options.servers.push(server);
						my.options.addRecord(server[0], server[1], server[4]);
					}
					else
						break;
				}

				if(my.isXivikConfiguration(my.options.servers))
				{
					document.getElementById("promos").checked =  my.thePrefs.getBool("promos");
					document.getElementById("promos").setAttribute("disabled", "false");
				}
				else
				{
					document.getElementById("promos").checked =  true;
					document.getElementById("promos").setAttribute("disabled", "true");
				}

				document.getElementById("wicked_profiles").selectedIndex = 0;
				document.getElementById("exportinfo").addEventListener( "click", function()
				{
					my.CCSV("@mozilla.org/embedcomp/prompt-service;1","nsIPromptService").alert(null,
						my.t("exporting_to_seedbox_title"), my.t("exporting_to_seedbox_desc") );
				}, false);

				my.options.checkSelection();
			});
		},

		unloadData: function()
		{
			my.thePrefs.putInt("capture", document.getElementById("context-capture").selectedIndex);
			my.thePrefs.putBool("messageds", document.getElementById("progress-messageds").checked);
			my.thePrefs.putBool("messagedf", document.getElementById("progress-messagedf").checked);
			my.thePrefs.putBool("messageus", document.getElementById("progress-messageus").checked);
			my.thePrefs.putBool("messageuc", document.getElementById("progress-messageuc").checked);
			my.thePrefs.putBool("messageuf", document.getElementById("progress-messageuf").checked);
			my.thePrefs.putBool("messagesf", document.getElementById("progress-messagesf").checked);
			my.thePrefs.putBool("messagest", document.getElementById("progress-messagest").checked);
			my.thePrefs.putBool("nostart", document.getElementById("upload-nostart").checked);
			my.thePrefs.putInt("timeout", parseInt(document.getElementById("upload-timeout").value));
			my.thePrefs.putBool("promos", my.isXivikConfiguration(my.options.servers) ? document.getElementById("promos").checked : true);

			var loginManager = my.CCSV("@mozilla.org/login-manager;1","nsILoginManager");
			var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", my.Ci.nsILoginInfo, "init");

			for(var i = 0; i < this.servers.length; i++)
			{
				var index = i + 1;
				var server = this.servers[i];
				my.thePrefs.putString("host-" + index, server[0]);
				my.thePrefs.putString("user-" + index, server[1]);

				var loginInfo = new nsLoginInfo("chrome://wicked/", null, "wicked-host-" + index, server[0], server[2], "", "");
				var logins = loginManager.findLogins({}, "chrome://wicked/", null, "wicked-host-" + index);

				if(server[2] && server[2].length)
				{
					if(logins && logins[0])
						loginManager.modifyLogin(logins[0], loginInfo);
					else
						loginManager.addLogin(loginInfo);
				}
				else
				{
					if(logins && logins[0])
						loginManager.removeLogin(logins[0]);
				}

				my.thePrefs.putString("desc-" + index, server[3]);
				my.thePrefs.putString("client-" + index, server[4]);
				my.thePrefs.putInt("label_selection-" + index, server[5]);
				my.thePrefs.putString("label-" + index, server[6]);
				my.thePrefs.putInt("directory_selection-" + index, server[7]);
				my.thePrefs.putString("directory-" + index, server[8]);
			}

			for(; i < 20; i++)
			{
				var index = i + 1;
				my.thePrefs.putString("host-" + index, "");
				my.thePrefs.putString("user-" + index, "");

				var logins = loginManager.findLogins({}, "chrome://wicked/", null, "wicked-host-" + index);
				if(logins && logins[0])
					loginManager.removeLogin(logins[0]);

				my.thePrefs.putString("desc-" + index, "");
				my.thePrefs.putString("client-" + index, "");
				my.thePrefs.putInt("label_selection-" + index, 0);
				my.thePrefs.putString("label-" + index, "");
				my.thePrefs.putInt("directory_selection-" + index, 0);
				my.thePrefs.putString("directory-" + index, "");
			}
			my.theMessenger.init();
			my.theMessenger.send("xr-reload-servers");
		},

		correctPromo: function()
		{
			if(my.isXivikConfiguration(my.options.servers))
			{
				document.getElementById("promos").setAttribute("disabled", "false");
			}
			else
			{
				document.getElementById("promos").checked =  true;
				document.getElementById("promos").setAttribute("disabled", "true");
			}
		},

		addServer: function()
		{
			if(this.servers.length >= 20)
				alert(my.t("max_seedbox_reached"));
			else
			{
				var list = document.getElementById("wicked_profiles");
				var entry = { action: "cancel", host: "", user: "", pass: "", description: "", client: "rutorrent 3.x" };
				window.openDialog('chrome://wicked/content/entry.xul', 'WickedServer', 'centerscreen=yes,resizable=yes,chrome=yes,modal=yes', entry);
				if(entry.action == "save")
				{
					this.servers.push([entry.host, entry.user, entry.pass, entry.description, entry.client,
						entry.label_selection, entry.label, entry.directory_selection, entry.directory ]);
                			list.selectItem( this.addRecord(entry.host, entry.user, entry.client) );
                			this.correctPromo();
				}
			}
		},

		editServer: function()
		{
			var list = document.getElementById("wicked_profiles");
			var index = list.selectedIndex;
			var server = this.servers[index];
			var entry =
			{
				action: "cancel",
				host: server[0],
				user: server[1],
				pass: server[2],
				description: server[3],
				client: server[4],
				label_selection: server[5],
				label: server[6],
				directory_selection: server[7],
				directory: server[8]
			};
			window.openDialog('chrome://wicked/content/entry.xul', 'WickedServer', 'centerscreen=yes,resizable=yes,chrome=yes,modal=yes', entry);
			if(entry.action == "save")
			{
				this.servers[index] = [ entry.host, entry.user, entry.pass, entry.description, entry.client,
					entry.label_selection, entry.label, entry.directory_selection, entry.directory ];
				list.selectItem( this.editRecord(index, entry.host, entry.user, entry.client) );
				this.correctPromo();
			}
		},

		testServer: function()
		{
			document.getElementById("wicked_test").disabled = true;
			var list = document.getElementById("wicked_profiles");
			var index = list.selectedIndex;
			var server = this.servers[index];

			my.ajax(
			{
				url: server[0],
				user: server[1],
				password: server[2],
				passErrors: true,
				complete: function()
				{
					document.getElementById("wicked_test").disabled = false;
				},
				success: function()
				{
					alert( my.t('test_passed') );
				},
				error: function( status )
				{
					var msg = my.t('test_failed');
					switch(status)
					{
						case 401:
						{
							msg += my.t('bad_credentials');
							break;
						}
						case 0:
						{
							msg += my.t('server_unreacheable');
							break;
						}
						case -1:
						{
							msg += my.t('timeout_reached');
							break;
						}
						default:
						{
							msg += my.t('servers_response') + status;
							break;
						}
					}
					alert(msg);
				}
			});
		},

		checkSelection: function()
		{
			var list = document.getElementById("wicked_profiles");
			var index = list.selectedIndex;
			document.getElementById("wicked_test").disabled =
				document.getElementById("wicked_remove").disabled =
				document.getElementById("wicked_edit").disabled =
				(index == -1);
			if(index == -1){
				//document.getElementById("wicked_sync").disabled = true;
			}
			else
			{
				var server = this.servers[index];
        //document.getElementById("wicked_sync").disabled = (server[4] !== "rutorrent 3.x");
			}
		},

		loginServer: function()
		{
			if( window.confirm(my.t('export_confirm')) )
			{
				document.getElementById("wicked_sync").disabled = true;
				var list = document.getElementById("wicked_profiles");
				var index = list.selectedIndex;
				var server = this.servers[index];
				var loginManager = my.CCSV("@mozilla.org/login-manager;1","nsILoginManager");

				var url = my.addslash(server[0]);
				my.ajax(
				{
					url: url+"plugins/loginmgr/action.php?mode=info",
					user: server[1],
					password: server[2],
					passErrors: true,
					error: function(status)
					{
						//document.getElementById("wicked_sync").disabled = false;
						alert( my.t("request_failed")+my.t("servers_response")+status );
					},
					success: function(obj)
					{
						var allLogins = loginManager.getAllLogins({});
						for(var i = 0; i < obj.length; i++)
						{
							if(obj[i].url)
							{
								for(var j = 0; j < allLogins.length; j++)
								{
									if(allLogins[j].hostname.toLowerCase() == obj[i].url.toLowerCase())
									{
										obj[i].login = allLogins[j].username;
										obj[i].password = allLogins[j].password;
										break;
									}
								}
							}
						}
						var ret = { logins: obj, action: "cancel" };
						window.openDialog('chrome://wicked/content/export.xul', 'WickedExport', 'centerscreen=yes,resizable=yes,chrome=yes,modal=yes', ret);

						if(ret.action == "export")
						{
							obj = ret.logins;
							var retString = [], logins = [];
							for(var i = 0; i < obj.length; i++)
							{
								if(obj[i].name && obj[i].name.length)
								{
									logins.push(obj[i].name);
									retString.push(obj[i].name + "_enabled=1");
									retString.push(obj[i].name + "_login=" + encodeURIComponent(obj[i].login));
									retString.push(obj[i].name + "_password=" + encodeURIComponent(obj[i].password));
								}
							}
							my.ajax(
							{
								url: url+"plugins/loginmgr/action.php?mode=set&"+retString.join('&'),
								user: server[1],
								password: server[2],
								success: function()
								{
									alert(my.t('export_success'));
								},
								complete: function()
								{
									//document.getElementById("wicked_sync").disabled = false;
								},
								error: function(status)
								{
									alert( my.t("request_failed")+my.t("servers_response")+status );
								}
							});
						}
					}
				});
			}
		},

		removeServer: function()
		{
			var list = document.getElementById("wicked_profiles");
			var index = list.selectedIndex;
			var server = this.servers[index];
			if(window.confirm(my.t('remove_confirm')))
			{
				this.servers.splice(index, 1);
				list.removeItemAt(index);
				list.selectItem(list.getItemAtIndex(0));
				this.correctPromo();
			}
		},

		addRecord: function(host, user, client)
		{
			var list = document.getElementById("wicked_profiles");
			var item = document.createElement('listitem');
			var cell1 = document.createElement('listcell');
			var cell2 = document.createElement('listcell');
			var cell3 = document.createElement('listcell');

			cell1.setAttribute('label', host);
			cell2.setAttribute('label', user);
			cell3.setAttribute('label', client);

			item.appendChild(cell1);
			item.appendChild(cell2);
			item.appendChild(cell3);
			list.appendChild(item);

			return(item);
		},

		editRecord: function(index, host, user, client)
		{
			var list = document.getElementById("wicked_profiles");
			var item = list.getItemAtIndex(index);

			item.childNodes[0].setAttribute('label', host);
			item.childNodes[1].setAttribute('label', user);
			item.childNodes[2].setAttribute('label', client);

			return(item);
		},

		wizard: function()
		{
			var wizard = { action: "cancel", host: "", user: "", pass: "", type: "" };

			window.openDialog('chrome://wicked/content/wizard.xul', 'WickedWizard', 'centerscreen=yes,resizable=yes,chrome=yes,modal=yes', wizard);

			if(wizard.action == "save")
			{
				switch(wizard.type)
				{
					case "Shared":
					case "Semidedicated":
					{
						var url = 'https://'+wizard.host+'/rtorrent';
						this.servers.push([url, wizard.user, wizard.pass, "", "rutorrent 3.x"]);
						document.getElementById("wicked_profiles").selectItem(this.addRecord(url, wizard.user, "rutorrent 3.x"));
						break;
					}
					case "Dedicated":
					{
						var url = 'https://'+wizard.host+'/rtorrent';
						this.servers.push([url, wizard.user, wizard.pass, "", "rutorrent 3.x"]);
						document.getElementById("wicked_profiles").selectItem(this.addRecord(url, wizard.user, "rutorrent 3.x"));

						url = 'http://'+wizard.host+':5010/gui';
						this.servers.push([url, wizard.user, wizard.pass, "", "utorrent"]);
						document.getElementById("wicked_profiles").selectItem(this.addRecord(url, wizard.user, "utorrent"));

						url = 'https://'+wizard.host+'/tfx';
						this.servers.push([url, wizard.user, wizard.pass, "", "torrentflux-b4rt"]);
						document.getElementById("wicked_profiles").selectItem(this.addRecord(url, wizard.user, "torrentflux-b4rt"));

						url = 'https://'+wizard.host+'/deluge';
						this.servers.push([url, wizard.user, wizard.pass, "", "deluge"]);
						document.getElementById("wicked_profiles").selectItem(this.addRecord(url, wizard.user, "deluge"));
						break;
					}
				}
				this.correctPromo();
			}
		}
	};

	return(my);
})(net.wicked.seedbox || {});
