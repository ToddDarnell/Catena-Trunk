<?

	require_once("../classes/include.php");

	/*
		performs the server side functionality for receiving feedback
		from users.
	*/
	$strSubject = "";			//	The feedback subject
	$strBody = "";				//	The feedback body

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "subject":
					$strSubject = $val;
					break;
				case "body":
					$strBody = $val;
					break;
			}
		}
	}

	$oMailer = $mailer = new email();
	$oRights = rights::GetInstance();

	$oMailer->SendToRight($strSubject, $strBody, $oRights->SYSTEM_ContactUs, $g_oUserSession->GetOrganization());
	
	$oMailer->results->Send();
	
?>