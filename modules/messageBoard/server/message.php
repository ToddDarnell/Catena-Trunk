<?
	require_once('../classes/class.messageBoard.php');
	require_once('../classes/class.db.php');

	/*--------------------------------------------------------------------------
		performs the server side functionality for message requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	----------------------------------------------------------------------------*/
	
	$msg = messageBoard::GetInstance();
	
	if(!isset($_GET['action']))
	{ 
		/*--------------------------------------------------------------------------
			action MUST be set.
		----------------------------------------------------------------------------*/
		exit;
	};
	
	$oMessage = new messageBoard();   
	
	/*--------------------------------------------------------------------------
		Initializing Variables
	----------------------------------------------------------------------------*/
	
	$MessageSubject = "";
	$MessageBody = "";
	$Exp_Date = "";
	$Organization =  "";
	$Priority = "";
	$id = "";
	
	/*--------------------------------------------------------------------------
		Getting values for variables from Create Message screen
	----------------------------------------------------------------------------*/
	if(isset($_GET['MsgSubject']))
	{
		$MessageSubject = $_GET['MsgSubject'];
	}
	
	if(isset($_GET['MsgBody']))
	{
		$MessageBody = $_GET['MsgBody'];
	}
	
	if(isset($_GET['MsgExpDate']))
	{
		$Exp_Date = $_GET['MsgExpDate'];
	}
	
	if(isset($_GET['MsgOrg'])) 
	{
		$Organization = $_GET['MsgOrg'];
	}
	
	if(isset($_GET['MsgPri']))
	{
		$Priority = $_GET['MsgPri'];
	}	
	
	if(isset($_GET['messageId']))
	{
		$id = $_GET['messageId'];
	}	
	
	/*--------------------------------------------------------------------------
		We made the list lower case. All values
		in the switch($action) must be lower case
	----------------------------------------------------------------------------*/
	$action = strtolower($_GET['action']);

	switch($action)
	{
		case "add":
			$oMessage->Add($MessageSubject, $MessageBody, $Exp_Date, $Organization, $Priority);
	        $oMessage->SetOwnerViewed();
			break;
		case "view":
			/*--------------------------------------------------------------------------
				Unread inform has been added here to run when a user views a message.
				This function will only run once per day, so it will only run when the
				first user of the day views a message for the first time.
				This process is transparent to the user. 
			----------------------------------------------------------------------------*/
			if($oMessage->View($id))
			{
				GetMessageList();
			}
			exit;
		case "modify":
			$oMessage->Modify($MessageSubject, $MessageBody, $Exp_Date, $Organization, $Priority, $id);
			break;
		case "remove":
			$oMessage->Remove($id);
			break;
		case "getmessagelist":
			GetMessageList();
			exit;
		case "getmessageauditlist":
			GetMessageAuditList();
			exit;
			break;
	    case "getunreadmessages":
			GetUnreadMessages();
			exit;
			break;
	    case "getimportantmessages":
	    	UnreadInform();
			GetImportantMessages();
			exit;
			break;
	    case "getusersmessages":
			GetUsersMessages();
			exit;
			break;
		case "unreadinform":
	    	UnreadInform();
			exit;
		default:
			$oMessage->results->Set('false', "Server side functionality not implemented.");
			break;
	}
	
	$oMessage->results->Send();

/*--------------------------------------------------------------------------
	GetMessageList returns to the client the list
	of messages based upon what requirements they have
----------------------------------------------------------------------------*/
function GetMessageList()
{
	$msgFromDate = "";
	$msgToDate = "";
	$messageId = "";
    $strOrg = "";
    $oOrganization = organization::GetInstance();
    $oUser = cUserContainer::GetInstance();
	$whereClause = array();
    $db = messageBoardData::GetInstance();
    
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "poster":
					$whereClause['tblMessage.user_ID'] = GetUserID($val);
					break;
				case "subject":
					$whereClause['tblMessage.msg_subject'] = $val;
					break;
				case "createDate":
					$whereClause['tblMessage.msg_create_date'] = $val;
					break;
				case "organization":
					$strOrg = $val;
					break;
				case "priority":
					$whereClause['tblMessagePriority.msgPri_name'] = $val;
					break;
				case "body":
					$whereClause['tblMessage.msg_body'] = $val;
					break;	
				case "fromDate":
					$msgFromDate = $val;
					break;
				case "toDate":
					$msgToDate = $val;
					break;
				case "messageId":
					$messageId = $val;
					break;
			}
		}
	}
	
	/*--------------------------------------------------------------------------
		The following sql string
		builds a list of documents. All of the numbered fields, msg_ID, org_ID, user_ID,
		etc are aliased with their name.
		The next part of the process is including the filters based upon what the user requested
	----------------------------------------------------------------------------*/
	$strSQL = "
		SELECT
			tblMessagePriority.msgPri_name
			, tblMessage.*
		FROM
			tblMessage
				LEFT JOIN tblMessagePriority ON tblMessage.msgPri_ID = tblMessagePriority.msgPri_ID
		";
		
	/*--------------------------------------------------------------------------
		Try to find a record which has the matching requirements from the user
	----------------------------------------------------------------------------*/
	$arWhere = array();
	
	$firstTime = true;
		
	foreach($whereClause as $field => $val)
	{
		if($firstTime)
		{
			$strSQL .= " WHERE ";
			$firstTime = false;
		}
		else
		{
			$strSQL.= " AND ";
		}
		
		if($val != "")
		{
			$strSQL .= "$field like '%$val%'";
		}
	}
	
	if(strlen($msgFromDate))
	{
		if($firstTime)
		{
			$strSQL .= " WHERE ";
			$firstTime = false;
		}
		else
		{
			$strSQL.= " AND ";
		}
		$strSQL .= "tblMessage.msg_create_date >= '$msgFromDate'";
	}

	if(strlen($msgToDate))
	{
		if($firstTime)
		{
			$strSQL .= " WHERE ";
			$firstTime = false;
		}
		else
		{
			$strSQL.= " AND ";
		}
		
		$strSQL.= "tblMessage.msg_create_date <= '$msgToDate'";
	}
	
	if(strlen($messageId))
	{
		if($firstTime)
		{
			$strSQL .= " WHERE ";
			$firstTime = false;
		}
		else
		{
			$strSQL.= " AND ";
		}
		
		$strSQL.= "tblMessage.msg_ID = $messageId";
	}

    if(strlen($strOrg))
    {
        $orgId = $oOrganization->GetID($strOrg);

        if($firstTime == true)
        {
            $strSQL.= " WHERE (tblMessage.org_ID = $orgId";
        }
        if($firstTime == false)
        {
            $strSQL.= " AND (tblMessage.org_ID = $orgId";
        }

        $arChildren = $oOrganization->GetChildren($strOrg);

        foreach($arChildren as $org)
        {
            $strSQL.= " OR";

            $firstTime = false;
            $strSQL .= " tblMessage.org_ID = " . $org['org_ID']."";
        }
        $strSQL.= ")";
    }  

    $strSQL .= " ORDER BY tblMessage.msg_ID";

	$arResults = $db->select($strSQL);


	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arUser = $oUser->Get($arResults[$i]['user_ID']);
		$arResults[$i]['user_Name'] = $arUser['user_Name'];

		$arOrg = $oOrganization->Get($arResults[$i]['org_ID']);
		$arResults[$i]['org_Short_Name'] = $arOrg['org_Short_Name'];
	}

	$oXML = new XML;
	$oXML->serializeElement($arResults, "element");
	$oXML->outputXHTML();
}

/*--------------------------------------------------------------------------
	GetMessageAuditList returns to the client the list
	of messages based upon what requirements they have
----------------------------------------------------------------------------*/
function GetMessageAuditList()
{
    global $g_oUserSession;
    $db = messageBoardData::GetInstance();
    $oXML = new XML;
    $msgFromDate = "";
	$msgToDate = "";
	$messageId = "";
	$whereClause = array();
    $userId = -1;
    $oOrganization = organization::GetInstance();
    $oUser = cUserContainer::GetInstance();
    $oResults = new results;
    					
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
                case "employee":
                    $userId = GetUserID($val);
					break;
				case "subject":
					$whereClause['tblMessage.msg_subject'] = $val;
					break;
				case "fromDate":
					$msgFromDate = $val;
					break;
				case "toDate":
					$msgToDate = $val;
					break;
            }
		}
	}

    if($userId < 0)
    {
        $oXML->outputXHTML();        
        return false;
    }

    $userOrg = $oUser->GetOrganization($userId);
    $orgID = GetOrgID($userOrg);

    $strSQL =  "SELECT * FROM tblMessage";

    $arWhere = array();

    $firstTime = true;

    foreach($whereClause as $field => $val)
    {
        if($firstTime)
        {
            $strSQL .= " WHERE ";
            $firstTime = false;
        }
        else
        {
            $strSQL.= " AND ";
        }

        if($val == "")
        {
            $strSQL .= "$field like ''";
        }
        else
        {
            $strSQL .= "$field like '%$val%'";
        }
    }
    if(strlen($msgFromDate))
    {
        if($firstTime)
        {
            $strSQL .= " WHERE ";
            $firstTime = false;
        }
        else
        {
            $strSQL.= " AND ";
        }
        $strSQL .= "tblMessage.msg_create_date >= '$msgFromDate'";
    }

    if(strlen($msgToDate))
    {
        if($firstTime)
        {
            $strSQL .= " WHERE ";
            $firstTime = false;
        }
        else
        {
            $strSQL.= " AND ";
        }

        $strSQL.= "tblMessage.msg_create_date <= '$msgToDate'";
    }
    
	/*--------------------------------------------------------------------------
	    Only look for messages that are in directed toward the user's organization
	    their parent organizations, or all.
	----------------------------------------------------------------------------*/
    if(strlen($orgID))
    {
        if($firstTime)
        {
            $strSQL .= " WHERE (";
            $firstTime = false;
        }
        else
        {
            $strSQL.= " AND (";
        }

        $strSQL.= "tblMessage.org_ID = $orgID";
        $iParent = $oOrganization->GetParent($orgID);
    
        while($iParent != -1)
        {
            $strSQL.= " OR tblMessage.org_ID = " . $iParent;
            $iParent = $oOrganization->GetParent($iParent);
        }
        $strSQL.= ")";
    }
    $strSQL .= " ORDER BY tblMessage.msg_ID";

    $arMessages = $db->Select($strSQL);

    $arReturnMessages = array();      //  list of returned messages to user

    /*--------------------------------------------------------------------------
        Retrive all messages for this user, then add a read date and time or mark 
        as unread if the user has not read the message. 
    ----------------------------------------------------------------------------*/
    $strSQL =  "SELECT * FROM jMessageViewed WHERE user_ID = $userId";
    $arReadMessages = $db->Select($strSQL);

    foreach($arMessages as $msg)
    {
        /*--------------------------------------------------------------------------
            -	Adds all messages to the array
            -   Tacks the date read onto read messages
            -	At the end we'll do a raw xml dump
        ----------------------------------------------------------------------------*/
        $addMessage = array();
        $addMessage['msg_subject'] = $msg['msg_subject'];
        $addMessage['msg_create_date'] = $msg['msg_create_date'];
        $addMessage['msg_exp_date'] = $msg['msg_exp_date'];
        $addMessage['msg_read_date'] = "";

        for($i = 0; $i < sizeof($arReadMessages); $i++)
        {
            if($arReadMessages[$i]['msg_ID'] == $msg['msg_ID'])
            {
                $addMessage['msg_read_date'] = $arReadMessages[$i]['jMsgRead_Time'];
                break;
            }
        }
        $arReturnMessages['element'][] = $addMessage;
    }
    $oXML->serialize($arReturnMessages);
    $oXML->outputXHTML();
    return true;
}

/*--------------------------------------------------------------------------
	GetUnreadMessages returns to the client the list
	of messages that are unread for the passed in User ID.
----------------------------------------------------------------------------*/
function GetUnreadMessages()
{
	global $g_oUserSession;
    $userID = $g_oUserSession->GetUserID();
    $oOrganization=organization::GetInstance();
    $oUser = cUserContainer::GetInstance();
    $orgID = $oOrganization->GetID($g_oUserSession->GetOrganization());
    
    $db = messageBoardData::GetInstance();

	/*--------------------------------------------------------------------------
		The following sql string retrieves all of the unread messages for the 
        passed in User ID and builds a list of the unread messages. 
	----------------------------------------------------------------------------*/
	$strSQL = "
				SELECT
					DISTINCT
					tblMessage.msg_subject
					, tblMessage.msg_ID
					, tblMessage.msg_create_date
					, tblMessage.msg_exp_date
					, tblMessage.user_ID
               	FROM
               		tblMessage
               			LEFT JOIN
               				jMessageViewed ON tblMessage.msg_ID = jMessageViewed.msg_ID
               	WHERE
               		tblMessage.msg_ID NOT IN 
	           		(
	                    SELECT
	                    	tblMessage.msg_ID
	                    FROM
	                    	tblMessage
	                    	LEFT JOIN
	                    		jMessageViewed ON tblMessage.msg_ID = jMessageViewed.msg_ID
	                    WHERE
	                    	jMessageViewed.user_ID = $userID                  
	          		)";	 

	/*--------------------------------------------------------------------------
			Get only records in the users organization and its parent organizations
	----------------------------------------------------------------------------*/
    $strSQL.= " AND (tblMessage.org_ID = $orgID";
    $iParent = $oOrganization->GetParent($orgID);

    while($iParent != -1)
    {
        $strSQL.= " OR tblMessage.org_ID = " . $iParent;
        $iParent = $oOrganization->GetParent($iParent);
    }
    $strSQL.= ")";
    
    $strSQL .= " ORDER BY tblMessage.msg_ID";

	$arResults = $db->select($strSQL);
	
	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arUser = $oUser->Get($arResults[$i]['user_ID']);
		
		$arResults[$i]['user_Name'] = $arUser['user_Name'];
	}

	$oXML = new XML;
	$oXML->serializeElement($arResults, "element");
	$oXML->outputXHTML();
}
/*--------------------------------------------------------------------------
	GetImportantMessages returns to the client a list of random messages
	with no expiration date and high priority.
----------------------------------------------------------------------------*/
function GetImportantMessages()
{	
	global $g_oUserSession;    
	$oOrganization=organization::GetInstance();
    $orgID = $oOrganization->GetID($g_oUserSession->GetOrganization());
    $iReminders = 5;
    $db = messageBoardData::GetInstance();
	$oUser = cUserContainer::GetInstance();
    
    if(isset($_GET['total']))
    {
    	$iReminders = $_GET['total'];
    }
    
	/*--------------------------------------------------------------------------
		The following sql string retrieves a random list of messages that have 
        their Priority set to "High" and have no Expiration Date and builds a 
        list of the returned messages: 
        Variable numbers of reminders are displayed based on whether the user has
        any unread messages. The number or reminders to display is passed in from 
        the referring script as 'total'.
        The list of messages is pulled from messages that are in the user's 
        organization or their parent organizations only so that they only get
        relevant messages. 
	----------------------------------------------------------------------------*/
	$strSQL = "
				SELECT
	    			tblMessagePriority.msgPri_name
	    			, tblMessage.*
				FROM
					tblMessage
					LEFT JOIN
						tblMessagePriority ON tblMessage.msgPri_ID = tblMessagePriority.msgPri_ID
				WHERE
					tblMessage.msgPri_ID = 2 
					AND
					tblMessage.msg_exp_date = 0000-00-00
               ";				
               
	/*--------------------------------------------------------------------------
		Get only records in the users organization and its parent organizations
	----------------------------------------------------------------------------*/
    $strSQL.= " AND (tblMessage.org_ID = $orgID";
    $iParent = $oOrganization->GetParent($orgID);

    while($iParent != -1)
    {
        $strSQL.= " OR tblMessage.org_ID = " . $iParent;
        $iParent = $oOrganization->GetParent($iParent);
    }
    $strSQL.= ")";
    
    /*--------------------------------------------------------------------------
		Display the results in random order. Limit the number of results 
		displayed by the amount passed in by variable $strReminders.
	----------------------------------------------------------------------------*/
    $strSQL .= " ORDER BY RAND() LIMIT $iReminders";

	$arResults = $db->select($strSQL);

	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arUser = $oUser->Get($arResults[$i]['user_ID']);
		$arResults[$i]['user_Name'] = $arUser['user_Name'];
	}

	$oXML = new XML;
	$oXML->serializeElement($arResults, "element");
	$oXML->outputXHTML();
}

/*--------------------------------------------------------------------------
	GetUsersMessages returns to the client the list
	of messages that were posted by the passed in User ID.
----------------------------------------------------------------------------*/
function GetUsersMessages()
{
	global $g_oUserSession;
    $userID = $g_oUserSession->GetUserID();
	$db = messageBoardData::GetInstance();
    $oOrganization=organization::GetInstance();
    $oUser = cUserContainer::GetInstance();

	/*--------------------------------------------------------------------------
		The following sql string retrieves all of the messages that were posted 
        by the passed in User ID and builds a list of the returned messages. 
	----------------------------------------------------------------------------*/
	$strSQL = "	SELECT
    				tblMessagePriority.msgPri_name
	    			, tblMessage.*
               	FROM
               		tblMessage
					LEFT JOIN
						tblMessagePriority ON tblMessage.msgPri_ID = tblMessagePriority.msgPri_ID
				WHERE
					tblMessage.user_ID = $userID 
				ORDER BY msg_ID";				
	
	$arResults = $db->select($strSQL);

	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arUser = $oUser->Get($arResults[$i]['user_ID']);
		$arResults[$i]['user_Name'] = $arUser['user_Name'];

		$arOrg = $oOrganization->Get($arResults[$i]['org_ID']);
		$arResults[$i]['org_Short_Name'] = $arOrg['org_Short_Name'];
	}

	$oXML = new XML;
	$oXML->serializeElement($arResults, "element");
	$oXML->outputXHTML();
}

/*--------------------------------------------------------------------------
	Sends an email to admin users of an organization informing them when
	there are messages that have not been read after 7 days from their 
	initial post date. Also sends an email to each user that has unread 
	emails telling them to go to Message Main and read their messages.
----------------------------------------------------------------------------*/
function UnreadInform()
{
	
	$oOrganization = organization::GetInstance();
	$db = messageBoardData::GetInstance();
	$oRights = rights::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();
	$oSystemVars = systemVariables::GetInstance();
	$oMessageBoard = messageBoard::GetInstance();
	$oUser = cUserContainer::getInstance();
	
    $oMailUser = new email();
	$oMailAdmin = new email();

    $arUserSent = array();			//	Keeps track of when we've sent an email to user the first time
    $arUserCount = array();			//	The list of users who have unread messages
	$arAdminOrgs = array();
	
	$strUserEmailSubject = "You have unread messages";
	
	$strUserEmailBody = "You have unread messages more than seven days old.
							Please go to the Message Board Main page to view your
							unread messages.";

	/*--------------------------------------------------------------------------
		The first thing we want to do is determine if we've already performed
		this check today.
	----------------------------------------------------------------------------*/
	$checkDate = $oSystemVars->GetValue("UnreadMessages");
	$today = date("Y-m-d");

	if(!($checkDate <  $today ))
	{
		return;
	}
	
	$oMessageBoard->DeleteOldMessages();
	
	/*--------------------------------------------------------------------------
		The day is before today, update the record
	----------------------------------------------------------------------------*/
	$oSystemVars->Set("UnreadMessages", $today);
	$timer = new cTimer();
	
	$timer->start();
	/*--------------------------------------------------------------------------
		Retrieves all users that have the Message Board Admin Right or 
		System Global Admin Right.
		- Only gets users that are set to active.
		- Results are ordered by username.
	----------------------------------------------------------------------------*/
	$arAdmins = $oSystemAccess->UsersHaveRight($oRights->MSG_BOARD_Admin);

	if(sizeof($arAdmins) < 1)
	{
		return;
	}
	
	/*--------------------------------------------------------------------------
		Gets all of the children of the organizations assigned to the Admin users. 
	----------------------------------------------------------------------------*/
	for($i = 0; $i < sizeof($arAdmins); $i++) 
	{
		$userID = $arAdmins[$i]['user_ID'];
		$arAdminOrgs[] = $oSystemAccess->GetRightAssignedOrgs($userID, $oRights->MSG_BOARD_Admin);
	}
	
	if(sizeof($arAdminOrgs) < 1)
	{
		return;
	}

	/*------------------------------------------------------------------------------
		Gets all users in the admin's passed in organization.
		- Only gets users that are set to active.
		- Users are ordered alphabetically so that the list sent to 
		  the Admin is easy to read.
	-------------------------------------------------------------------------------*/
	$arAdminUsers = Array();
	
	foreach($arAdminOrgs as $arOneAdminOrgs)
	{
		$arAdminUsers[] = $oUser->GetOrganizationUsers($arOneAdminOrgs);
	}
	
	if(sizeof($arAdminUsers) < 1)
	{
		return;
	}

	/*--------------------------------------------------------------------------
		Query the user's found in the admin's organization and
		see if they have any undread messages older than 6 days
		-	send an email to the user one time if they have
			unread messages.
	-------------------------------------------------------------------------------*/
	for($iAdmin = 0; $iAdmin < sizeof($arAdmins); $iAdmin++) 
	{
		$strAdminName = $arAdmins[$iAdmin]['user_Name'];
		
		$oMailUser = new email();
		$oMailUser->AddReplyTo($oUser->GetEmail($strAdminName), $strAdminName);
		
		$arUserCount = array();
		for($iUser = 0; $iUser < sizeof($arAdminUsers[$iAdmin]); $iUser++)
		{
			$userID = $arAdminUsers[$iAdmin][$iUser]['user_ID'];
			$userName = $arAdminUsers[$iAdmin][$iUser]['user_Name'];
			$orgID = $arAdminUsers[$iAdmin][$iUser]['org_ID'];
			
			$strWhere = "tblMessage.msg_ID NOT IN 
							(
								SELECT
									tblMessage.msg_ID
								FROM
									tblMessage
								LEFT JOIN
									jMessageViewed ON tblMessage.msg_ID = jMessageViewed.msg_ID
								WHERE
									jMessageViewed.user_ID = $userID
							)";
							
			/*--------------------------------------------------------------------------
				Make sure that the unread message notifications are only sent to users in 
				the organization the message was directed to and below, and only to users 
				who actually have not read the message instead of to all people in the 
				organization the message was sent to or the organization of the admin.
			----------------------------------------------------------------------------*/
	        $strWhere.= " AND (tblMessage.org_ID = $orgID";
	        $iParent = $oOrganization->GetParent($orgID);
	    
	        while($iParent != -1)
	        {
	            $strWhere.= " OR tblMessage.org_ID = " . $iParent;
	            $iParent = $oOrganization->GetParent($iParent);
	        }
	        
	        $strWhere.= ") 
	        AND CURDATE() >= ADDDATE(tblMessage.msg_create_date, INTERVAL 7 DAY)";
			        
			$iCount = $db->Count("tblMessage", $strWhere);
			if($iCount > 0)
			{
				if($oSystemAccess->HasRight($userName, $oRights->MSG_BOARD_Standard))
				{
					if(!isset($arUserSent[$userName]))
					{
						/*
							We want the user flagged as being evaluated, but
							we only want to notify the admin if there are users
							who have the message board right to view messages.
							It makes no sense to tell a user they have unread
							messages if they can not view messages
						*/
						$arUserSent[$userName] = true;
						
						$oMailUser->SystemToUser($userName, $strUserEmailSubject, $strUserEmailBody);
					}

					$arUserCount[$userName] = $iCount;
				}
			}
		}
		
		$iUserCount = sizeof($arUserCount);
		
		if($iUserCount > 0)
		{
			$strSubject = "There are unread messages in your organization";
			$strBody = "<p>The following $iUserCount users have unread messages greater than 
				7 days old. Please go to the Audit Messages screen in Catena for further information.</p><div>";

			foreach($arUserCount as $strUser => $iCount)
			{
				$strUser = str_replace(".", " ", $strUser);	
				$strUser = ucwords($strUser);
				$strShowS = ($iCount > 1) ? 's' : '';
				$strBody.= "$strUser - $iCount unread message$strShowS<br />";
			}
			$strBody .= "\r\n</div>";
			$oMailAdmin->SystemToUser($strAdminName, $strSubject, $strBody);
		}

	}
	
}	
?>

