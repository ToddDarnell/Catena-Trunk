<?
	require_once('class.result.php');
/**
	\brief
		XML parser/displayer.
*/
class XML
{
	private $strOutput = "";
	private $rootElement = "root";

    public $results;

	//--------------------------------------------------------------------------
	/**
		\brief
			Create the XML parser that will read XML data formatted with
			the specified encoding
		\param encoding
			The type of encoding.
	*/
	//--------------------------------------------------------------------------
	function __construct($encoding = 'UTF-8')
    {
        $this->results = new results();
    }
    //--------------------------------------------------------------------------
    /**
    	\brief
			Takes an array and adds it to the output document
		\param arData
			The array to serialize into an XML entity.
    	\return
    */
    //--------------------------------------------------------------------------
	function serialize($arData)
	{
		if(!isset($arData))
		{
			return;
		}
		
		foreach($arData as $field => $val)
		{
			if(is_array($val))
			{
				//echo "is array [$field]<BR>$val<BR>";
				$this->serializeElement($val, $field);
			}
			else
			{
				$this->strOutput.= "<$field>$val</$field>\n";
			}
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Takes an array of numbered elements (0, 1, 2, etc) and serializes
			them.
		\param arData The numbered array
	*/
	//--------------------------------------------------------------------------
	function serializeArray($arData)
	{
		if(!isset($arData))
		{
			return;
		}
		
		for($i = 0; $i < sizeof($arData); $i++)
		{
			if(is_array($arData[$i]))
			{
				$this->strOutput.= "<element>";
				$this->serializeElement($arData[$i], "element");
				$this->strOutput.= "</element>";
			}
			else
			{
				$this->serializeElement($arData[$i], "element");
			}
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Cycles through all of the elements in this array and lists them
			as attributes of the XML element.
		\param arData
			An array to format into an XML text element
		\param element
			The name of the XML element
	*/
	//--------------------------------------------------------------------------
	function serializeElement($arData, $element)
	{
		if(!isset($arData))
		{
			return;
		}
		
		if(is_array($arData))
		{
			foreach($arData as $field => $val)
			{
				if(is_array($val))
				{
					$this->strOutput.= "<$element>";
					$this->serializeElement($val, $field);
					$this->strOutput.= "</$element>";
				}
				else
				{
					$this->strOutput.= "<$field>$val</$field>\n";
				}
			}
		}
		else
		{
			$this->strOutput.= "<$element>$arData</$element>\n";
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Takes the serialized data and dumps it out
			as raw XML
	*/
	//--------------------------------------------------------------------------
	function output()
	{
		echo "<$this->rootElement>";
		echo stripslashes($this->strOutput);
		echo "</$this->rootElement>";
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Output as a raw XHTML document
	*/
	//--------------------------------------------------------------------------
	function outputXHTML()
	{
		ClearCache();
		header("Content-Type: text/xml");	
		
		echo $strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
		$this->output();
	}
}
?>