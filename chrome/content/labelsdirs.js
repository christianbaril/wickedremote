if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.theFileCache = 
	{
		server: null,
		url: null,
		entries: {},
		basedir: null,

		init: function( server, basedir, dirlist )
		{
			this.basedir = my.addslash(basedir);
			this.server = server;
			this.url = my.addslash(this.server.url)+"plugins/_getdir/info.php?mode=dirlist&basedir=";
			this.entries = {};
			this.entries[''] = dirlist;
		},

		get: function( basedir, callback )
		{
			basedir = my.normalize(basedir);		
			if(this.entries[basedir])
				callback( basedir, this.entries[basedir] );
			else
			{
				my.ajax(
				{
					url: this.url+encodeURIComponent(my.theFileCache.basedir+basedir),
					user: this.server.user,
			                password: this.server.password,
					success: function( ret )
					{
						var directory = my.addslash(ret.basedir.substr(my.theFileCache.basedir.length));
						my.theFileCache.entries[directory] = ret.dirlist;
						callback( directory, ret.dirlist );
					}
				});
			}				
		}
	},

	my.uploadOptions = 
	{
		ret: null,
		curtop: '',

		loadLabelsdirs: function()
		{
			this.ret = window.arguments[0];
			var list;
			if(list = document.getElementById("wicked_labels_existing"))
			{
				for(var i in this.ret.labels)
				{
					var label = my.trim(this.ret.labels[i]);
					if(label.length)
						list.appendItem(label, label);
				}
				list.selectedIndex = -1;
				list.addEventListener("click", this.onLabelClick, true);

			}			
			if(list = document.getElementById("wicked_dirs_existing"))
			{
				my.thePrefs.init("extensions.wicked.");
				my.theFileCache.init( this.ret.server, this.ret.basedir, this.ret.dirlist)
				list.addEventListener("click", this.onDirClick, false);
				list.addEventListener("dblclick", this.onDirDblClick, false);				
				this.fillDirList( '', this.ret.dirs )
			}
		},

		saveLabelsdirs: function()
		{
			this.ret.action = "save";
			if(document.getElementById("wicked_labels_existing"))
				this.ret.returnedLabel = my.trim(document.getElementById("wicked_labels_new").value);
			if(document.getElementById("wicked_dirs_existing"))
				this.ret.returnedDir = my.normalize( document.getElementById("wicked_dirs_new").value );
			this.ret.not_add_path = document.getElementById("wicked_not_add_path").checked;
			this.ret.torrents_start_stopped	= document.getElementById("wicked_torrents_start_stopped").checked;
			this.ret.fast_resume = document.getElementById("wicked_fast_resume").checked;
		}, 

		onLabelClick: function(event)
		{
			var target = event.target;
			while(target && target.localName != "listitem")
				target = target.parentNode;
			if(!target)
				return;
			document.getElementById("wicked_labels_new").value = target.value;
			return(false);
		},

		onDirClick: function(event)
		{
			var target = event.target;
			while(target && target.localName != "listitem")
				target = target.parentNode;
			if(!target)
				return;
			document.getElementById("wicked_dirs_new").value = my.uploadOptions.curtop+target.value;
		},

		onDirDblClick: function(event)
		{
			var target = event.target;
			while(target && target.localName != "listitem")
				target = target.parentNode;
			if(!target)
				return;
        		var text = target.value;
			if(text!='.')
				my.theFileCache.get( my.uploadOptions.curtop+text, my.uploadOptions.fillDirList );
		},

		fillDirList: function( basedir, dirlist )
		{
			my.uploadOptions.curtop = my.normalize(basedir);
			document.getElementById("wicked_dirs_new").value = my.uploadOptions.curtop;
			var list = document.getElementById("wicked_dirs_existing")

			var count = list.itemCount;
			while(count-- > 0)
				list.removeItemAt(0);			
			for( var i in dirlist )
			{
				var dir = dirlist[i];
				list.appendItem(dir, dir);
			}
			list.selectedIndex = -1;
		}
	};		

	return(my);
})(net.wicked.seedbox || {});