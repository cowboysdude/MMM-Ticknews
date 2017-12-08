
  /* Magic Mirror
   * Module: MMM-PNews
   *
   * By Cowboysdude
   * MIT Licensed.
   */
  var NodeHelper = require('node_helper');
  var request = require('request');
  const parser = require('xml2js').parseString;
  
 
 module.exports = NodeHelper.create({

start: function() {
    	console.log("Starting module: " + this.name);
    },
    
     getNews: function(url) {
    	request({ 
    	          url: url,
    	          method: 'GET' 
    	        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                parser(body, (err, result)=> {
                    if(result.hasOwnProperty('rss')){
                        var result = JSON.parse(JSON.stringify(result.rss.channel[0].item));
                        this.sendSocketNotification("TICKNEWS_RESULT", result);
                    }
                });
            }
       });
    },
 
     socketNotificationReceived: function(notification, payload) {
         if (notification === 'GET_TICKNEWS') {
             this.getNews(payload);
             
         }
     }
 });
 
