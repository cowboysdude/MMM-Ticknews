/* Magic Mirror
 * Module: MMM-Ticknews .. redux 2/2019
 * By cowboysdude
 *
 */
 
 
Module.register('MMM-Ticknews', {

    // Module config defaults.
    defaults: {
        updateInterval: 60 * 60 * 1000,
        animationSpeed: 0,
        initialLoadDelay: 10,
        random: true,
        articles: "10",
        urls: [],
        rotateInterval: 5 * 1000,
        css: "",
        timeAgo: "#000",
        readInterval: 10 * 1000
    },

    // Define required scripts.
    getScripts: function() {
        return ['moment.js'];
    },

    getStyles: function() {
        if (this.config.css != "") {
            return ["modules/MMM-Ticknews/css/" + this.config.css + ".css"];
        } else {
            return ["modules/MMM-Ticknews/css/plain.css"];
        }
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification('CONFIG', this.config);
        this.config.lang = this.config.lang || config.language;
        this.scheduleUpdate();
        this.news = [];
        this.activeItem = 0;
        this.rotateInterval = null;
        moment.locale(config.language);
    },
 /////////// BY STIGH to work with voice ///////////////////////
   notificationReceived: function(notification, payload) {
        if (notification === 'SHOW_ARTICLE') {
            document.getElementsByClassName('titles')[0].click();
        } else if (notification === 'HIDE_ARTICLE') {
            document.getElementById('myframe').click();
        }
    },
//////////////////////////////////////////////////////////////
    scheduleCarousel: function() {
        console.log("Scheduling news items");
        this.rotateInterval = setInterval(() => {
            this.activeItem++;
            this.updateDom(this.config.animationSpeed);
        }, this.config.rotateInterval);
    },

    getDom: function() {

        var wrapper = document.createElement("div");
        wrapper.classList.add("contents");

        var keys = Object.keys(this.news);
        if (keys.length > 0) {
            if (this.activeItem >= keys.length) {
                this.activeItem = 0;
            }
            var news = this.news[keys[this.activeItem]];

            date = moment(news.pubDate[0]).format("LL");
            time = moment(news.pubDate[0]).valueOf();

            function timeago(date) {
                var seconds = Math.floor((new Date() - time) / 1000);
                if (Math.round(seconds / (60 * 60 * 24 * 365.25)) >= 2) return Math.round(seconds / (60 * 60 * 24 * 365.25)) + " years ago";
                else if (Math.round(seconds / (60 * 60 * 24 * 365.25)) >= 1) return "1 year ago";
                else if (Math.round(seconds / (60 * 60 * 24 * 30.4)) >= 2) return Math.round(seconds / (60 * 60 * 24 * 30.4)) + " months ago";
                else if (Math.round(seconds / (60 * 60 * 24 * 30.4)) >= 1) return "1 month ago";
                else if (Math.round(seconds / (60 * 60 * 24 * 7)) >= 2) return Math.round(seconds / (60 * 60 * 24 * 7)) + " weeks ago";
                else if (Math.round(seconds / (60 * 60 * 24 * 7)) >= 1) return "1 week ago";
                else if (Math.round(seconds / (60 * 60 * 24)) >= 2) return Math.round(seconds / (60 * 60 * 24)) + " days ago";
                else if (Math.round(seconds / (60 * 60 * 24)) >= 1) return "1 day ago";
                else if (Math.round(seconds / (60 * 60)) >= 2) return Math.round(seconds / (60 * 60)) + " hours ago";
                else if (Math.round(seconds / (60 * 60)) >= 1) return "1 hour ago";
                else if (Math.round(seconds / 60) >= 2) return Math.round(seconds / 60) + " minutes ago";
                else if (Math.round(seconds / 60) >= 1) return "1 minute ago";
                else if (seconds >= 2) return this.translate("seconds ago");
                else return "seconds ago";
            }

            var tio = document.createElement("div");
            tio.classList.add("title");
            tio.innerHTML = "  The News <font color= " + this.config.timeAgo + ">" + timeago(date) + "</font>";
            wrapper.appendChild(tio);

            var ntime = moment(news.pubDate[0]).format('YYYY,M,DD');
            var stime = moment([ntime]).fromNow();

            var title = document.createElement("div");
            title.classList.add("titles")
            title.innerHTML = news.title;
            title.addEventListener("click", () => showdesc(this)); //Show description on click
            wrapper.appendChild(title);

            function showdesc(thisdesc) {
                thisdesc.intpause();
                var readTimer = setTimeout(function() {
                    hidedesc(thisdesc)
                }, thisdesc.config.readInterval); //sets timeout for the description
                description = document.createElement("div");
                description.className = "infoCenter";
                description.innerHTML = "<iframe id = 'myframe' src=" + news.link[0] + " height='650' width='99%' align='middle'></iframe><a class= 'link button1' href='javascript:closeIframe();'>CLOSE</a>";
                description.addEventListener("click", () => closeIframe()); //Hide description on click
                description.addEventListener("click", () => clearTimeout(readTimer)); //Stop timer when clicked so the next title doesn't reload again.
                description.addEventListener("click", () => thisdesc.scheduleCarousel());
                wrapper.appendChild(description);
            };

            function closeIframe() {
                var iframe = document.getElementById('myframe');
                iframe.parentNode.removeChild(iframe);
                description.style.display = "none";
            }
        }
        return wrapper;
    },

    intpause: function() {
        clearInterval(this.rotateInterval);
    },

    processNEWS: function(data) {
        this.today = data.Today;
        this.news = data[0].item;
        this.title = data[0].title[0];
        console.log(this.news);
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getNEWS();
        }, this.config.updateInterval);
        this.getNEWS(this.config.initialLoadDelay);
    },

    getNEWS: function() {
        this.sendSocketNotification('GET_TICKNEWS');
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "TICKNEWS_RESULT") {
            this.processNEWS(payload);
        }
        if (this.rotateInterval == null) {
            this.scheduleCarousel();
        }

        this.updateDom();
    }

});
