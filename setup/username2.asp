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
	dim redirURL			'	the web address we're building to redirect the user

	' Set the username variable
	Dim objNet
 	Set objNet = CreateObject("WScript.NetWork") 
	userName = objNet.UserName
	Set objNet = nothing
	
	redirURL = Request("redir")

	'	redirURL = "http://" & serverName & "/functions/home.php"
	
	if(Len(redirURL) < 1) then
		response.Write("No server name selected using 'redir'.")
		response.Write("<BR>Use 'redir' to redirect to the new address.")
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
	<FORM action="<%=redirURL%>" method="post" id="nameForm">
		 <INPUT type="hidden" name="accountname" value="<%=userName%>">
	</FORM>
</BODY>
</HTML>