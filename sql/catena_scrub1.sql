/*
	This script is used to scrub the catena-scrub database after it has been downloaded from the server
*/

DROP DATABASE `cs-catena`;
DROP DATABASE `cs-csg`;
DROP DATABASE `cs-dms`;
DROP DATABASE `cs-journal`;
DROP DATABASE `cs-messageboard`;
DROP DATABASE `cs-rms`;

CREATE DATABASE `cs-catena` ;
CREATE DATABASE `cs-csg` ;
CREATE DATABASE `cs-dms` ;
CREATE DATABASE `cs-journal` ;
CREATE DATABASE `cs-messageboard` ;
CREATE DATABASE `cs-rms` ;


