if(typeof(net) == "undefined") var net = {};
if(!net.wicked) net.wicked = {};
net.wicked.seedbox = (function(my)
{
	my.conf = 
	{
		promoURL: "https://promos.wicked.com/browser/browser.txt",
		promoInterval: 10800000,	// 3 hours
		promoTimeLimit: 604800000,	// 1 week
		wickedDomain: '.wicked.com',
		confFilter: "^http(s)://.*\.wicked\.com/browsers_addons/get_addon_config\.php",
	};
            
	return(my);
})(net.wicked.seedbox || {});
