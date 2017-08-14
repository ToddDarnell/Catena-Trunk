<?
	require_once('../../../classes/include.php');
	require_once('../classes/class.document.php');
	ClearCache();
	
	/**
		\brief 
			Performs the server side functionality for document requests.
			Must load the header command like this or the data will
			not be re-downloaded the next time it's called
	*/
	
	$doc = document::GetInstance();
	$doc->Add();

?>