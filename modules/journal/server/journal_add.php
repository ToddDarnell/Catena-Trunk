<?

	require_once('../../../classes/include.php');
	require_once('../classes/class.journal.php');
	
	ClearCache();

	$oJournal = journal::GetInstance();
	$oJournal->Add();
?>