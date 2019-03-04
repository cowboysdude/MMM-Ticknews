# Ticknews


	{
	    disabled: f,
	    module: 'MMM-Ticknews',
	    position: 'lower_third',  //suggested placement as it's long
		config: {
		    css: "plain",  //choice are - plain, red, blue, orange, gold, black, green, light blue (lblue)
		    random: true,  //show stories randomly true or in order false
		    articles: "50", //UP to how many articles do you want to see
			// Enter as many urls as you'd like but be aware the more you put the slower it may become as it has to 				process all the articles whether you see them or not. MUST be seperated by coma
			timeAgo: "white", //change TimeAgo color default is black
			urls: ["http://rssfeeds.usatoday.com/usatoday-newstopstories&x=1"] 
		
			}
	     },
