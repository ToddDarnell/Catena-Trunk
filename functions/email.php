<?
/**

	\page system_email User Access
		Performs the server side functionality for user rights management.
		This is the method for calling the code directly. To access
		the functions internally, such as through modules, please
		see systemAccess.
	
	To send an email call the php page like the following:
	
	\code
	http://catena.echostar.com/functions/email.php?action=system_to_right&subject=my subject&body=my email body&right=theright&org_info=rightOrg
	\endcode
			
	\note
		Actions are case insensitive. The values of the data are dependant upon the field passed in. For example,
		passing in a group name for a new group will make that data case sensitive.
	
	\section system_to_right
	
		\param subject
			The email subject
		\param body
			The email body
		\param right_info
			The right which should receive this email
		\param org_info
			The right organizations (optional) which will receive this email. If this is left out, all users
			who have the right will receive the email.
		\param username
			The name of the user who the email is being sent to.
*/
	require_once("../classes/include.php");

//--------------------------------------------------------------------------
/**
		\brief Performs  the server side functionality for sending emails to users
*/
//--------------------------------------------------------------------------
	
	if(!isset($_GET['action']))
	{ 
		/*
			action MUST be set.
		*/
		exit;
	};

	$strSubject = "";			//	The email subject
	$strBody = "";				//	The email body
	
	$right_info = -1;			//	The right the email will be sent to
	$org_info = -1;				//	The right organization the email will be sent to
	$action = "";
	$strUsername = "";

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch(strtolower($fieldName))
			{
				case "subject":
					$strSubject = $val;
					break;
				
				case "body":
					$strBody = $val;
					break;
				
				case "right_info":
					$right_info = $val;
					break;	
				
				case "username":
					$strUsername = $val;
					break;			
				
				case "org_info":
					$org_info = $val;
					break;		

				case "action":
					$action = strtolower($val);
					break;
				case "appname":
					$appName = $val;
					break;
			}
		}
	}
	
	$oMailer = $mailer = new email();
	
	switch($action)
	{
		case "system_to_right":
			/*
				Sends an email to the users with the passed in right
			*/

			$oMailer->SystemToRight($strSubject, $strBody, $right_info, $org_info, $appName);
			$oMailer->results->Send();

			break;
		case "system_to_user":
			/*
				Sends an email to a specific user based on their passed in user name.
			*/

			$oMailer->SystemToUser($strUsername, $strSubject, $strBody, $appName);
			$oMailer->results->Send();

			break;
	}	
?>