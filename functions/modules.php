<?
	require_once('../classes/include.php');
	require_once('../classes/class.modules.php');

	ClearCache();

	if(!isset($_GET['action']))
	{ 
		exit;
	};
	
	$action = strtolower($_GET['action']);
	
	switch($action)
	{
		case "clientfiles":
			$oModules = modules::getInstance();
			$oXML = new XML;
			$arModuleFiles = $oModules->GetClientFiles();
			$oXML->serializeElement($arModuleFiles, "element");
			$oXML->outputXHTML(); 
			break;
		case "menu":
			$oModules = modules::getInstance();
			$oModules->GetMenu();
			break;
		case "modulelist":
			$oModules = modules::getInstance();
			$oXML = new XML;
			$arModuleFiles = $oModules->GetModules();
			$oXML->serializeElement($arModuleFiles, "element");
			$oXML->outputXHTML(); 
			break;
	}
	
	
?>