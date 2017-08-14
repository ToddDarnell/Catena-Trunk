/*
	This functioin makes snowflakes which appear on the title bar page sparilingly.
*/
var flake_image = "";			//	file path for the snow flakes
var flake_message = "";			//	The message the flake gives you
var maxFlakes = 20;
var bFlakeDecrease = false;
var arFlakeRange = new Object();
var snowTimer = 0;

arFlakeRange.low = 1000;
arFlakeRange.high = 8000;
arFlakeRange.counter = 1000;

arFlakes = new Array();		//	The array of snowflakes

function CreateFlakes()
{
	for(i = 0; i < maxFlakes; i++)
	{	
		doc_width = document.body.clientWidth - 20;
	
		aFlake = new Object();
		
		aFlake.dx = 0;								//	set coordinate variables
		aFlake.xp = Math.random()*(doc_width-50);  	// set position variables
		aFlake.yp = 0;								//	Start them all at the top of the page
		aFlake.am = Math.random()*20;         		// set amplitude variables
		aFlake.stx = 0.02 + Math.random()/10; 		// set step variables
		aFlake.sty = 0.7 + Math.random();     		// set step variables
		aFlake.id = i;
		aFlake.counter = Math.round(Math.random() * 900) + 100;
		aFlake.visible = false;
	
		element_div = document.createElement("DIV");
		
		element_div.id = "dot"+ i;
		element_div.style.position = "absolute";
		element_div.style.zIndex = "4";
		element_div.style.top = aFlake.yp + "px";
		element_div.style.left = aFlake.xp + "px";
		element_div.style.visibility = "hidden";
		
		element_image = document.createElement("IMG");
		element_image.src = flake_image;
		element_image.border=0;
		element_div.title = flake_message;
	
		element_div.appendChild(element_image);
		
		document.body.appendChild(element_div);
		
		arFlakes[i] = aFlake;
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		This function disables all flakes.
	\param
	\return
*/
//--------------------------------------------------------------------------
function HideFlakes()
{
	for(i = 0; i < maxFlakes; i++)
	{
		aFlake = arFlakes[i];

		el = document.getElementById("dot" + aFlake.id);
		el.style.visibility = "hidden";
		aFlake.visible = false;
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		Draws a bunch of flakes on the screen.
	\param
	\return
*/
//--------------------------------------------------------------------------
function flakesFalling()
{
	/*
		Make sure the user has the functionality enabled.
	*/
	
	if(arFlakes.length < 1)
	{
		return;
	}
	
	switch(oUser.user_UseFlakes)
	{
		case "1":
			arFlakeRange.low = 30000;
			arFlakeRange.high = 45000;
			break;
		case "2":
			arFlakeRange.low = 6000;
			arFlakeRange.high = 12000;
			break;
		case "3":
			arFlakeRange.low = 1000;
			arFlakeRange.high = 8000;
			break;
		default:
			HideFlakes();
			return;	
	}

	for(i = 0; i < maxFlakes; i++)
	{
		aFlake = arFlakes[i];

		if(!aFlake)
		{
			continue;
		}

		if(aFlake.visible == true)
		{
			if(aFlake.yp < 75)
			{
				aFlake.yp += aFlake.sty;
				aFlake.dx += aFlake.stx;
				document.getElementById("dot" + aFlake.id).style.top = aFlake.yp + "px";
				document.getElementById("dot" + aFlake.id).style.left= aFlake.xp + aFlake.am * Math.sin(aFlake.dx)+"px";  
			}
			else
			{
				/*
					Hide the flake for an arbitrary time after it has
					sat at the bottom of the page
				*/
				aFlake.counter--;
				if(aFlake.counter == 0)
				{
					el = document.getElementById("dot" + aFlake.id);
					el.style.visibility = "hidden";
					aFlake.visible = false;
				}
			}
		}
		else
		{
			/*
				What this code does is make it so sometimes the flakes
				are thicker and other times there's fewer of them.
			*/
			arFlakeRange.counter--;
			if(arFlakeRange.counter == 0)
			{
				arFlakeRange.counter = Math.round(Math.random() * (arFlakeRange.high - arFlakeRange.low)) + arFlakeRange.low;
			}

			randVal = Math.round(Math.random() * arFlakeRange.counter);
			
			if(randVal < 2)
			{
				arFlakeRange.counter = Math.round(Math.random() * (arFlakeRange.high - arFlakeRange.low)) + arFlakeRange.low;				
				doc_width = document.body.clientWidth;
				aFlake.dx = 0;								//	set coordinate variables
				aFlake.xp = Math.random()*(doc_width - 80);  	// set position variables
				aFlake.yp = 0;								//	Start them all at the top of the page
				aFlake.am = Math.random()*20;         		// set amplitude variables
				aFlake.stx = 0.02 + Math.random()/10; 		// set step variables
				aFlake.sty = 0.2 + Math.random();     		// set step variables
				aFlake.counter = Math.round(Math.random() * 900) + 150;
				aFlake.visible = true;
	
				el = document.getElementById("dot" + aFlake.id);
				el.style.top = aFlake.yp + "px";
				el.style.left = aFlake.xp + "px";
				el.style.visibility = "visible";
			}
		}
	}
	
	clearTimeout(snowTimer);
	snowTimer = setTimeout("flakesFalling()", 25);
}
/*
	Image can be changed upon date or whatever.
	Just put it in as month for now
*/
function flakeSetup()
{
	var currentTime = new Date()

	month = currentTime.getMonth();
	day = currentTime.getDate();
	
	fallingImages = new Array();	
	
	//January
	fallingImages[0] = new Object();
	fallingImages[0].image = "snow.gif";
	fallingImages[0].message = "Enjoy the snow!";
	
	fallingImages[0][1] = new Object();
	fallingImages[0][1].image = "newyear.gif";
	fallingImages[0][1].message = "Happy New Year!!!";
	
	//February
	fallingImages[1] = new Object();
	fallingImages[1].image = "heart.gif";
	fallingImages[1].message = "Happy Valentine's Day!";
	
	fallingImages[1][14] = new Object();
	fallingImages[1][14].image = "heart.gif";
	fallingImages[1][14].message = "Happy Valentine's Day!";

	//March
	fallingImages[2] = new Object();
	fallingImages[2].image = "clover.gif";
	fallingImages[2].message = "Spring is here!";

	//April
	fallingImages[3] = new Object();
	fallingImages[3].image = "raindrop.gif";
	fallingImages[3].message = "April Showers!";

	//May
	fallingImages[4] = new Object();
	fallingImages[4].image = "flower.gif";
	fallingImages[4].message = "Enjoy May flowers!";

	fallingImages[4][5] = new Object();
	fallingImages[4][5].image = "spiderman.gif";
	fallingImages[4][5].message = "Spider-sense, tingling!";

	//June
	fallingImages[5] = new Object();
	fallingImages[5].image = "sun.gif";
	fallingImages[5].message = "Summer is here!";

	//July
	fallingImages[6] = new Object();
	fallingImages[6].image = "independence.gif";
	fallingImages[6].message = "Time for fireworks!";

	fallingImages[6][3] = new Object();
	fallingImages[6][3].image = "fireworks.gif";
	fallingImages[6][3].message = "Happy 4th of July!";

	fallingImages[6][4] = new Object();
	fallingImages[6][4].image = "fireworks.gif";
	fallingImages[6][4].message = "Happy 4th of July!";

	fallingImages[6][5] = new Object();
	fallingImages[6][5].image = "fireworks.gif";
	fallingImages[6][5].message = "Happy 4th of July!";

	//August
	fallingImages[7] = new Object();
	fallingImages[7].image = "kite.gif";
	fallingImages[7].message = "Enjoy the weather while it lasts!";

	//September
	fallingImages[8] = new Object();
	fallingImages[8].image = "leaf.gif";
	fallingImages[8].message = "Fall is here!";

	//October 
	fallingImages[9] = new Object();
	fallingImages[9].image = "witch.gif";
	fallingImages[9].message = "Happy Halloween!";

	//November
	fallingImages[10] = new Object();
	fallingImages[10].image = "thanksgiving.gif";
	fallingImages[10].message = "It's Turkey time!";
	
	//December
	fallingImages[11] = new Object();
	fallingImages[11].image = "present.gif";
	fallingImages[11].message = "Happy Holidays!";

	flake_image = "";
	flake_message = "";
	
	if(fallingImages[month])
	{
		if(fallingImages[month][day])
		{
			flake_image = "../image/" + fallingImages[month][day].image;
			flake_message = fallingImages[month][day].message;
		}
		else
		{
			flake_image = "../image/" + fallingImages[month].image;
			flake_message = fallingImages[month].message;
		}
	}

	if(flake_image.length > 0)
	{
		CreateFlakes();
		flakesFalling();
	}

	
	oSystemListener.add("Preferences", flakesFalling);
}