<?
//require_once('include.php');
//require_once('config.php');

class results
{
	private $result = false;						//	return value result
	private $message = "No message set";			//	the message to be output
	
	function GetMessage()
	{
		return $this->message;
	}

	function GetResult()
	{
		
		return $this->result;
	}
	
	function Send()
	{
		echo "$this->result||$this->message";
		
		return $this->result == 'true';
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function sets the response which will be sent to the user
		\param valid
		\param userMessage
		\return
			-	Whether valid is set to true or false
	*/
	//--------------------------------------------------------------------------
	function Set($valid, $userMessage)
	{
		//
		//	valid is returned to the client to tell it whether
		//	the information submitted is valid
		//	it can be 'true' or 'false' and is parsed by the client
		//	additionally, a message value is appended to it to clarify
		//	why something was valid or invalid
		//
		$this->result = $valid;
		$this->message = $userMessage;

		return $this->result == 'true';
	}
}
?>