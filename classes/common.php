<?
//--------------------------------------------------------------------------
/**
	\brief
		Sends the headers to clear the browswer cache and to inform it
		not to store this page.
*/
//--------------------------------------------------------------------------
function ClearCache()
{
	header("PRAGMA:NO-CACHE");
	header("Cache-Control: no-cache, must-revalidate");
	header("EXPIRES: 0");
}
//--------------------------------------------------------------------------
/**
	\brief
		Checks a specific field in a multi-dimensional array to see
		if one is inside the other.
	\param arCompare The array element checked against the array list
	\param arSource The array list which may contain arCompare in it
	\param fieldName The array field we'll use for the comparison
	\return
		-	true if arCompare is in arSource
		-	false if arCompare is not in arSource
*/
//--------------------------------------------------------------------------
function inArray($arCompare, $arSource, $fieldName)
{
	
	for($child = 0; $child < sizeof($arSource); $child++)
	{
		if($arSource[$child][$fieldName] == $arCompare[$fieldName])
		{
			return true;
		}
	}
	return false;
}
//--------------------------------------------------------------------------
/**
	\brief
		Redirects to a page specified by "$url".
	\param url
		The path to redirect to
	\param mode
		can be:
		LOCATION:	Redirect via Header "Location".
 		REFRESH:	Redirect via Header "Refresh".
		META:		Redirect via HTML META tag
 		JS:			Redirect via JavaScript command
	\return
*/
//--------------------------------------------------------------------------
function redirect($url,$mode = "JAVASCRIPT")
{
	if (strncmp('http:',$url,5) && strncmp('https:',$url,6))
	{
		if(isset($_SERVER["HTTPS"]))
		{
			$starturl = 'https';
		}
		else
		{
			$starturl = "http";
		}

		$starturl = $starturl . "://" . (empty($_SERVER['HTTP_HOST'])? $_SERVER['SERVER_NAME'] : $_SERVER['HTTP_HOST']);
		
		if ($url[0] != '/')
		{
			$starturl .= dirname($_SERVER['PHP_SELF']).'/';
		}
		
		$url = "$starturl$url";
	}
	
	switch($mode)
	{
		case 'LOCATION':
			if (headers_sent())
			{
				exit("Headers already sent. Can not redirect to '$url'.");
			}
			header("Location: $url");
			exit;
		case 'REFRESH':
			if (headers_sent())
			{
				exit("Headers already sent. Can not redirect to '$url'.");
			}
			
			header("Refresh: 0; URL=\"$url\"");
			exit;
		case 'META':
			?><meta http-equiv="refresh" content="0;url=<?=$url?>" /><?
			exit;
		default: /* -- Java Script */
			?><script type="text/javascript">window.location.href='<?=$url?>';</script><?
	}
	exit;
}
//--------------------------------------------------------------------------
/**
	\brief
		OutputXMLList creates an xml formatted string
		from the sql string passed in
		and then echoes it back to the client
	\param sql
		The sql select command
	\param listName
		The name of the root element of hte xml document
	\param elementName
		The name of an individual record within the XML document
*/
//--------------------------------------------------------------------------
function OutputXMLList($sql, $listName, $elementName)
{
	ClearCache();

	$db = systemData::GetInstance();
	//
	//	We'll get a list of records
	//
	$records= $db->Select($sql);
	/*
		cycle through each element, create the XML data
		Build the array of the column names
	*/
	$fieldNames = $db->GetFieldNames();
	
	if($fieldNames)
	{
		header("Content-Type: text/xml");	
	}

	$strResults = 	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n\t<$listName>\n";

	foreach ($records as $org)
	{
		//
		//	have to use new variables because PHP gets confused when looking at
		//	array elements in a string
		//
		
		$i = 0;
		
		$strResults.= "\t\t<$elementName>\n";

		while($i < sizeof($fieldNames))
		{
			$name = $fieldNames[$i];
			$data = $org[$name];
			
			$strResults.= "\t\t\t<$name>$data</$name>\n";
			$i++;
		}
		$strResults.= "\t\t</$elementName>\n";
	}

	$strResults.="\t</$listName>";

	echo stripslashes($strResults);
}
//--------------------------------------------------------------------------
/**
	\brief
		Returns true if the passed in email is valid. A valid email contains
		an authorized echostar domain address.
	\param email
		Determines if the email is valid
	\return
		-	true
			The email is valid
		-	false
			The email is not valid
*/
//--------------------------------------------------------------------------
function IsEmailValid($email)
{
	// First, we check that there's one @ symbol, and that the lengths are right
	if (!ereg("[^@]{1,64}@[^@]{1,255}", $email))
	{
		// Email invalid because wrong number of characters in one section, or wrong number of @ symbols.
		return false;
	}
	
	// Split it into sections to make life easier
	$email_array = explode("@", $email);
	$local_array = explode(".", $email_array[0]);
	
	for ($i = 0; $i < sizeof($local_array); $i++)
	{
		if (!ereg("^(([A-Za-z0-9!#$%&'*+/=?^_`{|}~-][A-Za-z0-9!#$%&'*+/=?^_`{|}~\.-]{0,63})|(\"[^(\\|\")]{0,62}\"))$", $local_array[$i]))
		{
			return false;
		}
	}  
	
	if (!ereg("^\[?[0-9\.]+\]?$", $email_array[1]))
	{
		// Check if domain is IP. If not, it should be valid domain name
		$domain_array = explode(".", $email_array[1]);
		if (sizeof($domain_array) < 2)
		{
			return false; // Not enough parts to domain
		}
		for ($i = 0; $i < sizeof($domain_array); $i++)
		{
			if (!ereg("^(([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9])|([A-Za-z0-9]+))$", $domain_array[$i]))
			{
				return false;
			}
		}
	}

	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
		Now make sure the extension is one of the excepted values
	\param email
		Determines if the passed in email is a valid echostar domain
	\return
		-	true
			The domain is valid
		-	false
			The domain is not valid
*/
//--------------------------------------------------------------------------
function IsValidEmailDomain($email)
{
	if(!IsEmailValid($email))
	{
		return false;
	}
	
	$arEmail = explode("@", $email);
	$arEmail[1] = "@" . $arEmail[1];

	$arDomains = Array();
	$arDomains[0] = "@echostar.com";
		
	/*
		Add any new allowed domains at the end of
		the arDomains array
	*/

	foreach($arDomains as $domain)
	{
		if(strcasecmp($domain, $arEmail[1]) == 0)
		{
			return true;
		}
	}

	return false;
}
//--------------------------------------------------------------------------
/**
	\brief
		Return a random block of text from min, to max size.
		if only low is selected, then only that exact number
		of characters will be returned.
		The range of characters can be 
	\param iLow
		Low range of random text
	\param iHigh
		High range of random text
	\return
		A block of text containing the range of text.
*/
//--------------------------------------------------------------------------
function GetRandomText($iLow, $iHigh = -1)
{
	$strValues = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890 ";
	$strReturn = "";
	
	if($iLow < 0)
	{
		$iLow = 1;
	}
	
	if($iHigh < $iLow)
	{
		$iHigh = $iLow;
	}
	
	$iSize = rand($iLow,$iHigh);   

	$strValues = str_shuffle($strValues);
	
	/*
		Add numbers
	*/
	for($iCount = 0; $iCount < $iSize; $iCount++)
	{
		$iPos = rand(0, strlen($strValues) - 1);
		$strReturn .= $strValues[$iPos];
	}
	
	return $strReturn;
	
}

/*--------------------------------------------------------------------------
	Replaces special characters created by MS word with valid characters
	by taking the ASCII value of the bad character and replacing it with 
	the equivalent Unicode character recognized by Catena.
	Special characters replaced include:
		Open and close quotation marks (“”)
		Apostrophes (‘’)
		Ellipsis (…)
		En-Dashes (Shorter dash –)
		Em-Dashes (Longer dash —)
----------------------------------------------------------------------------*/
function CleanupSmartQuotes($strText)
{
   $start=chr(226).chr(128);
   $word=array();$fixword=array(); 
   $word[]=$start.chr(147);$fixword[]="-";
   $word[]=$start.chr(148);$fixword[]="--";
   $word[]=$start.chr(152);$fixword[]="'";
   $word[]=$start.chr(153);$fixword[]="'";
   $word[]=$start.chr(156);$fixword[]="\"";
   $word[]=$start.chr(157);$fixword[]="\"";
   $word[]=$start.chr(166);$fixword[]="...";
   return str_replace($word, $fixword, $strText);
}

/*--------------------------------------------------------------------------
	Takes a passed in string and truncates it to a desired length, appending
	an ellipsis to the end. 
	Variables: 	$str - The passed in string.
	
				$length - The amount of characters allowed before truncation.
						  Default length is 10 characters.
						  
				$trailing - What is appended to the ended of the truncated 
				string. Default is an ellipsis (...).
----------------------------------------------------------------------------*/
function Truncate($str, $length=10, $trailing='...')  
{ 
      // take off chars for the trailing 
      $length-=strlen($trailing); 
      if (strlen($str) > $length)  
      { 
         // string exceeded length, truncate and add trailing value 
         return substr($str,0,$length).$trailing; 
      }  
      else  
      {  
         // string was already short enough, return the string 
         $res = $str;  
      } 
   
      return $res; 
}

//--------------------------------------------------------------------------
/**
	\brief
		The function of this script, is to distinguish wether the returned
		array is a file or directory, if it is a file, it generates
		a link to download the file, otherwise if it's a dir, 
		it lists the files/dirs in that directory, works on windows _and_ *nix platforms, useful for mp3 sites... 
		you could also stream content with this too :) 
	\param root
		The root of the directory structure.
	\param dir
		The current direction within the root directory structure
	
	\return
*/
//--------------------------------------------------------------------------
/* config for the script */ 
function file_list($root, $dir = "")
{ 
  	$file_array = Array();
  	
  	if($dir == "")
  	{
  		$dir = $root;
  	}

	if (is_dir($dir))
	{ 
		$fd = @opendir($dir); 
		
		while (($part = @readdir($fd)) == true)
		{ 
			if ($part != "." && $part != "..")
			{
				$newDirectory = "$dir/$part";
				if(is_dir($newDirectory))
				{
					$new_files = file_list($root, $dir."/".$part);
					$file_array = array_merge ($file_array, $new_files);
				}
				else
				{
					clearstatcache();
					$fileParts = explode($root, $dir); 
					$file_array[] = $fileParts[1]."/".$part; 
				}
			}
		} 
		
		if ($fd == true)
		{ 
			closedir($fd); 
		} 
		
		if (is_array($file_array))
		{ 
			asort($file_array); 
			return $file_array; 
		}
		else
		{ 
			return null; 
		} 
	}
	else
	{ 
		return null; 
	} 
}
//--------------------------------------------------------------------------
/**
	\brief
		Returns a directory listing of the contained files
	\param root
		The root of the directory to search for
	\return
		an array of the files contained in the directory.
*/
//--------------------------------------------------------------------------
function dir_list($root)
{ 
  	$dir_array = Array();

	if (is_dir($root))
	{
		$fd = @opendir($root); 
		
		while (($part = @readdir($fd)) == true)
		{ 
			if ($part != "." && $part != "..")
			{
				$newDirectory = "$root/$part";
				if(is_dir($newDirectory))
				{
					$dir_array[] = $newDirectory;
				}
			}
		} 
		
		if ($fd == true)
		{ 
			closedir($fd); 
		} 
		
		if (is_array($dir_array))
		{ 
			asort($dir_array); 
			return $dir_array; 
		}
		else
		{ 
			return null; 
		} 
	}
	else
	{ 
		return null; 
	} 
}  
//--------------------------------------------------------------------------
/**
	\brief
		A replacement for print_r which formats the array via the brackets
		with nesting
	\param variable
		The array to output to the web stream
	\return
*/
//--------------------------------------------------------------------------
function print_array($variable)
{
	printf('<pre>%s</pre>', print_r($variable, 1));
	
	//return print_r(str_replace(" ", " ", (str_replace("\n", "<BR>", print_r($variable, true)))), $noshow);
}
?>