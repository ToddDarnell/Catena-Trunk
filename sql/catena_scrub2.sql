/*
	This script is used to scrub the catena-scrub database after it has been downloaded from the server
*/


/*
	Clean out the email addresses of everyone except developers and testers
*/

UPDATE
	`cs-catena`.`tblUser`
SET
	`user_EMail` = ""
WHERE
	`tblUser`.`org_ID` <> 49
	AND
	(`tblUser`.`user_Name` <> "simon.tang")
	AND
	(`tblUser`.`user_Name` <> "scott.gordon");
	
/*
	Clean out the journal as this is considered a secured table
*/

TRUNCATE TABLE `cs-journal`.`tblJournal`;
