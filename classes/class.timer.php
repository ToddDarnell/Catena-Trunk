<?
/**
	\brief a high speed timer
*/
class cTimer
{
	function __construct()
	{
		$this->startTime = 0;
		$this->totalTime = 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Start the timer
	*/
	//--------------------------------------------------------------------------
	function start()
	{
		$mtime = microtime(); 
		$mtime = explode(' ', $mtime); 
		$mtime = $mtime[1] + $mtime[0]; 
		$this->startTime = $mtime;
		$this->totalTime = 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Stop the timer
	*/
	//--------------------------------------------------------------------------
	function stop()
	{
		if($this->startTime != 0)
		{
			$mtime = microtime(); 
			$mtime = explode(" ", $mtime); 
			$mtime = $mtime[1] + $mtime[0]; 
			$endtime = $mtime; 
			$this->totalTime = ($endtime - $this->startTime);
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retreive the time between start and end
		\note
			Will return 0 if the timer was not started/stopped properly.
	*/
	//--------------------------------------------------------------------------
	function time()
	{
		$this->stop();
		return $this->totalTime;
	}
}
?>