<?
require_once("../classes/config.php");
require_once("../classes/class.modules.php");

$strModule = "";
$strModuleDescription = "";

if(isset($_GET['module']))
{
	$strModule = $_GET['module'];	
}

if(isset($_GET['description']))
{
	$strDescription = $_GET['description'];	
}

if(strlen($strModule) < 1)
{
?>
	<HTML>
		<head>
			<title>Catena Test Setup Page</title>
		</head>	
		<body>
			To create a new module, please input the name and description.
			<form action="newmodule.php" method="get">
				Module Name: 
				<input type="text" name="module">
				<input type="text" name="description">
				<input type="submit" value="Submit">
			</form>
		</body>
	</HTML>
<?
}
else
{
	/*
		Make all of the directories for the module
	*/
	$module = modules::GetInstance();
	
	if(!$module->Add($strModule, $strDescription))
	{
		die("Unable to create new module: ".$module->results->GetMessage());
	}
	
	echo "Created module: $strModule<BR>";
	echo "<a href = 'setup.php'>Return to setup</a>";
}

?>