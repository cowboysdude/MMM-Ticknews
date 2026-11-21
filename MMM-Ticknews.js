/* MagicMirror² Module: MMM-Ticknews
 * By cowboysdude
 *
 * A news ticker: one headline at a time from any RSS/Atom feeds,
 * with how long ago it was posted. Tap a headline (touch mirrors)
 * to read its summary.
 */
Module.register("MMM-Ticknews", {
	defaults: {
		urls: ["https://feeds.npr.org/1001/rss.xml"], // any RSS or Atom feeds, as many as you like
		articles: 50,              // up to how many headlines to keep (all feeds together)
		random: true,              // true = random order, false = newest first
		rotateInterval: 10 * 1000, // next headline every 10 seconds
		updateInterval: 15 * 60 * 1000, // get fresh news every 15 minutes
		css: "plain",              // plain, red, blue, orange, gold, black, green or lblue
		timeAgo: "",               // color of the "2 hours ago" text, e.g. "white" (blank = theme color)
		showSource: true,          // show which feed the headline came from
		readInterval: 30 * 1000,   // a tapped summary closes on its own after 30 seconds
		maxWidth: "950px",
		retryDelay: 5 * 60 * 1000,
		animationSpeed: 500
	},

	themes: ["plain", "red", "blue", "orange", "gold", "black", "green", "lblue"],

	getStyles () {
		return [this.file("MMM-Ticknews.css")];
	},

	start () {
		Log.info(`Starting module: ${this.name}`);
		this.items = [];
		this.order = [];
		this.pos = 0;
		this.error = null;
		this.reading = null;
		this.theme = this.themes.includes(String(this.config.css)) ? String(this.config.css) : "plain";
		const urls = Array.isArray(this.config.urls) ? this.config.urls : [this.config.urls];
		this.urls = urls.filter((u) => typeof u === "string" && u.trim());
		if (!this.urls.length) return;
		this.request();
		setInterval(() => this.request(), this.config.updateInterval);
		this.startRotation();
		// Keep "x minutes ago" up to date
		setInterval(() => { if (!this.reading) this.updateDom(0); }, 60 * 1000);
	},

	startRotation () {
		clearInterval(this.rotateTimer);
		this.rotateTimer = setInterval(() => {
			if (this.reading || this.order.length < 2) return;
			this.pos++;
			if (this.pos >= this.order.length) this.makeOrder();
			this.updateDom(this.config.animationSpeed);
		}, this.config.rotateInterval);
	},

	makeOrder () {
		this.order = this.items.map((_, i) => i);
		if (this.config.random !== false) {
			for (let i = this.order.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[this.order[i], this.order[j]] = [this.order[j], this.order[i]];
			}
		}
		this.pos = 0;
	},

	request () {
		this.sendSocketNotification("TICKNEWS_GET", {
			id: this.identifier, urls: this.urls, articles: this.config.articles
		});
	},

	socketNotificationReceived (notification, payload) {
		if (!payload || payload.id !== this.identifier) return;
		if (notification === "TICKNEWS_DATA") {
			const first = !this.items.length;
			this.items = payload.items;
			this.error = null;
			this.makeOrder();
			if (first) this.updateDom(this.config.animationSpeed);
		} else if (notification === "TICKNEWS_ERROR") {
			this.error = payload.message;
			clearTimeout(this.retryTimer);
			this.retryTimer = setTimeout(() => this.request(), this.config.retryDelay);
			if (!this.items.length) this.updateDom(this.config.animationSpeed);
		}
	},

	// Voice control (MMM-voice and friends)
	notificationReceived (notification) {
		if (notification === "SHOW_ARTICLE") this.openSummary();
		else if (notification === "HIDE_ARTICLE") this.closeSummary();
	},

	current () {
		if (!this.items.length) return null;
		return this.items[this.order[this.pos % this.order.length]];
	},

	openSummary () {
		const item = this.current();
		if (!item) return;
		this.reading = item;
		clearTimeout(this.readTimer);
		this.readTimer = setTimeout(() => this.closeSummary(), this.config.readInterval);
		this.updateDom(0);
	},

	closeSummary () {
		if (!this.reading) return;
		this.reading = null;
		clearTimeout(this.readTimer);
		this.updateDom(0);
	},

	timeAgo (t) {
		if (!t) return "";
		const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
		const units = [["year", 31557600], ["month", 2629800], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
		for (const [name, size] of units) {
			const n = Math.floor(s / size);
			if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`;
		}
		return "just now";
	},

	el (tag, cls, text) {
		const e = document.createElement(tag);
		if (cls) e.className = cls;
		if (text !== undefined) e.textContent = text;
		return e;
	},

	getDom () {
		const wrap = this.el("div", `tn tn-${this.theme}`);
		wrap.style.maxWidth = this.config.maxWidth;

		if (!this.urls.length) {
			wrap.appendChild(this.el("div", "tn-msg", "MMM-Ticknews: add at least one feed to urls in config.js."));
			return wrap;
		}
		const item = this.current();
		if (!item) {
			wrap.appendChild(this.el("div", "tn-msg",
				this.error ? "News not available right now. Trying again soon." : "Getting the news…"));
			return wrap;
		}

		const bar = this.el("div", "tn-bar");
		bar.appendChild(this.el("span", "tn-label", "The News"));
		const ago = this.el("span", "tn-ago", this.timeAgo(item.time));
		if (this.config.timeAgo) ago.style.color = this.config.timeAgo;
		bar.appendChild(ago);
		if (this.config.showSource && item.source) bar.appendChild(this.el("span", "tn-source", item.source));
		wrap.appendChild(bar);

		const head = this.el("div", "tn-headline", item.title);
		head.addEventListener("click", () => (this.reading ? this.closeSummary() : this.openSummary()));
		wrap.appendChild(head);

		if (this.reading) {
			const box = this.el("div", "tn-summary");
			box.appendChild(this.el("div", "tn-summary-title", this.reading.title));
			box.appendChild(this.el("div", "tn-summary-text", this.reading.summary || "No summary for this story."));
			box.appendChild(this.el("div", "tn-summary-close", "Tap to close"));
			box.addEventListener("click", () => this.closeSummary());
			wrap.appendChild(box);
		}
		return wrap;
	}
});
