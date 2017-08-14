<?
	require_once('../../../classes/include.php');
	require_once('class.journalCategory.php');
	require_once('class.db.php');
	
//--------------------------------------------------------------------------
/**
	\class journal
	\brief Contains functionality to perform journal operations.
	This class allows adding, hiding, and modifying journal entries including
	validations. Also contains functionality to verify that the user is 
	permitted to edit or hide journal entries.
*/
//--------------------------------------------------------------------------

/*--------------------------------------------------------------------------
	performs the server side functionality for message board requests
	Must load the header command like this or the data will
	not be re downloaded the next time it's called
----------------------------------------------------------------------------*/
class journal extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblJournal";
		$this->field_Id = "journal_ID";
		$this->field_Subject = "journal_Subject";
		$this->field_Category = "jrnCat_ID";
		$this->field_Create_Date = "journal_Date"; 
		$this->field_Body = "journal_Body";
		$this->field_Poster = "journal_Poster";
		$this->field_Visible = "journal_Visible";
		
		/*--------------------------------------------------------------------------
			Now set up the rights to administrate journal entries. 
		----------------------------------------------------------------------------*/
		$rights = rights::GetInstance();
		
		$this->rights_Add = $rights->JOURNAL_Standard;
		$this->rights_Remove = $rights->JOURNAL_Admin; 
		$this->rights_Modify = $rights->JOURNAL_Admin;
		
		$this->db = journalData::GetInstance(); 
	}
	/*-------------------------------------------------------------------
		On a successful/failure of a valid file upload
		this function will be called to display the set message to the user
		indicating the upload has pass/failed.
	-------------------------------------------------------------------*/
	function OutputFormResults($strValue, $strMsg)
	{
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oAddJournal)
				{
					parent.oAddJournal.DisplayResults(\"$strValue||$strMsg\");
				}
			};
			</script></Head>
			<body>$strMsg</body>
			</html>
			";

		return $strValue == 'true';
	}
	//--------------------------------------------------------------------------
	/**
		\brief Adds a journal entry to the database
		\param strJournalSubject
				The user entered subject of the journal entry 
				(The person the journal entry is about). 
		\param strJournalBody 
				The user entered journal body.
		\param strJournalCategory
				The user selected journal category. 
		\return
			-	True
					The journal entry will be uploaded to the database.
			-	False
					The journal entry will not be uploaded to the database.					
	*/
	//--------------------------------------------------------------------------
	function Add()
	{
		$strJournalSubject = "";
		$strJournalBody = "";
		$strJournalCategory = "";
		
		if(isset($_POST['Subject']))
		{
			$strJournalSubject = $_POST['Subject'];
		}

		if(isset($_POST['Category']))
		{
			$strJournalCategory = $_POST['Category'];
		}

		if(isset($_POST['Body']))
		{
			$strJournalBody = $_POST['Body'];
		}
		
		global $g_oUserSession;
		$ojournalCategory=journalCategory::GetInstance();
		$mailer = new email();
		$userID = GetUserID($strJournalSubject);
        
        /*--------------------------------------------------------------------------
        	Make sure the user has the right/org combination for adding this journal 
        	entry.
        ----------------------------------------------------------------------------*/		
		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->OutputFormResults('false', $g_oUserSession->results->GetMessage());
		}
				
		/*--------------------------------------------------------------------------
			Make sure the names are valid
		----------------------------------------------------------------------------*/
		$strJournalBody = CleanupSmartQuotes($strJournalBody);
		$strJournalBody = trim($strJournalBody); 
		
		if(!$this->IsValidBody($strJournalBody))
		{
			$this->OutputFormResults('false', $this->results->GetMessage());
			return false;
		}
		
		/*--------------------------------------------------------------------------
			A user must be selected as the subject of the journal entry
		----------------------------------------------------------------------------*/		
		if($userID < 0)
		{
			return $this->OutputFormResults('false', "Invalid user.");
		}
		
		/*--------------------------------------------------------------------------
			A category must be assigned to the journal entry
		----------------------------------------------------------------------------*/
		$catID = $ojournalCategory->GetID($strJournalCategory);
		
		if($catID < 0)
		{
			return $this->OutputFormResults('false', "Invalid category.");
		}
		
		/*--------------------------------------------------------------------------
			build the record
		----------------------------------------------------------------------------*/
		$arInsert = array();
		$arInsert[$this->field_Subject] = $userID;//$strJournalSubject;
		$arInsert[$this->field_Body] = $strJournalBody;
		$arInsert[$this->field_Create_Date] = Date("c");
		$arInsert[$this->field_Poster] = $g_oUserSession->GetUserID();
		$arInsert[$this->field_Category] = $catID;
				
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->OutputFormResults('false', "Unable to add your journal entry due to database error.");
		}
		
		
		/*--------------------------------------------------------------------------
			Sends an email to the user telling them their journal entry was
			submitted. The email contains the entire entry so they have a 
			record of its submission.
		----------------------------------------------------------------------------*/		
		$strDate = date("F j, Y");
		$strJournalBody = stripslashes($strJournalBody);
		$strDisplayBody = nl2br($strJournalBody);
		$strJournalSubject = str_replace(".", " ", $strJournalSubject);	
		$strJournalSubject = ucwords($strJournalSubject);
		$strEmailSubject = "Your journal entry has been submitted";
		$strEmailBody = "Your journal entry has been submitted. You may keep this email as 
		a record of your journal entry, which follows in its entirety:<br><br> 
		<b>Subject Employee:</b> $strJournalSubject<br><br>
		<b>Date of Journal Entry:</b> $strDate<br><br>
		<b>Event Description:</b> $strDisplayBody";
				
		if($mailer->SendToOwner($strEmailSubject, "$strEmailBody") == 0)
		{
			$strResult = "Your journal entry has been added.";
		}
		else
		{
			$strResult = "Your journal entry was added, but an email was not sent [" . $mailer->results->GetMessage()."].";
		}

		return $this->OutputFormResults('true', $strResult);
	}
	//--------------------------------------------------------------------------
	/**
		\brief Updates an existing journal entry within the database
		\param strJournalCategory
				The user selected journal category. 
		\param id 
				The journal id as assigned in the database.
		\return
			-	True
					The changes are accepted and the journal entry 
					will be uploaded to the database.
			-	False
					The changes are not accepted and the 
					journal entry will not be uploaded to the database.				
	*/
	//--------------------------------------------------------------------------
	function Modify($strJournalCategory, $id)
	{
		global $g_oUserSession;
		$rights = rights::GetInstance();
		$ojournalCategory=journalCategory::GetInstance();
        
        /*--------------------------------------------------------------------------
			Makes sure the user has the Journal Admin Right before
			allowing the user to Modify journal entries. 
		----------------------------------------------------------------------------*/
		if(!$g_oUserSession->HasRight($this->rights_Modify))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
        
        /*--------------------------------------------------------------------------
			The passed in journal ID must exist in the database and must be numeric
			to modify a journal entry.
		----------------------------------------------------------------------------*/
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid journal id.");
		}
		
		$arJrnRecord = $this->Get($id);
		
		/*--------------------------------------------------------------------------
			A category must be assigned to the journal entry
		----------------------------------------------------------------------------*/
		$catID = $ojournalCategory->GetID($strJournalCategory);
		
		if($catID < 0)
		{
			return $this->results->Set('false', "Invalid category.");
		}
	
		/*--------------------------------------------------------------------------
			Build the record
		----------------------------------------------------------------------------*/
		$arUpdate = array();
		$arUpdate[$this->field_Category] = $catID;
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;
		
		$retCode = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($retCode)
		{
			case 0:
				return $this->results->Set('true', "No changes were made to the journal entry");
				break;
			case 1:
				return $this->results->Set('true', "Your changes have been applied to the journal entry");
				break;
			case -1:
				return $this->results->Set('false', $this->db->results->GetMessage());
				break;
		}
		
		return $this->results->Set('false', "Unable to update the journal entry due to database error.");
	}
	
	
	//--------------------------------------------------------------------------
	/**
		\brief Hides the journal entry from searches. It appears to delete the
				journal entry in the application, but the journal entry actually still 
				exists and can be accessed by someone with database access. This prevents
				admins from permanantly deleting journal entries that they may want to 
				hide for some reason.
		\param id 
				The journal id as assigned in the database.
		\return
			-	True
					The journal entry appears to be deleted in the 
					application because it is hidden from searches, 
					however it still exists in the database.
			-	False
					The journal entry still appears in searches and 
					does not appear to be deleted.				
	*/
	//--------------------------------------------------------------------------
	function Disable($id)
	{	
		global $g_oUserSession;
		$rights = rights::GetInstance();
		$strVisible = 0;
		
		/*--------------------------------------------------------------------------
			Makes sure the user has the Journal Admin Right before
			allowing the user to disable journal entries. 
		----------------------------------------------------------------------------*/
		if(!$g_oUserSession->HasRight($this->rights_Remove))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		/*--------------------------------------------------------------------------
			The passed in journal ID must exist in the database and must be numeric
			to disable a journal entry. 
		----------------------------------------------------------------------------*/
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid journal id.");
		}
		
		$arJrnRecord = $this->Get($id);
		
		$arUpdate = array();
		$arUpdate[$this->field_Visible] = $strVisible;
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;
		
		$retCode = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($retCode)
		{
			case 0:
				return $this->results->Set('true', "Unable to remove the journal entry due to database error.");
				break;
			case 1:
				return $this->results->Set('true', "The journal entry has been removed successfully.");
				break;
			case -1:
				return $this->results->Set('false', $this->db->results->GetMessage());
				break;
		}
		
		return $this->results->Set('false', "Unable to remove the journal entry due to database error.");
	}
    
	//--------------------------------------------------------------------------
	/**
		\brief This function validates that the journal body submitted is valid
		\param strJournalBody 
				The user entered journal body. 
		\return
			-	True
					The journal body is valid.
			-	False
					The journal body is invalid.					
	*/
	//--------------------------------------------------------------------------
	function IsValidBody($strJournalBody)
	{
		/*--------------------------------------------------------------------------
			May contain only a-z 0-9 A-Z spaces and special characters	\',;:/()–.?!"
			Allows tabs and new lines (Carriage returns)
			Can be up to 65536 characters
			Can not start with a space
			Must be at least 3 characters
			Added the trim so the regExpression doesn't have to be so 
			complicated
		----------------------------------------------------------------------------*/	
		$strJournalEntry = trim($strJournalBody);
		
		if (strlen ($strJournalEntry)>65536)
		{
			return $this->results->Set('false', "Please submit a shorter journal entry");
		}
			
		if(eregi("^[a-z0-9 \n\r.!?',\";:/$@%#_/()\\-]{3,}$",  $strJournalEntry))
		{
			return $this->results->Set('true', "Valid message body.");
		}
		
		return $this->results->Set('false', "Journal Entry is less than 3 characters or contains an invalid character ` ~  ^ * = + | [ ] { } < > &");
		
	}
			
	//--------------------------------------------------------------------------
	/**
		\brief Returns the singleton for this class				
	*/
	//--------------------------------------------------------------------------
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new journal();
		}
		
		return $obj;
	}
}

?>
