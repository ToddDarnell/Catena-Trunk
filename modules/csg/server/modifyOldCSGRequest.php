<?

	require_once('../../../classes/include.php');
	require_once('../classes/class.csgTransaction.php');
	
	ClearCache();
	
	/*
		Performs the server side functionality for csg requests.
	*/
	$request = csgTransaction::GetInstance();
	$request->Modify();
?>