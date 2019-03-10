/* Magic Mirror
 * Module: MMM-Ticknews
 *
 *  Node helper built with NPM Modules and 
 *  Stack Exchange snippets 
 * 
 *
 * By Cowboysdude
 * MIT Licensed.
 */
var NodeHelper = require('node_helper');
var request = require('request');
const RSSCombiner = require('rss-combiner');
const xml2js = require('xml2js');


module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting module: " + this.name);
    },

    getNews: function(url) {
        const feedConfig = {
            title: this.config.articles+" news articles",
            size: this.config.articles,
            feeds: this.config.urls,
            pubDate: new Date(),
        };

        RSSCombiner(feedConfig)
            .then((combinedFeed) => {
                const xml = combinedFeed.xml();
                const parser = xml2js.Parser({emptyTag : ''});

                parser.parseString(xml, (err, result) => { 
                    var self = this;
                    if (this.config.random != false) {
					//this snippet from StackExchange//
                        function shuffle(array) {
                            var currentIndex = array.length,
                                temporaryValue, randomIndex;

                            // While there remain elements to shuffle...
                            while (0 !== currentIndex) {

                                // Pick a remaining element...
                                randomIndex = Math.floor(Math.random() * currentIndex);

                                currentIndex -= 1;

                                // And swap it with the current element.
                                temporaryValue = array[currentIndex];
                                array[currentIndex] = array[randomIndex];
                                array[randomIndex] = temporaryValue;
                            }

                            return array;
                        }
						
					// Stack Exchange end //
                        var results = shuffle(result.rss.channel);
                       //console.log(results);
					   // console.log("Random");

                        self.sendSocketNotification("TICKNEWS_RESULT", results);
                    } else {
					       console.log(results);
                       console.log("NOT random");
                        var results = result.rss.channel;
                        self.sendSocketNotification("TICKNEWS_RESULT", results);
                    }
                });
            });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'GET_TICKNEWS') {
            this.getNews(payload);

        }
        if (notification === 'CONFIG') {
            this.config = payload;
        }
    }
});