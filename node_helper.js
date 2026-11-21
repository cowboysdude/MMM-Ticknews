/* MagicMirror² Module: MMM-Ticknews
 * By cowboysdude
 *
 * Reads any number of RSS or Atom news feeds and mixes the headlines.
 * No npm install needed: uses the fetch built into Node 18+.
 */
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
	},

	decode (s) {
		return String(s || "")
			.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
			.replace(/<[^>]+>/g, " ")
			.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)))
			.replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
			.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
			.replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&rsquo;|&lsquo;/g, "'")
			.replace(/&ldquo;|&rdquo;/g, "\"").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–")
			.replace(/&hellip;/g, "…").replace(/&amp;/g, "&")
			.replace(/<[^>]+>/g, " ") // tags that were escaped inside the text
			.replace(/\s+/g, " ")
			.replace(/\s+([.,;:!?])/g, "$1")
			.trim();
	},

	tag (xml, names) {
		for (const n of names) {
			const m = xml.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, "i"));
			if (m) return m[1];
		}
		return "";
	},

	parse (xml, url) {
		const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
		const head = xml.split(isAtom ? /<entry[\s>]/i : /<item[\s>]/i)[0];
		const source = this.decode(this.tag(head, ["title"])) || new URL(url).hostname;
		const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
		return blocks.map((b) => {
			let link = this.decode(this.tag(b, ["link"]));
			if (!link) {
				const m = b.match(/<link[^>]*href=["']([^"']+)["']/i);
				if (m) link = m[1];
			}
			const date = new Date(this.decode(this.tag(b, ["pubDate", "published", "updated", "dc:date"])));
			return {
				title: this.decode(this.tag(b, ["title"])),
				summary: this.decode(this.tag(b, ["description", "summary", "content:encoded", "content"])),
				link,
				time: isNaN(date) ? null : date.getTime(),
				source
			};
		}).filter((a) => a.title);
	},

	async getFeed (url) {
		const res = await fetch(url, {
			headers: { "User-Agent": "Mozilla/5.0 (MagicMirror MMM-Ticknews)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
			signal: AbortSignal.timeout(20000)
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return this.parse(await res.text(), url);
	},

	async socketNotificationReceived (notification, payload) {
		if (notification !== "TICKNEWS_GET") return;
		const { id, urls, articles } = payload;
		const results = await Promise.allSettled(urls.map((u) => this.getFeed(u)));
		let all = [];
		results.forEach((r, i) => {
			if (r.status === "fulfilled") all = all.concat(r.value);
			else Log.error(`[MMM-Ticknews] Could not read ${urls[i]}: ${r.reason && r.reason.message}`);
		});
		// Drop duplicates (same headline in two feeds), newest first, keep the requested number
		const seen = new Set();
		all = all.filter((a) => {
			const k = a.title.toLowerCase();
			if (seen.has(k)) return false;
			seen.add(k);
			return true;
		}).sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, Math.max(1, Number(articles) || 50));

		if (all.length) this.sendSocketNotification("TICKNEWS_DATA", { id, items: all });
		else this.sendSocketNotification("TICKNEWS_ERROR", { id, message: "No news from any feed" });
	}
});
