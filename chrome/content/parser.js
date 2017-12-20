if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.parser = 
	{

		ret: null,

		loadEntry: function()
		{
			this.ret = window.arguments[0];
		},

		saveEntry: function()
		{
			this.ret.action = "save";
			var text = document.getElementById("wicked_parser_text").value;
			if(text.length)
			{
				var host = "";
				var user = "";
				var pass = "";

				var h1_ = text.indexOf("URL:") + 4;
				var h2_ = text.indexOf("Username:", h1_);

				if((h1_ != -1) && (h2_ != -1))
				{
					host = text.substring(h1_, h2_);
					host = my.trim(host);
		                        if(host.indexOf('http://')==0)
			                    	host = host.substr(7);
                		        else
                        		if(host.indexOf('https://')==0)
	                    			host = host.substr(8);			
				}

				var u1_ = text.indexOf("Username:", h2_) + 9;
				var u2_ = text.indexOf("Password:", u1_);

				if((u1_ != -1) && (u2_ != -1))
				{
					user = text.substring(u1_, u2_);
					user = my.trim(user);
				}

				var p1_ = u2_ + 10;
				p2_ = text.indexOf("\n", p1_);
				if(p2_ == -1)
					p2_ = text.indexOf("\r", p1_);
	                	if((p1_ != -1) && (p2_ != -1))
		                {
			                pass = text.substring(p1_, p2_);
	        		        pass = my.trim(pass);
			        }		

				this.ret.host = host;
				this.ret.user = user;
				this.ret.pass = pass;
			}			
		}
	};

	return(my);
})(net.wicked.seedbox || {});
