<?
	require_once('../../../classes/include.php');
	require_once('../classes/class.documentVersion.php');
	ClearCache();
	
	/**
		\brief
			Performs the server side functionality for modify document file 
			and versionrequests. Must load the header command like this or 
			the data will	not be re-downloaded the next time it's called.
	*/
	$docVer = documentVersion::GetInstance();
	$docVer->Modify();
	$docVer->OutputUploadModifyResults();
?>