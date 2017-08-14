<?
	require_once('../../../classes/include.php');
	require_once('../classes/class.journal.php');
	require_once('../classes/class.journalCategory.php');
	require_once('../classes/class.db.php');

	/*--------------------------------------------------------------------------
		performs the server side functionality for message requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	----------------------------------------------------------------------------*/
	if(!isset($_GET['action']))
	{ 
		/*--------------------------------------------------------------------------
			action MUST be set.
		----------------------------------------------------------------------------*/
		exit;
	};

	$oJournal = new journal();   
	
	/*--------------------------------------------------------------------------
		Initializing Variables
	----------------------------------------------------------------------------*/
	
	$strJournalSubject = "";
	$strJournalBody = "";
	$strJournalCategory = "";
	$id = "";
	
	/*--------------------------------------------------------------------------
		Getting values for variables from Create Message screen
	----------------------------------------------------------------------------*/
	if(isset($_GET['Subject']))
	{
		$strJournalSubject = $_GET['Subject'];
	}

	if(isset($_GET['Body']))
	{
		$strJournalBody = $_GET['Body'];
	}
	
	if(isset($_GET['Category']))
	{
		$strJournalCategory = $_GET['Category'];
	}
	
	if(isset($_GET['journalId']))
	{
		$id = $_GET['journalId'];
	}	
	
	/*--------------------------------------------------------------------------
		We made the list lower case. All values
		in the switch($action) must be lower case
	----------------------------------------------------------------------------*/
	$action = strtolower($_GET['action']);
	
	switch($action)
	{
		case "modify":
			$oJournal->Modify($strJournalCategory, $id);
			break;
		case "disable":
			$oJournal->Disable($id);
			break;
		case "getjournalentries":
			GetJournalEntries();
			exit;
			break;
		case "journalcategory":
			$oJournalCategory = journalCategory::getInstance();
			
			$oJournalCategory->GetList();
			exit;
			break;
		default:
			$oJournal->results->Set('false', "Server side functionality not implemented.");
			break;
	}

	$oJournal->results->Send();

/*--------------------------------------------------------------------------
	GetJournalEntries returns to the client the list
	of messages based upon what requirements they have
----------------------------------------------------------------------------*/
function GetJournalEntries()
{
	global $g_oUserSession;
	$userID = $g_oUserSession->GetUserID();
	$oUser = cUserContainer::GetInstance();
	$rights = rights::GetInstance();
	$oXML = new XML();
	$userId = -1;
	$subjectId = -1;
	$posterId = -1;
	$JournalFromDate = "";
	$JournalToDate = "";
	$JournalId = -1;
	$db = journalData::GetInstance();
	$subjectType = "Subject";
	$orgId = -1;
    
    
    /*--------------------------------------------------------------------------
		Makes sure the user has the Journal Admin Right before
		allowing the user to get the list of journal entries. 
	----------------------------------------------------------------------------*/
	if(!$g_oUserSession->HasRight($rights->JOURNAL_Admin))
	{
		$oXML->outputXHTML();
		return false;
	}
    
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "subjectType":
					$subjectType = strtolower($val);
					break;
				case "subject":
					$userId = GetUserID($val);
					break;		
				case "fromDate":
					$JournalFromDate = $val;
					break;
				case "toDate":
					$JournalToDate = $val;
					break;
				case "journalId":
					$JournalId = $val;
					break;
				case "organization":
					$orgId = GetOrgID($val);
					break;
			}
		}
	}
	
	if($subjectType == "subject")
	{
		$subjectId = $userId;
	}
	else if($subjectType == "both")
	{
		$subjectId = $userId;
		$posterId = $userId;
	}
	else
	{
		$posterId = $userId;
	}
	
	/*--------------------------------------------------------------------------
		There must be a subject or a poster selected to proceed. 
	----------------------------------------------------------------------------*/
	 if ($JournalId < 0)
	 {
		if(($posterId < 0) && ($subjectId < 0))
		{
			if($orgId < 0)
			{
					
				/*--------------------------------------------------------------------------
					return empty XML set
				----------------------------------------------------------------------------*/
				$oXML->outputXHTML();
				return false;
			}
		}
	}
	/*--------------------------------------------------------------------------
		Admins should only be able to see things posted about and by employees in 
		their Organization and its children.
		- 	First make sure Admins can only see journal entries about people in 
			their Organization and its children.
		-	If the subject is not in the admin's org hierarchy, return an empty 
			XML set. 
	----------------------------------------------------------------------------*/
	if($subjectId > -1)
	{
		$subjectOrgId = $oUser->GetOrganization($subjectId);
		
		if(!$g_oUserSession->HasRight($rights->JOURNAL_Admin, $subjectOrgId))
		{
			/*
				return empty XML set
			*/
			$oXML->outputXHTML();
			return false;
		}
	}
	
	/*--------------------------------------------------------------------------
		Now make sure Admins can only see journal entries by people in 
		their Organization and its children.
		-	If the poster is not in the admin's org hierarchy, return an empty 
			XML set. 
	----------------------------------------------------------------------------*/
	if($posterId > -1)
	{
		$posterOrgId = $oUser->GetOrganization($posterId);
		
		if(!$g_oUserSession->HasRight($rights->JOURNAL_Admin, $posterOrgId))
		{
			/*
				return empty XML set
			*/
			$oXML->outputXHTML();
			return false;
		}
	}
	
	/*--------------------------------------------------------------------------
		The following sql string
		builds a list of documents. All of the numbered fields, journal_ID, 
		Journal_Category, user_ID, etc. are aliased with their name.
		The next part of the process is including the filters based upon what the 
		user requested.
	----------------------------------------------------------------------------*/
	$strSQL = "
				SELECT 
					tblJournal.*
					, tblJournalCategory.jrnCat_Name
				FROM 
					tblJournal
					LEFT JOIN 
						tblJournalCategory 
						ON 
							tblJournal.jrnCat_ID = tblJournalCategory.jrnCat_ID
				WHERE
					tblJournal.journal_Visible = 1
			";

	if(($posterId > -1) && ($subjectId > -1))
	{
		$strSQL .= " AND ( tblJournal.journal_Poster = $posterId OR
				tblJournal.journal_Subject = $posterId)";
	}
	else
	{
		if($posterId > -1)
		{
			$strSQL .= " AND tblJournal.journal_Poster = $posterId";
		}
		if($subjectId > -1)
		{
			$strSQL .= " AND tblJournal.journal_Subject = $subjectId";
		}
	}

	if(strlen($JournalFromDate))
	{
		$strSQL .= " AND tblJournal.journal_Date >= '$JournalFromDate'";
	}

	if(strlen($JournalToDate))
	{
		$strSQL.= " AND tblJournal.journal_Date <= '$JournalToDate'";
	}
	
	if($JournalId > -1)
	{
		$strSQL .= " AND tblJournal.journal_ID = $JournalId";
	}
	
	if($orgId > -1)
	{
		$arUsers = $oUser->GetOrganizationUsers($orgId);

		if($arUsers)
		{
			$strUsers = " AND (";
			$orgFirstTime = true;
			foreach($arUsers as $aUser)
			{
				if($orgFirstTime == true)
				{
					$orgFirstTime = false;
				}
				else
				{
					$strUsers .= " OR ";
				}
				
				$strUsers .= " tblJournal.journal_Subject = " . $aUser['user_ID'];
				$strUsers .= " OR tblJournal.journal_Poster = " . $aUser['user_ID'];
			}
	
			$strUsers.= ")";
			$strSQL .= $strUsers;
		}
	}
	
    
    /*--------------------------------------------------------------------------
		Order the results and output the list.
	----------------------------------------------------------------------------*/
    $strSQL .= " ORDER BY tblJournal.journal_ID";

    $arResults = $db->select($strSQL);

   	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arUser = $oUser->Get($arResults[$i]['journal_Poster']);
		$arResults[$i]['Poster'] = $arUser['user_Name'];

		$arUser = $oUser->Get($arResults[$i]['journal_Subject']);
		$arResults[$i]['Subject'] = $arUser['user_Name'];
	}
	
    $oXML = new XML;
	$oXML->serializeElement($arResults, "element");
	$oXML->outputXHTML();
}
?>

