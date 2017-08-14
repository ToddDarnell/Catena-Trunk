<%@LANGUAGE="VBSCRIPT" CODEPAGE="1252"%>
<%Option Explicit%>
<%

function catena_HasRight(userName, rightName, orgName)

	dim arServerValues
	dim strResults
	dim arrayResults

	catena_HasRight = false

	Set arServerValues = Server.CreateObject("Scripting.Dictionary")

	arServerValues.Add "location", "functions/systemAccess"
	arServerValues.Add "action", "user_has_right"
	arServerValues.Add "user", userName
	arServerValues.Add "right", rightName
	arServerValues.Add "right_org", orgName

	strResults = catena_ServerGet(arServerValues)

    arrayResults = Split(strResults, "||")
    
    if UBound(arrayResults) > 0 then
	    if arrayResults(0) = "true" then
	    	catena_HasRight = true
	   	end if
	end if
	
	set arServerValues = nothing

end function
'--------------------------------------------------------------------------
'
'	\brief
'		Calls the Catena website via the GET protocol.
'	\param arServerValues
'		An array containing the values to call the server with.
'		Note, this array must contain an element called 'location' which
'		specifies the page to call. The location variable is in the format
'		"folder/filename". Do not include .php or any kind of extension.
'	\return
'		The content of the returned HTML page.
'
'--------------------------------------------------------------------------
function catena_ServerGet(arServerValues)

	dim strURL
	dim strResult
	dim arResults
	dim xmlhttp
	dim arrayResults

	catena_ServerGet = ""

	strURL = Catena_BuildURL(arServerValues)
	
	if len(strURL) < 1 then
		exit function
	end if

	set xmlhttp = CreateObject("MSXML2.ServerXMLHTTP") 
	xmlhttp.open "GET", strURL, false 
	xmlhttp.send ""
	
	catena_ServerGet = xmlhttp.responseText
	set xmlhttp = nothing 
end function
'--------------------------------------------------------------------------
'
'	\brief
'		Builds a URL to pass onto to the Catena website.
'	\param arServerValues
'		An array containing the values to call the server with.
'		Note, this array must contain an element called 'location' which
'		specifies the page to call.
'	\return
'		a string containing the completed URL.
'
'--------------------------------------------------------------------------
function catena_BuildURL(arServerValues)

	dim strURL
	dim strParams
	dim array_field
	dim array_value
	
	catena_BuildURL = ""
	
	if arServerValues.count < 1 then
		exit function
	end if
	
	' Compare the two dictionaries.
	For Each array_field In arServerValues
	
		array_value = arServerValues.Item(array_field)
	
		if array_field = "location" then
			strURL = "http://catena.echostar.com/" + array_value + ".php?"
		else
			strParams = strParams + array_field + "=" + array_value + "&"
		end if
	next
		
	if len(strURL) < 1 then
		exit function
	end if

		
	catena_BuildURL = strURL + strParams

end function
%>