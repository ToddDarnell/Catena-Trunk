<?

	require_once('../../../classes/include.php');
	require_once('../classes/class.messageBoard.php');
	
	ClearCache();

	$oMessageBoard = messageBoard::GetInstance();
	$oMessageBoard->Add();
?>