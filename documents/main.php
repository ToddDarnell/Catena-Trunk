<?

/**
	\mainpage Catena
	
	
	\section describe_catena What is Catena?
	
	\par
		Catena is a software framework that will allow many disparate internal websites to be unified into one place with one look and feel.  It is designed to be very modular which will allow separate software units to be inserted and removed as occasion requires.  Catena is also designed for speed.  By using the AJAX programming technique, the entire website’s user interface gets loaded when the home page is first loaded.  This allows for extremely quick UI response time due to the fact that as you browse from page to page a connection with the server is not necessarily made.  The screens have already been loaded into the client’s memory allowing them to be displayed immediately when asked for.  The only communication that the client does with the server is when it needs some form of dynamic data.  Whether that means that the client needs to request data to fill in possible options or whether the client is asking for a table of data from a database, the only data that gets sent is the client’s request and then XML data gets returned.  The webpage does not need to be reloaded.  This asynchronous communication is also less of a load on the server.  The client can connect, ask for data, the server returns it, and then the client disconnects which frees up the server to respond to other requests.

	\subsection Security
		
	\par
		Catena also has its own security architecture.  It defines two distinct features.  One is that a user can be assigned a role.  Each role has certain security attributes.  Catena also defines organizations, which could represent different departments or other logical groupings.  Administrators of organizations have the rights to modify the rights of users within their own organization (except their own).  Global administrators have the capability of modifying the rights of anyone in the system (except their own).
	
	\subsection PHP
	
	\par
		PHP 5 is used as the server side scripting language.
		PHP is very flexible because it has many modules that can be dynamically loaded and unloaded allowing support for only those things which you need.  Image manipulation and MySQL database connectivity are examples of two such modules which are enabled.
	
	\subsection Databases
	\par
		MySQL completes the back end system support.  MySQL and PHP are very closely integrated and therefore little is required to allow PHP to connect to MySQL.  MySQL is also far more robust than Access in that MySQL is designed to be used on a much larger scale.  Therefore as the website grows, MySQL will be able to handle the growth.
		
	\par
		By default Access and MySQL are supported. Additional database connections can be implemented with little additional work.

	\subsection open_standards Open Standards
	
	\par
		Each of these technologies have well defined open standards which allows for support from multiple browsers and multiple Operating Systems.  Ideally this allows Catena to run on any major browser, on any OS.  All of these technologies are also free which cuts down on development costs.  Being widely used, the community support for each technology is large which can be useful when needing support.
	
	\subsection API
	
	\par
		This API provides the information required to create and maintain modules within the Catena Framework.

	\subpage catena_modules

		\par 		
 		Modules are plugs-ins to the Catena Framework which provide new web based functionality.
 		
 		\par
 		This documentation	provides information regarding the PHP portion of
 		the code. Additional documentation provided discusses the client side
 		portion which uses Javascript, CSS, XML, and HTML to provide rich
 		user interactive components.
 	
 	\subpage catena_server
 	
 		Details about the server configuration including versions and components.
 */

/**

	\page catena_server Server Details

	The following details relate to the Catena Server:

	\par PHP
		version 5.1.4
	
	\par Apache Web Server
		version 2.0.52 (Red Hat)

	\par MySQL
		version 5.0.21

	\par PHP components
		\verbatim
		'--with-mysql-sock=/var/lib/mysql/mysql.sock'

		'--prefix=/usr/local/php'			'--disable-debug'
		'--with-apxs2'
		'--with-config-file-path=/etc'		'--with-pic'
		'--disable-rpath'					'--without-pear'
		'--with-bz2'						'--with-curl'
		'--with-freetype-dir=/usr/lib'		'--with-png-dir=/usr/lib'
		'--enable-gd-native-ttf'			'--without-gdbm'
		'--with-gettext'					'--with-gmp'
		'--with-iconv'						'--with-jpeg-dir=/usr/lib'
		'--with-openssl'					'--with-png'
		'--with-pspell'						'--with-expat-dir=/usr/lib'
		'--with-pcre-regex'					'--with-zlib'
		'--with-layout=GNU'					'--enable-exif'
		'--enable-ftp'						'--enable-magic-quotes'
		'--enable-sockets'					'--enable-sysvsem'
		'--enable-sysvshm'					'--enable-sysvmsg'
		'--enable-track-vars'				'--enable-trans-sid'
		'--enable-yp'						'--enable-wddx'
		'--with-kerberos'					'--enable-ucd-snmp-hack'
		'--enable-memory-limit'				'--with-mysql=/var/lib/mysql'
		'--with-mysqli'						'--enable-shmop'
		'--enable-calendar'					'--enable-dbx'
		'--enable-dio'						'--with-mime-magic=/etc/httpd/conf/magic'
		'--without-sqlite'					'--with-libxml-dir=/usr/lib'
		'--with-xml'						'--with-ldap'
		'--with-ldap-sasl'					
		\endverbatim
	
	\par Apache modules
		\verbatim
		core
		prefork
		http_core
		mod_so
		mod_access
		mod_auth
		mod_auth_anon
		mod_auth_dbm
		mod_auth_digest
		util_ldap
		mod_auth_ldap
		mod_include
		mod_log_config
		mod_env
		mod_mime_magic
		mod_cern_meta
		mod_expires
		mod_deflate
		mod_headers
		mod_usertrack
		mod_setenvif
		mod_mime
		mod_dav
		mod_status
		mod_autoindex
		mod_asis
		mod_info
		mod_dav_fs
		mod_vhost_alias
		mod_negotiation
		mod_dir
		mod_imap
		mod_actions
		mod_speling
		mod_userdir
		mod_alias
		mod_rewrite
		mod_proxy
		proxy_ftp
		proxy_http
		proxy_connect
		mod_cache
		mod_suexec
		mod_disk_cache
		mod_file_cache
		mod_mem_cache
		mod_cgi
		mod_php5
		mod_dav_svn
		mod_authz_svn
		mod_ssl
			
		\endverbatim
	
*/

/**
 	
 	\page catena_modules Modules
 		
 	\section module_sec Modules
 		A module contains several components; the screen data, the client
 		side functionality, the two pieces of the server side interface, and
 		the menu details.
 	
 	\subpage module_creation

	\par
		Creating a module includes several steps: creating the folder structure, filling in several
		required files, and updating the framework database. This section outlines those
		details.
 	
 	\section module_files Files
 	
 		The folder layout is as such:
 		
 		/modules/'module name'/
		 		
 		\par /modules/'module name'/classes
 			Where all of the server side PHP classes are stored.
 			Detailed in \subpage module_server.
 		
 		\par /modules/'module name'/menu
 			Where the XML formatted menu file is stored.
 			Detailed in \subpage module_menu.
 			
 		\par /modules/'module name'/screens
 			Where the XML formatted client screen data is located.
 			Detailed in \subpage module_screen.
 		
 		\par /modules/'module name'/scripts
 			Where the client side javascript files are stored.
 			Detailed in \subpage module_client.
 		
 		\par /modules/'module name'/server
 			Where the client called files are stored. These are
 			php pages without a user interface which are called
 			by the client. Detailed in \subpage module_server.
 			
 	\page module_creation Creating a Module
 	
 		When first developing a module, go to http://catena-dev.echostar.com and perform
 		the following actions:
 		
 			-	Click the 'Links' menus.
 			-	Click 'Catena Setup'.
 			-	Click 'Add a new Module'
 			-	Choose the name and a brief description.
 			-	
 	
 	This section talks about how to create a module.
 */
 
/**
 	
 	\page module_menu Menu Data
 	
 	Menu data consists of the information required to present a menu
 	to the user. This information is stored in XML format for ease of use and
 	consistency.
 	
 	There is only one menu file: menu.xml and should reside in the
 	../menu subdirectory of the module.

	The file takes the following format:
	
	\code
	<?xml version="1.0" encoding="utf-8"?>
	<menu>
		<SubMenu>
			<title>Authorizations</title>
			<site>prod</site>
			<tip>Receiver CSG request authorizations</tip>
			<menuItem>
				<title>CSG Request</title>
				<site>prod</site>
				<tip>Request receiver authorizations</tip>
				<right>CSG_Standard</right>
			</menuItem>
		</SubMenu>
	</menu>
 	\endcode
 	
 	and will display like the following:
 	
 	-	Authorizations (SubMenu level)
 		-	CSG Request (menuItem level)
 		
 	Currently only two levels are supported for the menu stucture.
 	
 	\param SubMenu
 		A menu file may contain as many SubMenu groups as necessary.

	\param menuItem
		A menuItem is found in the SubMenu group and presents
		the individual items selectable within a menu group.
	
	\param title
		A title tag is used by the SubMenu and menuItem tags.
		This is the text which the user sees and may select to
		select the menu item. This is also the text used
		by the client side javascript object to be notified
		if the page should be displayed
	
	\param site
		A site tag represents which site this menu should be allowed to
		display on. The list is cummalative. Dev is the lowest level,
		prod is the highest level. Items available on dev are only
		available on dev, but items available on test are available
		on test and dev, but not production.
		-	dev
			Available on the dev site only. Good for testing options
			which are not ready to be sent to test
		-	test
			Available on the dev and test sites. Good for functionality
			which should be available to testers for testing purposes
			but which should not be on live.
		-	prod
			Available when the software is released to end users.
	\param link
		Additionally to turn any menu item into an external link use
		the link tag. This tag will open an explictly defined page
		or one relative within the website.

*/

/**
 	
 	\page module_screen Screen Data
 	
 	Screen data consists of the information required to present a page of information
 	to the user. This information is stored in XML format for ease of use and
 	consistency.
 	
 	All screen files are located in the ../screens directory.

	The following example is taken from the home page.
	
	\code
 	<?xml version="1.0" encoding="utf-8"?>
	<screen>
	    <screenTitle>Home</screenTitle>
	    <div>
	        <id>home_Notices</id>
	        <style>
	            <top>0px</top>
	            <left>0px</left>
	        </style>
	    </div>
	</screen>
 	\endcode

	\param XML
		This tag is required and identifies the file as XML data.
	
	\param screen
		required. Identifies the screen.
	
	\param screenTitle
		The name of the screen. This appears in the title banner
		of the site. Additionally, it's used as the identifier in the
		menu system.
 	
 	The body of the data is then open after these variables. Any valid HTML tags are
 	usuable to describe elements on the screen. In the above example, a div was used.
 	
 	This div is named home_Notices and is located at 0,0 on the screen. Note, this 0,0
 	is relative to the parent screen content so it does not mean the upper left
 	top corner, but the position relative to where the application body content starts.

*/

/**

	\page module_client Client Side

	The client side framework available consists of javascript classes which provide
	database, screen, list, and complex interface elements usable for creating
	rich interactive modules.
	
	\section module_client_objects Client Objects
	
	\subsection oUser
		The user object provides information about the currently connected user.
		Information such as preferences, details, name, id, and other data
		may be used for displaying, customizing, and interacting with the developed
		module in a standard format.
	
	\subsection oRights
		The rights object queries the server to determine if a user has the appropriate
		right. The only responsibility of the developer is in calling the object
		with the requested right and optional organization.
	
	\section module_client_interface Interface Elements
	
		The following complex interface elements are available to assist in presenting
		a rich interactive user environment.
	
	\subsection dialogboxes Dialog Boxes
		Interactive dialog boxes, which are part of the application may be created
		for prompting for user input.

	\subsection Trees
		hiarchy trees, such as used in Windows Explorer can be created for displaying
		organization charts, user roles, and displaying any other kind of hierachy.
	
	\subsection lists Sort Lists
		Developers may create complex sort lists which provide unlimited size and
		versitility when presenting information to the user. Paged, sortable, and
		able to disable any arbitrary number of elements on screen with a custom
		record display feature, sort lists are a perfect way of compactly presenting
		information to users.
	
	
	
	
*/

/**

	\page module_server Server Side
	
	This is the server side functionality.
	
	
*/
	
	


 
 
 
?>