addEventListener("click", function(e)
{
	if( (e.which==1) && !e.metaKey && !e.shiftKey && !e.ctrlKey && !e.altKey )
	{
		var target = e.target;
		while( target && target.tagName && (target.tagName.toLowerCase() != "a") )
			target = target.parentNode;			
		if( target && target.href && target.href.match(/^magnet:/i) )
		{
			sendAsyncMessage("xr-magnet-clicked", { url: target.href });
	        	e.preventDefault();
			e.stopPropagation();
			return(false);
		}
	}
}, false);