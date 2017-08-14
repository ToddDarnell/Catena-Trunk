<?
	require_once('include.php');
	require_once('config.php');
/**
	\brief
		Perfoms the management of the system modules
*/
class modules extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblModules";
		$this->field_Id = "module_ID";
		$this->field_Name = "module_Name";
		$this->field_Description = "module_Description";
		$this->field_Enabled = "module_Enabled";

		$this->db = systemData::GetInstance();

	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Adds a module to the system
		\param strName
			The name of the module. This should be the folder name used by
			the file system
		\param strDescription
			The description of the module.
		\return
	*/
	//--------------------------------------------------------------------------
	function Add($strName, $strDescription)
	{
		global $g_oUserSession;
		global $cfg;
	
		try
		{
			/*
				Make sure the names are valid
			*/
			if(!$this->IsValidName($strName))
			{
				throw new Exception("Invalid name submitted. Please choose a new name");
			}
	
			if(!$this->IsValidDescription($strDescription))
			{
				throw new Exception("Invalid description submitted. Please choose a new name");
			}
			
			$modulePath = $cfg['site']['modulePath']."/$strName/";
		
			if(is_dir($modulePath))
			{
				throw new Exception("Module exists. Please choose a new name");
			}
	
			/*
				See if the short name or the long name is in use
			*/
			if($this->GetID($strName) > -1)
			{
				throw new Exception("'$strName' is already in use.");
			}
			
			/*
				build the record
			*/
			$arInsert = array();
			$arInsert[$this->field_Name] = $strName;
			$arInsert[$this->field_Description] = $strDescription;
			$arInsert[$this->field_Enabled] = 1;
					
			if(!$this->db->insert($this->table_Name, $arInsert))
			{
				throw new Exception("Unable to add '$strName' due to database error.");
			}
			
			if(!@mkdir($modulePath))
			{
				throw new Exception("Unable to create the module directory");
			}

			$this->createScriptFile($modulePath);
			$this->createMenuFile($modulePath);
			$this->createDefaultScreen($modulePath);
			$this->createServerClassFile($modulePath);
			$this->createServerAccessFile($modulePath);
	
			return $this->results->Set('true', "Module '$strName' added.");
		}
		catch (Exception $e)
		{
			$id = $this->GetID($strName);
			$this->Remove($id);

			return $this->results->Set('false', $e->getMessage());
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function createScriptFile($strModulePath)
	{
		global $strModule;
		
		$strScreen = "o$strModule";
		
		$strFolder = $strModulePath."/scripts";
		
		mkdir($strFolder);
	
		$fileName = $strFolder."/$strModule.js";
		
		$file = fopen($fileName, "w");
	
		$strFileContents = "
			str".$strModule."URL = '/modules/$strModule/server/$strModule';
		
			var $strScreen = new system_AppScreen();
			$strScreen.screen_Name = '$strModule';				//	The name of the screen or page. Also the name of the XML data file
			$strScreen.screen_Menu = '$strModule Menu Item';	//	The name of the menu item which corapsponds to this item
			$strScreen.module_Name = '$strModule';
			
			$strScreen.custom_Show = function()
			{
				var serverValues = Object();
				serverValues.location = str".$strModule."URL;
				serverValues.action = 'getmessage';
				
				var responseText = server.callSync(serverValues);
				if(!oCatenaApp.showResults(responseText))
				{
					return false;
				}
				return true;
			}
			$strScreen.register();
		";
		
		fwrite($file, $strFileContents);
		fclose($file);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function createServerAccessFile($strModulePath)
	{
		global $strModule;
		
		$strFolder = $strModulePath."/server";
		
		mkdir($strFolder);
	
		$fileName = $strFolder."/$strModule.php";
		
		$file = fopen($fileName, "w");
	
		$strFileContents = "<?
		require_once('../../../classes/include.php');
		require_once('../classes/class.$strModule.php');
		ClearCache();

		if(!isset(\$_GET['action']))
		{
			exit;
		};

		\$action = strtolower(\$_GET['action']);

		switch(\$action)
		{
        	case \"getmessage\":
        		\$oModule = $strModule::GetInstance();
        		\$oModule->GetData();
        		\$oModule->results->Send();
				exit;
		}			

		?>";
		
		fwrite($file, $strFileContents);
		fclose($file);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function createServerClassFile($strModulePath)
	{
		global $strModule;
		
		$strFolder = $strModulePath."/classes";
		
		mkdir($strFolder);
	
		$fileName = $strFolder."/class.$strModule.php";
		
		$file = fopen($fileName, "w");
	
		$strFileContents = "<?
			require_once('../../../classes/include.php');
			class $strModule
			{
				var \$results;
				function __construct()
				{
					\$this->results = new results();
				}
				function GetData()
				{
					return \$this->results->Set('true', \"This is your server side class message.\");
				}
				/*-------------------------------------------------------------------
					Returns the singleton for this class
				-------------------------------------------------------------------*/
				function GetInstance()
				{
					static \$obj;
					if(!isset(\$obj))
					{
						\$obj = new $strModule();
					}
					return \$obj;
				}
			}
		?>";
		
		fwrite($file, $strFileContents);
		fclose($file);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function createDefaultScreen($strModulePath)
	{
		global $strModule;
		
		$strFolder = $strModulePath."/screens";
		
		mkdir($strFolder);
	
		$fileName = $strFolder."/$strModule.xml";
		
		$file = fopen($fileName, "w");
	
		$strFileContents = "<?xml version=\"1.0\" encoding=\"utf-8\"?>
					<screen>
						<screenTitle>Module $strModule</screenTitle>
						<box>
							<id>".$strModule."_Box</id>
							<style>
								<backgroundColor>Secondary</backgroundColor>
								<left>0px</left>
								<top>0px</top>
								<width>600px</width>
								<height>200px</height>
								<color>Primary</color>
								<fontWeight>bold</fontWeight>
								<zIndex>1</zIndex>
							</style>
							<label>
								<text>Use this screen to begin creating your new module.</text>
								<style>
									<top>10px</top>
									<left>25px</left>
									<zIndex>2</zIndex>
								</style>
							</label>
						</box>
					</screen>";
		fwrite($file, $strFileContents);
		fclose($file);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function createMenuFile($strModulePath)
	{
		global $strModule;
		
		$strFolder = $strModulePath."/menu";
		
		mkdir($strFolder);
	
		$fileName = $strFolder."/menu.xml";
		
		$file = fopen($fileName, "w");
	
		$strFileContents = "<?xml version=\"1.0\" encoding=\"utf-8\"?>
					<menu>
						<SubMenu>
							<title>New Menu Section</title>
							<site>test</site>
							<tip>Tool tip for new menu title</tip>
							<menuItem>
								<title>$strModule Menu Item</title>
								<site>test</site>
								<tip>New Menu Sub Menu Item tooltip</tip>
							</menuItem>
						</SubMenu>
					</menu>";
	
		fwrite($file, $strFileContents);
	
		fclose($file);
		
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function IsValidName($strName)
	{
		return eregi("^[a-z0-9]{1,20}$",  $strName);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function IsValidDescription($strName)
	{
		return eregi("^[a-z0-9]{1,255}$",  $strName);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves a list of all modules
		\param active
			Retreive only the active 
		\return
	*/
	//--------------------------------------------------------------------------
	function GetModules($active = true)
	{
		if($active == true)
		{
			$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Enabled = 1";
		}
		else
		{
			$sql = "SELECT * FROM $this->table_Name";
		}

		return $this->db->Select($sql);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Creates an array of the available 
		\return
			An array containing all of the client files of the enabled
			modules. The files are in the format:
			/modules/'module name'/scripts/
	*/
	//--------------------------------------------------------------------------
	function GetClientFiles()
	{
		/*
			First, get all the directories in the modules folder, then
			get the scripts folders in the sub folders of each of those
		*/
		global $cfg;

		$strModuleRoot = $cfg['site']['modulePath'];
		
		$arModules = $this->GetModules();
		
		if(!isset($arModules))
		{
			return null;
		}
		
		$arModuleFiles = Array();
		
		foreach($arModules as $module)
		{
			$strModulePath = $strModuleRoot ."/". $module[$this->field_Name]."/scripts";
			
			$arFiles = file_list($strModuleRoot, $strModulePath);

			if($arFiles)
			{
				foreach($arFiles as $file)
				{
					if(eregi(".js$",  $file))
					{
						$arFile[0]['path'] = $file;
						$arModuleFiles[] = $arFile[0];
					}
				}
			}
		}
		return $arModuleFiles;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the menu files the client will use to display to display to the client
		\return
			an array of the menu.
	*/
	//--------------------------------------------------------------------------
	function GetMenu()
	{
		global $cfg;
		global $g_oUserSession;

		$xml = new DomDocument('1.0');

		$strModuleRoot = $cfg['site']['modulePath'];

		$arMenu = Array();
		$iMenu = 0;

		$siteType = $cfg['site']['type'];

		/*
			-	load the xml modules
			-	Create an array to have parsed by the client
		*/
		$arModules = $this->GetModules();
		
		if(sizeof($arModules) < 1)
		{
			$oXML = new XML;
			$oXML->outputXHTML(); 
			return false;
		}
		
		foreach($arModules as $module)
		{
			$strFileName = $strModuleRoot."/".$module[$this->field_Name]."/menu/menu.xml";
			
			if(!file_exists($strFileName))
			{
				continue;
			}

			$xml->load($strFileName);
		
			foreach($xml->getElementsBytagName('SubMenu') as $subMenu)
			{
				$bValidMenu = false;
				/*
					if the menu isn't deployed then we skip it
				*/
				$requiredSite = "";
				
				if($subMenu->getElementsByTagName('site')->item(0))
				{
					$requiredSite = strtolower($subMenu->getElementsByTagName('site')->item(0)->firstChild->nodeValue);
				}

				$depSite = SITE_NONE;
				
				switch($requiredSite)
				{
					case "dev":
						$depSite = SITE_DEV;
						break;
					case "test":
						$depSite = SITE_TEST;
						break;
					case "prod":
						$depSite = SITE_PRODUCTION;
						break;
				}
				
				if($siteType > $depSite)
				{
					continue;
				}

				$menuTitle = "";
				if($subMenu->getElementsByTagName('title')->item(0))
				{
					$menuTitle = $subMenu->getElementsByTagName('title')->item(0)->firstChild->nodeValue;
				}
            	
            	if(strlen($menuTitle) < 1)
            	{
            		continue;
            	}
            	
            	$menuTip = "";
            	
            	if($subMenu->getElementsByTagName('tip')->item(0))
            	{
            		$menuTip = $subMenu->getElementsByTagName('tip')->item(0)->firstChild->nodeValue;
            	}

            	if(strlen($menuTip) < 1)
            	{
            		continue;
            	}
            	
				/*
					Now we figure out if we can deploy each submenu.
					If there are no submenus then we do not display
					the menu title bar
					$iSubMenu = 0 is reserved for the submenu title element
				*/
				$iSubMenu = 1;

				$arMenuItems = $subMenu->getElementsBytagName('menuItem');
				
				$iSubMenuFound = false;

				foreach($arMenuItems as $menuItem)
				{
					$iSubMenuFound = true;
					
					
					$requiredSite = "";
					
					if($subMenu->getElementsByTagName('site')->item(0))
					{
						$requiredSite = strtolower($menuItem->getElementsByTagName('site')->item(0)->firstChild->nodeValue);
					}
	
					$depSite = SITE_NONE;
					
					switch($requiredSite)
					{
						case "dev":
							$depSite = SITE_DEV;
							break;
						case "test":
							$depSite = SITE_TEST;
							break;
						case "prod":
							$depSite = SITE_PRODUCTION;
							break;
					}
					
					if($siteType > $depSite)
					{
						continue;
					}
					
					$itemTitle = "";
					
					if($menuItem->getElementsByTagName('title')->item(0))
					{
						$itemTitle = $menuItem->getElementsByTagName('title')->item(0)->firstChild->nodeValue;
					}
            		
            		if(strlen($itemTitle) < 1)
  					{
  						continue;
  					}
  					
  					$itemTip = "";
            		
            		if($menuItem->getElementsByTagName('tip')->item(0))
            		{
            			$itemTip = $menuItem->getElementsByTagName('tip')->item(0)->firstChild->nodeValue;
            		}

            		if(strlen($itemTip) < 1)
  					{
  						continue;
  					}

  					$itemLink = "";
            		
            		if($menuItem->getElementsByTagName('link')->item(0))
            		{
            			$itemLink = $menuItem->getElementsByTagName('link')->item(0)->firstChild->nodeValue;
            		}

					/*
						HasRight is set to 0 if no rights are found. Which
						means the item will be displayed.
						If the item has one or more rights, if any one
						of those rights is assigned to the user hasRight
						is assigned a value of 1 and we don't check any
						more rights.
						If rights are found and the user has none of them
						then hasRight is set to 2 and the item is not
						displayed for the user.
					*/
					$itemRights = $menuItem->getElementsByTagName('right');

					$hasRight = 0;
					foreach($itemRights as $right)
					{
						$strRight = $right->firstChild->nodeValue;
						
            			if($g_oUserSession->HasRight($strRight))
						{
							$hasRight = 0;
							continue;
						}
						else
						{
							$hasRight = 1;
						}
            		}
            		
            		if($hasRight == 1)
            		{
            			continue;
            		}
            		
  					$arMenu[$iMenu][$iSubMenu]["title"] = $itemTitle;
	    			$arMenu[$iMenu][$iSubMenu]["tip"] = $itemTip;
	    			
	    			if(strlen($itemLink))
	    			{
	    				$arMenu[$iMenu][$iSubMenu]["link"] = $itemLink;
	    			}
					$iSubMenu++;
				}
				
				if($iSubMenuFound == true)
				{
					if($iSubMenu > 1)
					{
						$bValidMenu = true;
					}
				}
				else
				{
					$bValidMenu = true;
				}
				
				if($bValidMenu)
				{
					/*
						At least one of the sub items was added to this list
					*/
					$arMenu[$iMenu]["title"] = $menuTitle;
	    			$arMenu[$iMenu]["tip"] = $menuTip;
					$iMenu++;
				}
			}
		}
		
		/*
			Now sort the list
		*/

		for($x = 0; $x < sizeof($arMenu); $x++)
		{
			for($y = $x; $y < sizeof($arMenu); $y++)
			{
				$firstName = $arMenu[$x]["title"];
				$secondName = $arMenu[$y]["title"];
				
				switch($secondName)
				{
					case "Home":
						/*
							Swap them always
						*/
						$temp = $arMenu[$y];
						$arMenu[$y] = $arMenu[$x];
						$arMenu[$x] = $temp;
						break;
					case "Links":
						break;
					default:
						if($firstName == "Links")
						{
							$temp = $arMenu[$y];
							$arMenu[$y] = $arMenu[$x];
							$arMenu[$x] = $temp;
						}
						else if($firstName != "Home")
						{
							if(strcasecmp($firstName, $secondName) > 0)
							{
								$temp = $arMenu[$y];
								$arMenu[$y] = $arMenu[$x];
								$arMenu[$x] = $temp;
							}
						}
						break;
				}
			}
		}
		
		$iMenu = 0;
		$iSubmenu = 0;
		
		ClearCache();
		header("Content-Type: text/xml");

		$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n\t<menu>\n";
		
		while(isset($arMenu[$iMenu]))
		{
			$strResults.= "\t\t<SubMenu>\n";
			foreach($arMenu[$iMenu] as $fieldName => $val)
			{
				if(!is_array($val))
				{
					$strResults.= "<$fieldName>$val</$fieldName>";
				}
			}
			
			/*
				We start submenu at 1 because position 0 is the menu title
			*/
			$iSubMenu = 1;
			while(isset($arMenu[$iMenu][$iSubMenu]))
			{
				$strResults.= "\t\t\t<menuItem>";
				foreach($arMenu[$iMenu][$iSubMenu] as $fieldName => $val)
				{
					$strResults.= "<$fieldName>$val</$fieldName>";
				}
				$strResults.= "</menuItem>\n";
				$iSubMenu++;
			}	
			$strResults.= "\t\t</SubMenu>\n";
			$iMenu++;
		}
	
		$strResults.="</menu>";
		echo $strResults;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves an instance of this class
		\return
			An object of this class.
	*/
	//--------------------------------------------------------------------------
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new modules();
		}
		
		return $obj;
	}
}

?>