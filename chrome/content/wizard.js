if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.wizard = 
	{
		ret: null,

		loadSetup: function()
		{	
			this.ret = window.arguments[0];
		},

		typeChanged: function(select)
		{
			var type = select.selectedItem.label;
			var client = document.getElementById("wicked_wizard_client");

			switch(type)
			{
				case "Shared":
				{
					client.selectedIndex = 0;
					break;
				}
				case "Semidedicated":
				{
					client.selectedIndex = 1;
					break;
				}
				case "Dedicated":
				{
					client.selectedIndex = 2;
					break;
				}					
			}
		},

		parse: function()
		{
			var parser = {action: "cancel", host: "", user: "", pass: ""};

			window.openDialog('chrome://wicked/content/parser.xul', 'WickedParser', 'centerscreen=yes,resizable=yes,chrome=yes,modal=yes', parser);

			if(parser.action == "save")
			{
				document.getElementById("wicked_entry_host").value = parser.host;
				document.getElementById("wicked_entry_user").value = parser.user;
				document.getElementById("wicked_entry_pass").value = parser.pass;
			}
		},

		saveSetup: function()
		{
			this.ret.action = "save";

			this.ret.host = my.trim(document.getElementById("wicked_entry_host").value);
			this.ret.user = my.trim(document.getElementById("wicked_entry_user").value);
			this.ret.pass = my.trim(document.getElementById("wicked_entry_pass").value);
			this.ret.type = document.getElementById("wicked_wizard_type").selectedItem.label;

			return true;
		}
	};		

	return(my);
})(net.wicked.seedbox || {});