
  
   /* Magic Mirror
    * Module: MMM-PNews
    *
    * By Cowboysdude
    * MIT Licensed.
    */
   
   Module.register("MMM-Ticknews",{
   
      // Module config defaults.
      defaults: {
          updateInterval: 60*1000, // every 10 minutes
          animationSpeed: 110,
          initialLoadDelay: 5, // 0 seconds delay
          retryDelay: 2500,
          
      },
    
     //  Define required scripts.
       getScripts: function() {
           return ["jquery-1.10.2.min.js","newsTicker.js"];
       },
      getStyles: function() {
           return ["MMM-Ticknews.css"];
       },
  
      // Define start sequence.
      start: function() {
          Log.info("Starting module: " + this.name);
           this.loaded = true;
          // Set locale.
          var self = this;
          this.url = "http://feeds.foxnews.com/foxnews/world?format=xml";
          this.news = [];
          this.scheduleUpdate();
      },
      
     getDom: function() {
     
     var wrapper = document.createElement("div");
     wrapper.classList.add("oneliner");
     
     var heder = document.createElement("div");
     heder.classList.add("heder");
     wrapper.appendChild(heder);
    
      var news = this.news;
     var ully = document.createElement("ul");
     ully.classList.add("newsticker");
    var news=this.news;
      for(var i = 0; i < this.news.length; i++){ 
			var news = this.news[i];
			console.log(news.title);
			
     ully.innerHTML += "<li>"+news.title+"</li>";
			} 
     
     wrapper.appendChild(ully);
     
     
     	 var oneliner = $('.oneliner .newsticker').newsTicker({
                row_height: 44,
                max_rows: 1,
                time: 5000
            });
     	
		
     return wrapper;
 },
  
       processNews: function(data) {
       	 this.today = data.Today;
         this.news = data;
     },
        
    sCarousel: function() {
       		console.log("Processing news items..");
				this.updateDom(this.config.animationSpeed);
	   },
     
     scheduleUpdate: function() {
         setInterval(() => {
             this.getNews();
         }, this.config.updateInterval);
         
         this.getNews(this.config.initialLoadDelay);
     },

     getNews: function() {
         this.sendSocketNotification('GET_TICKNEWS', this.url);
     },

     socketNotificationReceived: function(notification, payload) {
         if (notification === "TICKNEWS_RESULT") {
             this.processNews(payload);
            // if(this.rotate == null){
			 //  	this.sCarousel();
			  // }
             this.updateDom(this.config.animationSpeed);
         }
     },
 });
