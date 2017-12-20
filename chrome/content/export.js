if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.export = 
	{
		ret: null,
		elements: [],

		loadExports: function()
		{
			this.ret = window.arguments[0];
			var list = document.getElementById("wicked_exports");

			for(var i = 0; i < this.ret.logins.length; i++)
			{
				if(this.ret.logins[i].login)
				{
					var label = my.trim(this.ret.logins[i].url + " - " + this.ret.logins[i].login);

					var element = list.appendItem(label, label);
					list.addItemToSelection(element);
		
					element.data = this.ret.logins[i];
					this.elements.push(element);
				}
				else
					this.ret.logins[i].name = null;
			}
		},			

		saveExports: function()
		{
			this.ret.action = "export";

			for(var i = 0; i < this.elements.length; i++)
			{
				if(!this.elements[i].selected)
					this.elements[i].data.name = null;
			}
		}
	};

	return(my);
})(net.wicked.seedbox || {});