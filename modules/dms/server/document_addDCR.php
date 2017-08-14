<?

	require_once('../../../classes/include.php');
	require_once('../classes/class.documentChangeRequest.php');
	
	ClearCache();
	
	/*
		Performs the server side functionality for csg requests.
	*/
	$oDCR = documentChangeRequest::GetInstance();
	$oDCR->Add();
?>