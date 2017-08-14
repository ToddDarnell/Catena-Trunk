<%option explicit%>
<%
	'	This file is to be queried from the linux server to provide the
	'	user's NT login information.
	'	The login name is then sent back to the linux server home page.
	'	The page creates a form with 1 hidden field, stuffs the field
	'	with the user's name and then sends that back to the linux
	'	server.
	'	This file is the replacement for username.asp
	'
	
	dim userName
	dim serverName
	dim redir			'	the web address we're building to redirect the user

	' Set the username variable
	Dim objNet
 	Set objNet = CreateObject("WScript.NetWork") 
	userName = objNet.UserName
	Set objNet = nothing
	
	serverName = Request("server")
	
	if(Len(serverName)) then
		redir = "http://" & serverName & "/functions/home.php"
		'Response.Redirect(redir)
	else
		response.Write("Invalid server name :" & serverName)
		response.end()
	end if
%>
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
	<FORM action="<%=redir%>" method="post" id="nameForm">
		 <INPUT type="hidden" name="accountname" value="<%=userName%>">
	</FORM>
</BODY>
</HTML>