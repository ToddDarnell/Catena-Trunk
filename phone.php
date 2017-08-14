<?
	$last = "";
	$first = "";
	
	if(isset($_GET['last']))
	{
		$last = $_GET['last'];
	}
	
	if(isset($_GET['first']))
	{
		$first = $_GET['first'];
	}
	
	
?>
<HTML>
<SCRIPT>
function RedirectNow()
{
	element_form = document.getElementById("PhoneSearch2");
	
	element_form.submit();
}
window.onload = function()
{
	RedirectNow();
}
</SCRIPT>
	<form name="PhoneSearch2" id="PhoneSearch2" action="http://intranet/scripts/employeeDirectory/results.asp" method="post">
			<input type="hidden" id="clastname" name="Lastname" value="<? echo $last;?>"></BR>
			<input type="hidden" id="cfirstname" name="Firstname" value="<? echo $first;?>" ><br>
		</div>
	</form>
</HTML>
