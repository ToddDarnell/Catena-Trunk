<?
	
	require_once('../classes/include.php');
	ClearCache();
	/*
		performs the server side functionality for organization requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	*/

	if(!isset($_GET['action']))
	{ 
		/*
			action MUST be set.
		*/
		exit;
	};
	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	
	$action = strtolower($_GET['action']);

	switch($action)
	{
		case "getlist":
			GetList();
			break;
		default:
			SendResponse('false', "Server side functionality not implemented.");
			break;
	}

	exit;

/*
	Retrieves the list of notices from the server
*/
function GetList()
{
	ClearCache();
	header("Content-Type: text/xml");	
	
	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>
		<notices>
			<notice>
				<title>Welcome to Catena</title>
				<details>Catena is the new website developed by STG that allows pre-existing internal websites to be unified into one place with one look and feel.  The design allows separate modules to be inserted and removed as occasion requires, with the ability to turn any functionality on or off at any time.</details>
			</notice>
			<notice>
				<title>C017 Release</title>
				<details> DOCUMENTATION: All users will be able to search DCRs in the system. The DCR Item Details page will display the Document Title and the Request #. The DCR Review (Pending) status will allow the admin to select a user's name rather than automatically going to the Requester's DCR Queue.
				</details>
			</notice>
			<notice>
				<title>C016 Release</title>
				<details> ADMINISTRATION: Admins will now be able to view the users assigned to a selected right.
					AUTHORIZATIONS: CSG Admins will be able to search CSG Requests by the status.  The CSG History page will allow users to filter their requests based on the request date.
					DOCUMENTATION: DMS Admins will have the ability to assign DCRs to a writer for processing or to a user for clarification.  The Document Creation Request screen will allow users to input RQ#s, if applicable.
					CATENA: The enter key will return results for all the search pages. New tooltips have been added throughout the site.
				</details>
			</notice>
		</notices>";

	echo $strResults;
}
?>