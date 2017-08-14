<?

	require_once("classes/common.php");
	require_once("classes/config.php");
	
	ClearCache();
	
	/*
		- 	We need to gather the user name. To do this we use the main frame to call
			a page on an NT web server. See config.php for the exact location.
		-	The page returns with the username as a variable. The page it calls
			is home.php
		-	If the default page is not available
			try alternate servers to see if they have the needed user name page.
	*/
	$redirectPage = "";
	
	foreach($cfg['site']['nameServers'] as $server)
	{
		$file_headers = @get_headers($server);
		
		if(
			(strstr($file_headers[0], "HTTP/1.1 401")) || 
			(strstr($file_headers[0], "HTTP/1.1 200"))
		)
		{
			$redirectPage = $server . "?redir=http://$serverName/functions/home.php";
			break;
		}
	}
	
	//echo $redirectPage;

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
<title>Catena</title>
<link rel="icon" href="favicon.ico" type="image/x-icon">
<link rel="shortcut icon" href="favicon.ico" type="image/x-icon"> 
<NOSCRIPT>
	Enable Javascript to use the Catena Website.
</NOSCRIPT>
</head>
<FRAMESET ROWS="100%,*" COLS="80%" border="1" framespacing="1">
	<frame name="displayFrame" src=<? echo "'$redirectPage'"; ?> noresize="noresize" />
</frameset>
<noframes></noframes>
</html>