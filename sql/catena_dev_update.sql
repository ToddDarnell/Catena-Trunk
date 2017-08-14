/*
	This script is used to scrub the catena-scrub database after it has been downloaded from the server
*/

DROP DATABASE IF EXISTS `catena`;
DROP DATABASE IF EXISTS `catena-csg`;
DROP DATABASE IF EXISTS `catena-dms`;
DROP DATABASE IF EXISTS `catena-journal`;
DROP DATABASE IF EXISTS `catena-messageboard`;
DROP DATABASE IF EXISTS `catena-rms`;
		
CREATE DATABASE `catena` ;
CREATE DATABASE `catena-dms` ;
CREATE DATABASE `catena-messageboard` ;
CREATE DATABASE `catena-csg` ;
CREATE DATABASE `catena-rms` ;
CREATE DATABASE `catena-journal` ;


