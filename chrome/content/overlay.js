if (typeof(net) == "undefined") var net = {};
if (!net.wicked) net.wicked = {};
net.wicked.seedbox = (function (my) {
    my.extension =
        {
            id: "torrent_uploader@wicked.com",
            branch: null,
            servers: [],
            logins: {},
            lastURI: null,
            tries: 0,

            updateDataTimer: null,

            init: function () {
                my.i18n.init(function () {
                    my.thePrefs.init("extensions.wicked.");
                    my.extension.initToolbar();
                    my.theNotifications.init("chrome://wicked/skin/icon.png");
                    my.theMessenger.init();
                    my.theMessenger.addListener("xr-reload-servers", my.extension.reloadServers);
                    my.theMessenger.addListener("xr-get-servers-query", function () {
                        my.theMessenger.send("xr-servers", my.extension.servers);
                        return (true);
                    });

                    var messageManager = my.CCSV("@mozilla.org/globalmessagemanager;1", "nsIMessageListenerManager");
                    messageManager.loadFrameScript("chrome://wicked/content/frame.js", true);
                    messageManager.addMessageListener("xr-magnet-clicked", my.extension.uploadMagnet);

                    my.theMessenger.addListener("xr-save-as", function (data, subject) {
                        my.extension.saveAs(data, subject.QueryInterface(Components.interfaces.nsIFile));
                        return (true);
                    });
                    my.theMessenger.addListener("http-on-examine-response", my.extension.onExamineRequest);

                    my.extension.reloadServers();
                    document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function () {
                        my.extension.showHide();
                    }, false);

                    setTimeout(function () {
                        my.extension.checkMIMEType();
                    }, 5000);

                    setInterval(my.extension.promoThread, my.conf.promoInterval);
                });
            },

            done: function () {
                my.theNotifications.done();
                my.theMessenger.done();
            },

            initToolbar: function () {
                var navbar = document.getElementById("nav-bar");
                if (navbar
                    && !document.getElementById("wicked-button")
                    && my.thePrefs.getBool('firstRun')
                ) {
                    my.thePrefs.putBool('firstRun', false);
                    var newset = null;
                    if (navbar.getAttribute('currentset')) {
                        if (navbar.getAttribute('currentset').indexOf('wicked-button') == -1) {
                            navbar.insertItem('wicked-button', null, null, false);
                            newset = navbar.getAttribute('currentset') + ',wicked-button';
                        }
                    }
                    else {
                        navbar.insertItem('wicked-button', null, null, false);
                        newset = navbar.getAttribute('defaultset') + ',wicked-button';
                    }
                    if (newset) {
                        navbar.setAttribute('currentset', newset);
                        document.persist('nav-bar', 'currentset');
                    }
                }
            },

            showURL: function (url) {
                url = my.addslash(url);
                var wm = my.CCSV("@mozilla.org/appshell/window-mediator;1", "nsIWindowMediator");
                var browserEnumerator = wm.getEnumerator("navigator:browser");
                var found = false;
                while (!found && browserEnumerator.hasMoreElements()) {
                    var browserWin = browserEnumerator.getNext();
                    var tabbrowser = browserWin.gBrowser;
                    var numTabs = tabbrowser.browsers.length;
                    for (var index = 0; index < numTabs; index++) {
                        var currentBrowser = tabbrowser.getBrowserAtIndex(index);
                        if (my.addslash(currentBrowser.currentURI.spec) == url) {
                            tabbrowser.selectedTab = tabbrowser.tabContainer.childNodes[index];
                            browserWin.focus();
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    var recentWindow = wm.getMostRecentWindow("navigator:browser");
                    if (recentWindow)
                        recentWindow.delayedOpenTab(url, null, null, null, null);
                    else
                        window.open(url);
                }
            },

            onPromoClick: function () {
                var promo = my.thePrefs.getObject('promo1', {url: null, clicked: false, modified: null});
                if (promo.url) {
                    promo.clicked = true;
                    my.thePrefs.putObject('promo1', promo);
                    my.extension.showURL(promo.url);
                }
            },

            isXivikConfiguration: function () {
                return (my.isXivikConfiguration(my.extension.servers));
            },

            isPromoShow: function () {
                return ( !my.extension.isXivikConfiguration() || my.thePrefs.getBool("promos") );
            },

            promoThread: function () {
                /*if(my.extension.isPromoShow())
                 {
                 var promo = my.thePrefs.getObject('promo1', { modified: null, notified_at: null });
                 var now = (new Date()).getTime();
                 if( !promo['notified_at'] || (parseInt(promo['notified_at'])+my.conf.promoTimeLimit < now) )
                 {
                 my.ajax(
                 {
                 url: my.conf.promoURL + "?" + new Date().getTime(),
                 ifModifiedSince: promo.clicked ? promo.modified : null,
                 passErrors: true,
                 base: null,

                 success: function( data, req )
                 {
                 var nfo = req.responseText.split('\n');
                 if(nfo.length>=3)
                 {
                 my.thePrefs.putObject('promo1', { modified: req.getResponseHeader("Last-Modified"), clicked: false, url: my.trim(nfo[2]), notified_at: now });
                 my.theNotifications.add( my.trim(nfo[0]), my.trim(nfo[1]), my.trim(nfo[2]), true );
                 }
                 }
                 });
                 }
                 }*/
            },

            checkMIMEType: function () {
                var type = null;
                try {
                    var mimeSvc = my.CCSV("@mozilla.org/mime;1", "nsIMIMEService");
                    type = mimeSvc.getTypeFromExtension("torrent");
                } catch (e) {
                }

                if (type && type.length) {
                    var name = "";
                    var mimenfo = mimeSvc.getFromTypeAndExtension(type, null);

                    if (mimenfo && !mimenfo.alwaysAskBeforeHandling) {
                        var promptService = my.CCSV("@mozilla.org/embedcomp/prompt-service;1", "nsIPromptService");
                        var change = true;

                        if (mimenfo.preferredAction == 0) {
                            var ret = promptService.confirmEx(window, my.t('ext_name'), my.t('mime_confirmation1'),
                                (my.Ci.nsIPromptService.BUTTON_POS_0 * my.Ci.nsIPromptService.BUTTON_TITLE_YES +
                                my.Ci.nsIPromptService.BUTTON_POS_1 * my.Ci.nsIPromptService.BUTTON_TITLE_NO), "", "", "", "", {});
                            change = (ret == 0);
                        }
                        else if (mimenfo.preferredAction != 1) {
                            if (mimenfo.preferredApplicationHandler)
                                name = mimenfo.preferredApplicationHandler.name;
                            else {
                                var file;
                                if (mimenfo.possibleLocalHandlers && mimenfo.possibleLocalHandlers.length) {
                                    file = mimenfo.possibleLocalHandlers.queryElementAt(0, my.Ci.nsILocalHandlerApp);
                                    if (file)
                                        name = file.executable.leafName;
                                }
                                else if (mimenfo.possibleApplicationHandlers && mimenfo.possibleApplicationHandlers.length) {
                                    file = mimenfo.possibleApplicationHandlers.queryElementAt(0, my.Ci.nsILocalHandlerApp);
                                    if (file)
                                        name = file.executable.leafName;
                                }
                            }
                            if (name && name.length) {
                                var ret = promptService.confirmEx(window, my.t('ext_name'), my.t('mime_confirmation2'),

                                    (my.Ci.nsIPromptService.BUTTON_POS_0 * my.Ci.nsIPromptService.BUTTON_TITLE_YES +
                                    my.Ci.nsIPromptService.BUTTON_POS_1 * my.Ci.nsIPromptService.BUTTON_TITLE_NO), "", "", "", "", {});
                                change = (ret == 0);
                            }
                        }
                        if (change) {
                            try {
                                function NC_URI(aProperty) {
                                    return "http://home.netscape.com/NC-rdf#" + aProperty;
                                }

                                function HANDLER_URI(aHandler) {
                                    return "urn:mimetype:handler:" + aHandler;
                                }

                                var rdf = my.CCSV("@mozilla.org/rdf/rdf-service;1", "nsIRDFService");
                                var fileLocator = my.CCSV("@mozilla.org/file/directory_service;1", "nsIProperties");
                                var file = fileLocator.get("UMimTyp", my.Ci.nsIFile);
                                var ioService = my.CCSV("@mozilla.org/network/io-service;1", "nsIIOService");
                                var fileHandler = ioService.getProtocolHandler("file").QueryInterface(my.Ci.nsIFileProtocolHandler);
                                var dataSource = rdf.GetDataSourceBlocking(fileHandler.getURLSpecFromFile(file));

                                function changeMIMEStuff(aMIMEString, aPropertyString, aValueString) {
                                    var mimeSource = rdf.GetUnicodeResource(aMIMEString);
                                    var valueProperty = rdf.GetUnicodeResource(NC_URI(aPropertyString));
                                    var mimeLiteral = rdf.GetLiteral(aValueString);
                                    var currentValue = dataSource.GetTarget(mimeSource, valueProperty, true);

                                    if (currentValue)
                                        dataSource.Change(mimeSource, valueProperty, currentValue, mimeLiteral);
                                    else
                                        dataSource.Assert(mimeSource, valueProperty, mimeLiteral, true);
                                }

                                changeMIMEStuff(HANDLER_URI(type), "alwaysAsk", "true");

                                var rds = dataSource.QueryInterface(my.Ci.nsIRDFRemoteDataSource);
                                if (rds)
                                    rds.Flush();
                            } catch (e) {
                                alert(e);
                            }
                        }
                    }
                }
            },

            // Shows or hides the "Upload to..." option based on the href of the link clicked:
            showHide: function () {
                var mode = my.thePrefs.getInt("capture");
                var doShow = this.servers.length && gContextMenu.onLink && gContextMenu.linkURI &&
                    (((mode == 0) && ((gContextMenu.linkURI.path.lastIndexOf(".torrent") != -1) ||
                    (gContextMenu.linkURI.scheme.lastIndexOf("magnet") != -1))) || (mode == 1));

                var menuU = document.getElementById("wicked-context-upload");
                var snglU = document.getElementById("wicked-context-single-upload");
                if (doShow) {
                    this.lastURI = gContextMenu.linkURI;
                    var download = function () {
                        my.extension.download(this);
                    };
                    if (this.servers.length > 1) {
                        menuU.hidden = false;
                        snglU.hidden = true;
                        var list = menuU.firstChild;
                        while (list.firstChild)
                            list.removeChild(list.firstChild);

                        for (var i = 0; i < this.servers.length; i++) {
                            var serv = this.servers[i];
                            var item = document.createElement("menuitem");

                            item.setAttribute("label", serv[3] ? serv[3] : (serv[0] + " (" + serv[4] + ")"));
                            item.setAttribute("tooltiptext", my.t('username_') + serv[1] + ((serv[3] && serv[3].length) ? ("\r\n\r\n" + my.t('description:') + serv[3]) : ""));
                            item.addEventListener("command", download, false);
                            item.setAttribute("rev", i);

                            list.appendChild(item);
                        }
                    }
                    else {
                        menuU.hidden = true;
                        snglU.hidden = false;
                        snglU.setAttribute("label", my.t("upload_to") + ( this.servers[0][3] ? this.servers[0][3] : this.servers[0][0] ));
                        snglU.setAttribute("rev", 0);
                    }
                }
                else {
                    menuU.hidden = true;
                    snglU.hidden = true;
                }
            },

            // Starts the download/upload process:
            download: function (node, ndx, leaf) {
                var index = node ? parseInt(node.getAttribute("rev"), 10) : (ndx || 0);
                var server = this.servers[index];

                // Create a temporary file:
                if (!leaf) {
                    leaf = this.lastURI.spec;
                    if (leaf.indexOf("magnet:") == 0) {
                        this.uploadLink(server, leaf, null);
                        return;
                    }
                    else
                        leaf = leaf.substr(leaf.lastIndexOf("/") + 1);
                }

                if (my.thePrefs.getBool("messageds"))
                    my.notify("info", "starting_torrent_download", server[0]);

                my.Cu.import("resource://gre/modules/FileUtils.jsm");
                var tmp = FileUtils.getFile("TmpD", ["wicked_uploader.tmp"]);
                tmp.createUnique(my.Ci.nsIFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);

                // Download to a temp file:
                var persist = my.Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(my.Ci.nsIWebBrowserPersist);
                persist.persistFlags = my.Ci.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES |
                    my.Ci.nsIWebBrowserPersist.PERSIST_FLAGS_CLEANUP_ON_FAILURE;

                var failure = false;
                var self = this;
                persist.progressListener =
                    {
                        onLocationChange: function () {
                        },
                        onSecurityChange: function () {
                        },
                        onProgressChange: function () {
                        },
                        onStatusChange: function () {
                        },

                        onStateChange: function (aWebProgress, aRequest, aStatus, aMessage) {
                            if ((aStatus & my.Ci.nsIWebProgressListener.STATE_STOP) && aRequest) {
                                if (aWebProgress)
                                    aWebProgress.progressListener = null; // reset to avoid circular references -> leaks
                                if (!Components.isSuccessCode(aStatus) ||
                                    (aRequest instanceof Components.interfaces.nsIHttpChannel && aRequest.responseStatus >= 400) || !tmp.exists()) {
                                    if (my.thePrefs.getBool("messagedf"))
                                        my.notify("error", "download_error", server[0]);
                                    failure = true;
                                }
                                else {
                                    var tName = leaf.match(/\.torrent$/i);
                                    var isTorrent = false;
                                    if (aRequest instanceof Components.interfaces.nsIHttpChannel) {
                                        var httpChannel = aRequest.QueryInterface(my.Ci.nsIHttpChannel);
                                        var contentdisp = my.getResponseHeader(httpChannel, "content-disposition");
                                        isTorrent = isTorrent || (contentdisp && contentdisp.match(/\.torrent$/i));
                                        var contenttype = my.getResponseHeader(httpChannel, "content-type");
                                        isTorrent = isTorrent || (contenttype && ((contenttype.indexOf("application/x-bittorrent") != -1) ||
                                            ((contenttype.indexOf("application/octet-stream") != -1) && tName)));
                                    }
                                    if (!isTorrent) {
                                        if (my.thePrefs.getBool("messagedf"))
                                            my.notify("error", "download_not_torrent", server[0]);
                                        failure = true;
                                    }
                                }
                                if (!failure)
                                    self.uploadLink(server, leaf, tmp);
                                else if (tmp.exists())
                                    tmp.remove(false);
                            }
                        }
                    };

                var nsILoadContext = null;
                try {
                    my.Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
                    var wm = my.CCSV("@mozilla.org/appshell/window-mediator;1", "nsIWindowMediator");
                    var win = wm.getMostRecentWindow("navigator:browser");
                    nsILoadContext = PrivateBrowsingUtils.getPrivacyContextFromWindow(win);
                } catch (err) {
                }

                // do the save
                if (my.ffVersion < 36)
                    persist.saveURI(this.lastURI, null, null, null, "", tmp, nsILoadContext);
                else
                    persist.saveURI(this.lastURI, null, null, null, null, "", tmp, nsILoadContext);
            },

            checkLabels: function (server, name, file, replacement) {
                var url = my.addslash(server[0]);
                var isDirs = (server[7] == 1);
                var isLabels = (server[5] == 1);

                var self = this;
                var modes = [];

                if (isDirs || (server[7] == 2))
                    modes.push("dirlist");
                if (isLabels)
                    modes.push("labels");

                var defLabel = server[6];
                var defDirectory = server[8];

                replacement['{HOST}'] = file ? this.lastURI.host : '';
                replacement['{DATE}'] = (new Date()).toISOString().substr(0, 10);
                replacement['{TRACKER}'] = replacement['{TRACKER}'] || '';
                replacement['{CREATION}'] = replacement['{CREATION}'] || '';

                for (var i in replacement) {
                    var r = new RegExp(i, 'ig');
                    defLabel = defLabel.replace(r, replacement[i]);
                    defDirectory = defDirectory.replace(r, replacement[i]);
                }

                url += "plugins/_getdir/info.php?mode=" + modes.join(";");
                var labels_ = [];
                var dirs_ = [];
                var base = "";

                my.ajax(
                    {
                        url: url,
                        base: server[0],
                        user: server[1],
                        password: server[2],
                        error: function () {
                            isDirs = false;
                            isLabels = false;
                        },
                        success: function (obj) {
                            if (obj) {
                                if (obj.labels)
                                    labels_ = obj.labels;
                                if (obj.basedir)
                                    base = my.addslash(obj.basedir);
                                if (obj.dirlist) {
                                    dirs_ = obj.dirlist;
                                }
                            }
                            else {
                                isDirs = false;
                                isLabels = false;
                            }
                        },
                        complete: function (status) {
                            if (status > 0 && status != 401) {
                                if (isDirs || isLabels) {
                                    var returnObj =
                                        {
                                            action: "cancel",
                                            dirs: dirs_,
                                            labels: labels_,
                                            basedir: base,
                                            server: {
                                                user: server[1],
                                                password: server[2],
                                                url: server[0]
                                            },
                                            returnedDir: defDirectory,
                                            returnedLabel: defLabel,
                                            not_add_path: false,
                                            torrents_start_stopped: my.thePrefs.getBool("nostart"),
                                            fast_resume: false
                                        };
                                    var dlg = (isDirs && isLabels) ?
                                        {
                                            name: 'labelsdirs.xul',
                                            title: 'WickedLabelsDirectories'
                                        } : isDirs ?
                                            {
                                                name: 'dirs.xul',
                                                title: 'WickedDirectories'
                                            } :
                                            {
                                                name: 'labels.xul',
                                                title: 'WickedLabels'
                                            };
                                    window.openDialog('chrome://wicked/content/' + dlg.name, dlg.title, 'centerscreen=yes,resizable=yes,chrome=yes,modal=yes', returnObj);
                                    if (returnObj.action == "save")
                                        self.upload(server, name, file, returnObj.returnedLabel, base + returnObj.returnedDir,
                                            {
                                                not_add_path: returnObj.not_add_path,
                                                torrents_start_stopped: returnObj.torrents_start_stopped,
                                                fast_resume: returnObj.fast_resume,
                                            });
                                }
                                else
                                    self.upload(server, name, file, defLabel, base + defDirectory);
                            }
                        }
                    });
            },

            upload: function (server, name, file, label, directory, options) {
                if (!label)
                    label = "";
                if (!directory)
                    directory = "";
                else {
                    if (directory.charAt(directory.length - 1) == "/")
                        directory.substr(0, directory.length - 1);
                }
                options = options ||
                    {
                        not_add_path: false,
                        torrents_start_stopped: my.thePrefs.getBool("nostart"),
                        fast_resume: false
                    };

                var type = server[4];
                var url = my.addslash(server[0]);
                var self = this;

                if (my.thePrefs.getBool("messageus"))
                    my.notify("info", "starting_torrent_upload", server[0]);

                var standardErrorHandling = function (status, msg) {
                    if (my.thePrefs.getBool("messageuf"))
                        my.notify("error", msg ? msg : my.t("torrent_upload_fail") + ' (status: ' + status + ')', server[0]);
                };

                var standardSuccessHandling = function (dummy, req) {
                    var msg = null;
                    var text = req.responseText;
                    try {
                        var json = JSON.parse(text);
                        if ("error" in json) {
                            msg = json["error"];
                            if ((typeof(msg) == "object") && msg["message"])
                                msg = msg["message"];
                        }
                    } catch (e) {
                        if (/^noty\(.*\+theUILang\.addTorrent.*,"error"\);/.test(text))
                            msg = '';
                        else if (msg = text.match(/<strong>Error(.*)<\/strong>/))
                            msg = "Error" + msg[1];
                    }
                    if (msg === null) {
                        if (my.thePrefs.getBool("messageuc"))
                            my.notify("info", "torrent_uploaded", server[0]);
                    }
                    else if (my.thePrefs.getBool("messageuf"))
                        standardErrorHandling(200, msg, server[0]);
                };

                var standardCompleteHandling = function () {
                    if (file && file.exists())
                        file.remove(false);
                };

                switch (type) {
                    case "rutorrent 3.x": {
                        var formData = new FormData();
                        formData.append("dir_edit", directory);
                        formData.append("label", label);
                        if (options['torrents_start_stopped'])
                            formData.append("torrents_start_stopped", "on");
                        if (options['not_add_path'])
                            formData.append("not_add_path", "on");
                        if (options['fast_resume'])
                            formData.append("fast_resume", "on");
                        if (name.indexOf("magnet:") == 0)
                            formData.append("url", name);
                        else
                            formData.append("torrent_file", new File(file), name);

                        my.ajax(
                            {
                                url: url + 'php/addtorrent.php',
                                base: server[0],
                                user: server[1],
                                password: server[2],
                                method: 'POST',
                                data: formData,
                                success: standardSuccessHandling,
                                complete: standardCompleteHandling,
                                error: standardErrorHandling
                            });
                        break;
                    }
                }
            },

            uploadLink: function (server, name, target) {
                if ((server[5] || server[7]) && (server[4] == "rutorrent 3.x")) {
                    if (target && ((server[5] == 2) || (server[7] == 2))) // "Predefined"
                    {
                        var self = this;
                        my.bencode(target, function (replacement) {
                            self.checkLabels(server, name, target, replacement);
                        }, function () {
                            if (my.thePrefs.getBool("messageuf"))
                                my.notify("error", "download_not_torrent", server[0]);
                        });
                    }
                    else
                        this.checkLabels(server, name, target, {});
                }
                else
                    this.upload(server, name, target);
            },

            saveAs: function (data, target) {
                this.lastURI = data.url;
                this.uploadLink(this.servers[data.selected], data.name, target);
            },

            uploadMagnet: function (message) {
                var ret = {index: 0};
                if (my.extension.servers.length > 1) {
                    ret = {index: -1};
                    window.openDialog('chrome://wicked/content/seedboxes.xul', 'WickedSeedboxes', 'centerscreen=yes,resizable=yes,chrome=yes,modal=yes', ret);
                }
                if (ret.index != -1)
                    my.extension.uploadLink(my.extension.servers[ret.index], message.data.url, null);
            },

            // Reloads the server information from extension's preferences:
            reloadServers: function () {
                my.extension.servers = [];

                var loginManager = my.CCSV("@mozilla.org/login-manager;1", "nsILoginManager");

                for (var i = 0; i < 20; i++) {
                    var index = i + 1;
                    var host = my.thePrefs.getString("host-" + index);

                    if (host.length) {
                        var logins = loginManager.findLogins({}, "chrome://wicked/", null, "wicked-host-" + index);
                        // Host is not empty - load this server:
                        my.extension.servers.push(
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
                            ]);
                    }
                    else break;
                }
                return (true);
            },

            // Autoconfiguration:
            autoConfFrom: function (text) {
                var parser = new DOMParser();
                var xmldoc = parser.parseFromString(text, "text/xml");

                var xml = xmldoc.documentElement;

                // Check autoconf xml for validity:
                if ((xml.nodeName == "autoconf") && (xml.getAttribute("name") == "wicked")) {
                    var servers = xml.getElementsByTagName("server"), success = 0;
                    // Cycle through all the seedboxes in the autoconf file:
                    for (var i = 0; i < servers.length; i++) {
                        var server = servers[i];
                        var options = server.getElementsByTagName("option");

                        var host = "", username = "", pass = "", description = "", client = "";

                        // Get seedbox data:
                        for (var k = 0; k < options.length; k++) {
                            var option = options[k], value = option.getAttribute("value");

                            switch (option.getAttribute("name")) {
                                case "host":
                                    host = value;
                                    break;
                                case "username":
                                    username = value;
                                    break;
                                case "pass":
                                    pass = value;
                                    break;
                                case "description":
                                    description = value;
                                    break;
                                case "client":
                                    client = value;
                                    break;
                            }
                        }

                        var tmphost = my.getHost(host);

                        if (!i) {
                            // Check if host info already exists in extension options - only for 1st entry:
                            var found = false;
                            for (var j = 0; j < this.servers.length; j++) {
                                var host2 = my.getHost(this.servers[j][0]);
                                if (host2 == tmphost) {
                                    found = j;
                                    break;
                                }
                            }

                            if (found !== false) {
                                if (!window.confirm("[" + tmphost + "]: " + my.t('seedbox_data_found')))
                                    return;

                                // Found (at least a single) host already in preferences - wipe out this server.
                                for (var j = found; j < this.servers.length;) {
                                    var host2 = my.getHost(this.servers[j][0]);
                                    if (host2 == tmphost)
                                        this.servers.splice(j, 1);
                                    else
                                        j++;
                                }
                            }
                        }

                        if (!username && this.logins[tmphost])
                            username = this.logins[tmphost][0];
                        if (!pass && this.logins[tmphost])
                            pass = this.logins[tmphost][1];

                        // Add server to server data:
                        var server = [host, username, pass, description, client, 0, "", 0, ""];
                        this.servers.push(server);

                        success++;
                    }
                    if (success) {
                        // Unload server data:
                        var loginManager = my.CCSV("@mozilla.org/login-manager;1", "nsILoginManager");

                        for (var i = 0; i < this.servers.length; i++) {
                            var index = i + 1;
                            var server = this.servers[i];

                            my.thePrefs.putString("host-" + index, server[0]);
                            my.thePrefs.putString("user-" + index, server[1]);

                            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", my.Ci.nsILoginInfo, "init");
                            var loginInfo = new nsLoginInfo("chrome://wicked/", null, "wicked-host-" + index, server[0], server[2], "", "");
                            var logins = loginManager.findLogins({}, "chrome://wicked/", null, "wicked-host-" + index);

                            if (server[2] && server[2].length) {
                                if (logins && logins[0])
                                    loginManager.modifyLogin(logins[0], loginInfo);
                                else
                                    loginManager.addLogin(loginInfo);
                            }
                            else if (logins && logins[0])
                                loginManager.removeLogin(logins[0]);
                            my.thePrefs.putString("desc-" + index, server[3]);
                            my.thePrefs.putString("client-" + index, server[4]);
                            my.thePrefs.putInt("label_selection-" + index, server[5]);
                            my.thePrefs.putString("label-" + index, server[6]);
                            my.thePrefs.putInt("directory_selection-" + index, server[7]);
                            my.thePrefs.putString("directory-" + index, server[8]);
                        }

                        for (; i < 20; i++) {
                            var index = i + 1;

                            my.thePrefs.putString("host-" + index, "");
                            my.thePrefs.putString("user-" + index, "");

                            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", my.Ci.nsILoginInfo, "init");
                            var logins = loginManager.findLogins({}, "chrome://wicked/", null, "wicked-host-" + index);

                            if (logins && logins[0])
                                loginManager.removeLogin(logins[0]);

                            my.thePrefs.putString("desc-" + index, "");
                            my.thePrefs.putString("client-" + index, "");
                            my.thePrefs.putInt("label_selection-" + index, 0);
                            my.thePrefs.putString("label-" + index, "");
                            my.thePrefs.putInt("directory_selection-" + index, 0);
                            my.thePrefs.putString("directory-" + index, "");
                        }
                        my.notify("info", my.t("autoconfiguration_succeeded") + success);
                    }
                }
            },

            onExamineRequest: function (data, subject) {
                var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
                var type = my.getResponseHeader(httpChannel, "content-type");
                if (httpChannel.URI.asciiSpec.match(new RegExp(my.conf.confFilter)) &&
                    (type == "application/seedboxconfig")) {
                    if (window.confirm(my.t('do_you_want_autoconfigure'))) {
                        var tracingListener = new my.TracingListener(httpChannel, function (data) {
                            tracingListener.originalListener = null;
                            tracingListener = null;
                            my.extension.autoConfFrom(data)
                        });
                        subject.QueryInterface(Components.interfaces.nsITraceableChannel);
                        tracingListener.originalListener = subject.setNewListener(tracingListener);
                        var host = httpChannel.URI.host;
                        var auth = my.getResponseHeader(httpChannel, "authorization-echo");
                        if (auth) {
                            var login = atob(auth);
                            if (login && login.length && (login.indexOf(":") != -1))
                                my.extension.logins[host] = login.split(":");
                        }
                    }
                    else
                        subject.cancel(my.Cr.NS_BINDING_ABORTED);
                }
                return (true);
            }
        };

// Copy response listener implementation.
    my.TracingListener = function (channel, callback) {
        this.originalListener = null;
        this.receivedData = [];   // array for incoming data.
        this.channel = channel;
        this.callback = callback;
    };

    my.TracingListener.prototype =
        {
            onDataAvailable: function (request, context, inputStream, offset, count) {
                var binaryInputStream = my.CCSV("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream");
                binaryInputStream.setInputStream(inputStream);
                var data = binaryInputStream.readBytes(count);
                this.receivedData.push(data);
            },

            onStartRequest: function (request, context) {
            },

            onStopRequest: function (request, context, statusCode) {
                // Get entire response
                var responseSource = this.receivedData.join();
                if (this.callback)
                    this.callback(responseSource);
                if (this.channel)
                    this.channel.cancel(my.Cr.NS_BINDING_ABORTED);
            },

            QueryInterface: function (aIID) {
                if (aIID.equals(my.Ci.nsIStreamListener) || aIID.equals(my.Ci.nsISupports))
                    return this;
                throw my.Cr.NS_NOINTERFACE;
            }
        };

// Initialize the extension on browser start, deinitialize on shutdown:

    window.addEventListener("load", function () {
        my.extension.init();
    }, false);
    window.addEventListener("unload", function () {
        my.extension.done();
    }, false);

    return (my);
})(net.wicked.seedbox || {});
