<?
require_once("class.phpmailer.php");
require_once("class.result.php");
require_once("class.usersession.php");

/**
	\class email
	\brief Sends an e-mail to one or more users depending upon the criteria.
	
	-	The following list keeps track of the return values available to the various send
	functions. 0 and negative numbers are the same throughout the functions.
	
	-	Instead of listing the return values at the beginning of each function
	the return values are listed here.

	-	return
		-	-9	Email not sent. Email subsystem error.
		-	-8	Email not sent. Invalid destination user.
		-	-7	Email not sent. Invalid email fields. Must have subject/body
		-	-6	Email not sent. Invalid organization submitted.
		-	-5	Email not sent. Invalid right submitted.
		-	-4	Email not sent. Recipient does not have an email.
		-	-3	Email not sent. Recipient account is disabled or part of guest organization.
		-	-2	Email not sent. Sender does not have an email address.
		-	-1	Email not sent. Sender account is disabled or part of guest organization.
		-	0	no problems found. message sent successfully.
		-	1+	function specific error code
	
	-	We have a choice of actions depending upon which site is used.
		-	If this is the production site, then sending the email to
			organizations is allowed.
		-	If this is not the production site, then the email is sent only
			to the active user.
*/
class email extends PHPMailer
{
	function __construct()
	{
		$this->results = new results();
	}
	//--------------------------------------------------------------------------
	/**
		\brief Sends an e-mail to the specified organization users, and all users
				in child organizations.
		\param org_info
				The organization id/name which the message is being sent to
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
	*/
	//--------------------------------------------------------------------------
	function SendToOrganization($org_info, $strSubject, $strMessage)
	{
		global $cfg;
		global $g_oUserSession;
		
		$oOrganization = organization::GetInstance();
		$db = systemData::GetInstance();
		$orgStartId = -1;
		
		$orgStartId = GetOrgID($org_info);
		
		if($orgStartId < 0)
		{
			$this->results->Set('false', "Invalid destination organization.");
			return -6;
		}

		if(!$this->ValidateEmailFields($strSubject, $strMessage))
		{
			return -7;
		}
		
		$result = $this->SendToOwner("Sent: $strSubject", $strMessage);
		
		if($result != 0)
		{
			return $result;
		}
		
		if($cfg['site']['type']	!= 	SITE_PRODUCTION && $cfg['site']['type']	!= 	SITE_TEST)
		{
			$this->results->Set('true', "E-mail sent to owner. Not sent to entire organization since it's not the production server.");
			return 0;
		}
	
		$senderID = $g_oUserSession->GetUserID();
		
		/*
			-	Send the email to all accounts in this organization
			-	Send the email to all children of this organization

			First send to all accounts within this organization
		*/

		$strSQL = "SELECT user_ID FROM tblUser WHERE org_ID = $orgStartId";

		$arUserAccounts = $db->Select($strSQL);
		
		if(sizeof($arUserAccounts))
		{
			foreach($arUserAccounts as $account)
			{
				$userID = $account['user_ID'];
				
				/*
					make sure we don't send it to the owner twice
				*/
				if($userID != $senderID)
				{
					$this->SendToAccount($senderID, $userID, $strSubject, $strMessage);
				}
			}
		}
		
		/*
			Send to all child organizations of this organization
		*/
		
		$arChildOrgs = $oOrganization->GetChildren($orgStartId);
		
		if(sizeof($arChildOrgs))
		{
			foreach($arChildOrgs as $org)
			{
				$id = $org['org_ID'];
				
				/*
					Send to all accounts within this organization
				*/
		
				$strSQL = "SELECT user_ID FROM tblUser WHERE org_ID = $id";
		
				$arUserAccounts = $db->Select($strSQL);
							
				if(sizeof($arUserAccounts))
				{
					foreach($arUserAccounts as $account)
					{
						$userID = $account['user_ID'];
						
						/*
							make sure we don't send it to the owner twice
						*/
						if($userID != $senderID)
						{
							$this->SendToAccount($senderID, $userID, $strSubject, $strMessage);
						}
					}
				}
			}
		}

		$this->results->Set('true', "Message sent to organization: " . $oOrganization->GetName($orgStartId));
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Validates that the email subject and body are valid before
				sending the message.
		\param strSubject
				The email subject
		\param strMessage
				The email message
		\return
			-	true
					the message subject and body are valid
			-	false
					the message body or subject is invalid
	*/
	//--------------------------------------------------------------------------
	private function ValidateEmailFields($strSubject, $strMessage)
	{
		$strSubject = trim($strSubject);
		
		if(strlen($strSubject) < 1)
		{
			return $this->results->Set('false', "Invalid message subject");
		}

		$strMessage = trim($strMessage);
		
		if(strlen($strMessage) < 1)
		{
			return $this->results->Set('false', "Invalid message body");
		}

		return $this->results->Set('true', "Valid message subject - body");
	}
	//--------------------------------------------------------------------------
	/**
		\brief This function sends the e-mail to all users who possess the
				passed in right/organization combination.
		\param right_info
				May be the right id or the right name, which should be checked
		\param org_info
				The organization which this right is specifically assigned to.
				If the right should be ignored, then it's set to -1.
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
	*/
	//--------------------------------------------------------------------------
	function SendToRight($strSubject, $strMessage, $right_info, $org_info = -1)
	{
		global $cfg;
		global $g_oUserSession;
		$orgStartId = -1;
		$oOrganization = organization::GetInstance();
		$oUser = cUserContainer::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$db = systemData::GetInstance();

		if(!$this->ValidateEmailFields($strSubject, $strMessage))
		{
			return -7;
		}
		
		if(GetRightID($right_info) < 0)
		{
			$this->results->Set('false', "Invalid right submitted.");
			return -5;
		}
	
		/*
			Send the email to the owner
			Send to the users who have the right, org combination
		*/
		$result = $this->SendToOwner("Sent: $strSubject", $strMessage);
		
		if($result != 0)
		{
			return $result;
		}

		if($cfg['site']['type']	!= 	SITE_PRODUCTION && $cfg['site']['type']	!= 	SITE_TEST)
		{
			$this->results->Set('true', "E-mail sent to owner. Not sent to right group since it's not the production server.");
			return 0;
		}
		
		$senderID = $g_oUserSession->GetUserID();
		
		/*
			-	Send the email to all accounts which have this right/organization combination.
		*/

		$strSQL = "SELECT user_ID FROM tblUser WHERE user_Active = 1 AND user_EMail <> \"\" AND user_ID <> $senderID";

		$arUserAccounts = $db->Select($strSQL);
		
		if(sizeof($arUserAccounts))
		{
			foreach($arUserAccounts as $account)
			{
				$userID = $account['user_ID'];
				
				if($oSystemAccess->HasRight($userID, $right_info, $org_info))
				{
					$this->SendToAccount($senderID, $userID, $strSubject, $strMessage);
				}
			}
		}

		$this->results->Set('true', "Message sent to right holders.");
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief This function sends an e-mail to the currently logged in user.
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
	*/
	//--------------------------------------------------------------------------
	function SendToOwner($strSubject, $strMessage)
	{
		if(!$this->ValidateEmailFields($strSubject, $strMessage))
		{
			return -7;
		}

		global $g_oUserSession;
		
		$userID = $g_oUserSession->GetUserID();
		
		return $this->SendToAccount($userID, $userID, $strSubject, $strMessage);
	}
	//--------------------------------------------------------------------------
	/**
		\brief Send an e-mail to a specific user id/user name.
		\param recipient_info
				The user account this email should be sent to.
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
		\note
			-	The e-mail is copied to the "owner", the user who's connected
				to this page.
			- If owner and user are the same account only one copy is sent
	*/
	//--------------------------------------------------------------------------
	function SendToUser($recipient_info, $strSubject, $strMessage)
	{
		global $cfg;
		global $g_oUserSession;
		$senderId = $g_oUserSession->GetUserID();

		$recipientId = GetUserID($recipient_info);
		
		if($recipientId < 0)
		{
			return -8;
		}

		if(!$this->ValidateEmailFields($strSubject, $strMessage))
		{
			return -7;
		}
				
		$result = $this->SendToOwner("Sent: $strSubject", $strMessage);
		
		if($result != 0)
		{
			return $result;
		}

		if($cfg['site']['type']	!= 	SITE_PRODUCTION && $cfg['site']['type']	!= 	SITE_TEST)
		{
			$this->results->Set('true', "E-mail sent to owner. Not sent to destination since this isn't the production server.");
			return 0;
		}

		if($senderId != $recipientId)
		{
			return $this->SendToAccount($senderId, $recipientId, $strSubject, $strMessage);
		}
		
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Send a message to an individual user acocunt.
		\param sender_Info
				May be the right id or the right name, which should be checked
		\param recipient_Info
				The organization which this right is specifically assigned to.
				If the right should be ignored, then it's set to -1.
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
	*/
	private function SendToAccount($sender_Info, $recipient_Info, $strSubject, $strMessage, $appname = "Catena")
	{
		$oUser = cUserContainer::GetInstance();
		global $cfg;
		
		/*
			Retrieve the sender info
		*/

		$strSenderEmail = $oUser->GetEmail($sender_Info);
		$strSenderName = $oUser->GetName($sender_Info);

		/*
			If the sender doesn't have email then we return true
		*/

		if(!$oUser->IsActive($sender_Info))
		{
			$this->results->Set('false', "Sender account is inactive and may not send messages.");
			return -1;
		}
		
		if($oUser->IsGuest($sender_Info))
		{
			$this->results->Set('false', "Sender account is part of the guest organization and may not send messages.");
			return -1;
		}
		
		if(strlen($strSenderEmail) == 0)
		{
			$this->results->Set('false', "Sender account does not have an email address and may not send messages.");
			return -2;
		}

		/*
			-	Retrieve the user's name from the $id value
			-	Format the recipient's name
		*/
		
		$strRecipientEmail = $oUser->GetEmail($recipient_Info);
		$strRecipientName = $oUser->GetName($recipient_Info);
		$strRecipientName = str_replace(".", " ", $strRecipientName);	
		$strRecipientName = ucwords($strRecipientName);

		/*
			If the sender doesn't have email or the account
			is disabled, then do not send a response.
		*/
		
		if(!$oUser->IsActive($recipient_Info))
		{
			$this->results->Set('false', "Recipient account is inactive and may not receive messages.");
			return -3;
		}
	
		if($oUser->IsGuest($recipient_Info))
		{
			$this->results->Set('false', "Recipient account is part of the guest organization and may not send messages.");
			return -1;
		}

		if(strlen($strRecipientEmail) == 0)
		{
			$this->results->Set('false', "Recipient account does not have an email address.");
			return -4;
		}
				
		/*
			Append a greeting to the account holder so we know who it is
			in case someone decides to change who recieves thier messages
		*/
		$istest = '';
		if($cfg['site']['type']	!= 	SITE_PRODUCTION )
		{
			$strSubject = "[TEST] $strSubject";
			$istest = '(Test Site)';
		}
		
		$strStyle = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
			<html>
			<head>
			<title>Email</title>
			<style type="text/css">
			body {font-family: Verdana, Arial, Helvetica; font-size: 80%;}
			a:link {color: #009;}
			a:visited {color: #666;}
			a:hover {color: #00f;}
			.sigdiv {color: #009; background: #e7efff; padding: 3px; border: 1px solid #009; line-height: 150%;}
			.sigmsg {font-size: 85%; font-style: italic;}
			</style>
			</head>
			<body>';
		if ($appname == 'Task Flag') {
			$sitename = "Task Flag $istest";
			if ($istest) {
				$strURL = 'http://taskflag-test.echostar.com/';
			} else {
				$strURL = 'http://taskflag.echostar.com/';
			}
		} else {
			$sitename = "Catena $istest";
			if ($istest) {
				$strURL = 'http://catena-test.echostar.com/';
			} else {
				$strURL = 'http://catena.echostar.com/';
			}
		}
		$sitename = trim($sitename);
		$strSignature = '<div class="sigdiv">&nbsp;<a href="' . $strURL . '">' . $sitename . '</a><br />';
		$strSignature .= '<span class="sigmsg">&nbsp;' . $sitename . ' generated message.</span></div></body></html>';
		$strMessage = $strStyle . "<p>Hello $strRecipientName,</p>" . $strMessage . "\r\n<br /><br />" . $strSignature;
				
		$this->From     = $strSenderEmail;
		$this->FromName = $strSenderName;
		
		$this->ClearAddresses();
		$this->AddAddress($strRecipientEmail,$strRecipientName); 
		$this->SetHTML(true);
		
		$this->Subject  =  $strSubject;
		$this->Body     =  $strMessage;
		$this->AltBody  =  $strMessage;

		if($this->Send() == false)
		{
			$this->results->Set('false', "Message not sent. Email system error.");
			return -9;
		}

		$this->results->Set('true', "Message sent successfully.");
		
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Sends an e-mail to the specified organization and it's child
				organizations.
		\param org_info
				May be the organization id or the organization name
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
	*/
	//--------------------------------------------------------------------------
	function SystemToOrganization($org_info, $strSubject, $strMessage)
	{
		global $cfg;
		
		/*
			We have a choice of actions depending upon which
			site is used.
			If this is the production site, then
			sending the email to organizations is allowed.
			If this is not the production site, then
			the email is sent only to the active user.
		*/
		
		if($cfg['site']['type']	!= 	SITE_PRODUCTION && $cfg['site']['type']	!= 	SITE_TEST)
		{
			$this->results->Set('true', "System generated message not send because of server type.");
			return 0;
		}
	
		$oOrganization = organization::GetInstance();
		$db = systemData::GetInstance();
		$orgStartId = GetOrgID($org_info);
		
		if($orgStartId < 0)
		{
			$this->results->Set('false', "Invalid destination organization.");
			return -6;
		}
		
		/*
			-	Send the email to all accounts in this organization
			-	Send the email to all children of this organization
		*/

		$strSQL = "SELECT user_ID FROM tblUser WHERE org_ID = $orgStartId";

		$arUserAccounts = $db->Select($strSQL);
		
		if(sizeof($arUserAccounts))
		{
			foreach($arUserAccounts as $account)
			{
				$userID = $account['user_ID'];

				$retCode = $this->SystemToAccount($userID, $strSubject, $strMessage);
				
				if($retCode != 0)
				{
					return $retCode;
				}
			}
		}
		
		/*
			Send to call child organizations of this organization
		*/
		
		$arChildOrgs = $oOrganization->GetChildren($orgStartId);
		
		if(sizeof($arChildOrgs))
		{
			foreach($arChildOrgs as $org)
			{
				$id = $org['org_ID'];
				
				/*
					First send to all accounts within this organization
				*/
		
				$strSQL = "SELECT user_ID FROM tblUser WHERE org_ID = $id";
		
				$arUserAccounts = $db->Select($strSQL);
				
				if(sizeof($arUserAccounts))
				{
					foreach($arUserAccounts as $account)
					{
						$userID = $account['user_ID'];

						$retCode = $this->SystemToAccount($userID, $strSubject, $strMessage);
						
						if($retCode != 0)
						{
							return $retCode;
						}
					}
				}
			}
		}

		$this->results->Set('true', "Message sent to organization: " . $oOrganization->GetName($orgStartId));
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Sends an e-mail to the specified right/organization combination,
				including its parents.
		\param right_info
				May be the right id or the right name
		\param org_info
				May be the organization id or the organization name
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
	*/
	//--------------------------------------------------------------------------
	function SystemToRight($strSubject, $strMessage, $right_info, $org_info = -1, $appname = "Catena")
	{
		global $cfg;
		$orgStartId = -1;
		$oOrganization = organization::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oUser = cUserContainer::GetInstance();
		$db = systemData::GetInstance();

		/*
			Send the email to the owner
			Send to the users who have the right, org combination
		*/
		
		if ($cfg['site']['type']	!= 	SITE_PRODUCTION && $cfg['site']['type']	!= 	SITE_TEST)
		{
			$this->results->Set('true', "System generated message not send because of server type.");
			return 0;
		}
		
		if(!$this->ValidateEmailFields($strSubject, $strMessage))
		{
			return -7;
		}

		if(GetRightID($right_info) < 0)
		{
			$this->results->Set('false', "Invalid right submitted.[$right_info]");
			return -5;
		}

		if($org_info != -1)
		{
			if(GetOrgID($org_info) < 0)
			{
				$this->results->Set('false', "Invalid organization submitted.");
				return -6;
			}
		}

		/*
			-	Send the email to all accounts which have this right/organization combination.
		*/

		$strSQL = "SELECT user_ID FROM tblUser WHERE user_Active = 1 AND user_EMail <> \"\"";

		$arUserAccounts = $db->Select($strSQL);
		
		if(sizeof($arUserAccounts))
		{
			foreach($arUserAccounts as $account)
			{
				$userID = $account['user_ID'];
				
				if($oSystemAccess->HasRight($userID, $right_info, $org_info))
				{
					$retCode = $this->SystemToAccount($userID, $strSubject, $strMessage, $appname);
					
					if($retCode != 0)
					{
						return $retCode;
					}
				}
			}
		}

		$this->results->Set('true', "Message sent to right holders.");
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Sends an e-mail to the currently logged in user.
		\param strSubject
				The email subject
		\param strMessage
				The email body or details.
		\return
			0	if no problems found. See class details for additional error
				codes.
	*/
	//--------------------------------------------------------------------------
	function SystemToOwner($strSubject, $strMessage)
	{
		global $g_oUserSession;
		
		$userID = $g_oUserSession->GetUserID();
		
		return $this->SystemToAccount($userID, $strSubject, $strMessage);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function sends an e-mail to a specific user id/user name.
			In addition to the e-mail sent to the user id, a copy is sent
			to the currently logged in user. If the two are the same,
			then only 1 copy is sent.
		\param recipient_info
			May be the account id or the account name this email is being sent to
		\param strSubject
			The subject of the email
		\param strBody
			The body of the email
		\return
	*/
	//--------------------------------------------------------------------------
	function SystemToUser($recipient_info, $strSubject, $strBody, $appname = "Catena")
	{
		global $cfg;
		global $g_oUserSession;

		$recipientId = GetUserID($recipient_info);
		$userId = $g_oUserSession->GetUserID();

		if($recipientId != $userId)
		{
			if($cfg['site']['type']	!= 	SITE_PRODUCTION && $cfg['site']['type']	!= 	SITE_TEST)
			{
				$this->results->Set('true', "System generated message not sent because of server type.");
				return 0;
			}
		}

		return $this->SystemToAccount($recipientId, $strSubject, $strBody, $appname);
	}
	/*
		Send a message to an individual user acocunt.
		-	return:
				All return codes above 0 are considered errors.
				All messages below 0 are failures because the email account
				doesn't exist or the account is disabled.
				
				-4	Email not sent. Recipient does not have an email.
				-3	Email not sent. Recipient account is disabled or part of guest organization.
				-2	Email not sent. Sender does not have an email.
				-1	Email not sent. Sender account is disabled or part of guest organization.
				0	OK. email sent to owner's address
		-	will return false if the owner does not have an email address.
	*/
	private function SystemToAccount($recipient_Info, $strSubject, $strMessage, $appname = "Catena")
	{
		$oUser = cUserContainer::GetInstance();
		global $cfg;
		
		/*
			Retrieve the sender info
		*/

		$NoUnderscore_appname = str_replace("_", " ", $appname);
		$UCappname = strtoupper(str_replace(" ", "_", $appname));
		$senderAppname = $UCappname . "_NO_REPLY";
		$strSenderEmail = "$senderAppname@echostar.com";//"$UCappname_NO_REPLY@echostar.com";
		$strSenderName = "$NoUnderscore_appname Website";

		/*
			-	Retrieve the user's name from the $id value
			- 	Format the recipient's name
		*/
		
		$strRecipientEmail = $oUser->GetEmail($recipient_Info);
		$strRecipientName = $oUser->GetName($recipient_Info);
		$strRecipientName = str_replace(".", " ", $strRecipientName);
		$strRecipientName = ucwords($strRecipientName);

		/*
			If the sender doesn't have email or the account
			is disabled, then do not send a response.
		*/
		
		if(!$oUser->IsActive($recipient_Info))
		{
			$this->results->Set('false', "Recipient account is inactive and may not send messages.");
			return -3;
		}
	
		if($oUser->IsGuest($recipient_Info))
		{
			$this->results->Set('false', "Recipient account is part of the guest organization and may not send messages.");
			return -1;
		}

		if(strlen($strRecipientEmail) == 0)
		{
			$this->results->Set('false', "Recipient account does not have an email address.");
			return -4;
		}
				
		/*
			Append a greeting to the account holder so we know who it is
			in case someone decides to change who recieves thier messages
		*/
		$istest = '';
		if($cfg['site']['type']	!= 	SITE_PRODUCTION )
		{
			$strSubject = "[TEST] $strSubject";
			$istest = '(Test Site)';
		}
		
		$strStyle = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
			<html>
			<head>
			<title>Email</title>
			<style type="text/css">
			body {font-family: Verdana, Arial, Helvetica; font-size: 80%;}
			a:link {color: #009;}
			a:visited {color: #666;}
			a:hover {color: #00f;}
			.sigdiv {color: #009; background: #e7efff; padding: 3px; border: 1px solid #009; line-height: 150%;}
			.sigmsg {font-size: 85%; font-style: italic;}
			</style>
			</head>
			<body>';
			if($appname == "Task Flag")
			{
				$sitename = "Task Flag $istest";
				if ($istest) 
				{
					$strURL = 'http://taskflag-test.echostar.com/';
				} 
				else 
				{
					$strURL = 'http://taskflag.echostar.com/';
				}
			} 
			else 
			{
				$sitename = "Catena $istest";
				if ($istest) 
				{
					$strURL = 'http://catena-test.echostar.com/';
				} 
				else 
				{
					$strURL = 'http://catena.echostar.com/';
				}
			}
		$sitename = trim($sitename);
		$strSignature = '<div class="sigdiv">&nbsp;<a href="' . $strURL . '">' . $sitename . '</a><br />';
		$strSignature .= '<span class="sigmsg">&nbsp;' . $sitename . ' generated message.</span></div></body></html>';
		$strMessage = $strStyle . "<p>Hello $strRecipientName,</p>" . $strMessage . "\r\n<br /><br />" . $strSignature;
				
		$this->From     = $strSenderEmail;
		$this->FromName = $strSenderName;
		
		$this->ClearAddresses();
		$this->AddAddress($strRecipientEmail,$strRecipientName); 
		$this->SetHTML(true);
		
		$this->Subject  =  $strSubject;
		$this->Body     =  $strMessage;
		$this->AltBody  =  $strMessage;

		if($this->Send() == false)
		{
			$this->results->Set('false', "Message not sent. Email system error.");
			return -9;
		}

		$this->results->Set('true', "Message sent successfully.");
		
		return 0;
	}
}
?>
