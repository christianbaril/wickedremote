if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.seedboxes = 
	{
		servers: [],
		ret: null,

		loadData: function()
		{
			this.ret = window.arguments[0];
			my.thePrefs.init("extensions.wicked.");
			for(var i = 0; i < 20; i++)
			{
				var index = i + 1;
				var host = my.thePrefs.getString("host-" + index);
				var desc = my.thePrefs.getString("desc-" + index);
				if(host.length)
					this.addRecord(desc ? desc : host, my.thePrefs.getString("user-" + index), my.thePrefs.getString("client-" + index));
				else 
					break;
			}
			document.getElementById("wicked_profiles").selectedIndex = -1;
		},

		unloadData: function()
		{
			this.ret.index = document.getElementById("wicked_profiles").selectedIndex;
			return(true);
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

		checkSelection: function()
		{
			var list = document.getElementById("wicked_profiles");
			var index = list.selectedIndex;
			document.documentElement.getButton("accept").disabled = (index == -1);
		}
	};

	return(my);
})(net.wicked.seedbox || {});