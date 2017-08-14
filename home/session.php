<?
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function GetUserName()
{
	$userName = "";
	if(isset($REMOTE_USER))
	{
		$userName = $REMOTE_USER;
	}
	else if(isset($_SERVER['REMOTE_USER']))
	{
		$userName = $_SERVER['REMOTE_USER'];
	}
	
	/*
		split off the rest of the username
	*/
	$arName = split('\\\\', $userName);
	return $arName[1];
}

	$redirURL = "";
	
	//print_r($_REQUEST);
	
	if(isset($_REQUEST['redir']))
	{
		$redirURL = $_REQUEST['redir'];
	}

	if($redirURL == "")
	{
		die("A server name is required");
	}

		
	$userName = GetUserName();
	
	

?>
<HTML>
<META HTTP-EQUIV="CACHE-CONTROL" CONTENT="NO-CACHE">
<META HTTP-EQUIV="EXPIRES" CONTENT="0">
<SCRIPT>

/*
	We're going to use the javascript to plug in the user data into the form
	fields and then fire off the submit.
*/
function RedirectNow()
{
	element_form = document.getElementById("nameForm");
	
	element_form.submit();
}
window.onload = function()
{
	RedirectNow();
}
</SCRIPT>
<NOSCRIPT>
	Enable Javascript to use the Catena Website.
</NOSCRIPT>
<BODY>
	<FORM action="<? echo $redirURL?>" method="post" id="nameForm">
		 <INPUT type="hidden" name="accountname" value="<? echo $userName ?>">
	</FORM>
</BODY>
</HTML>