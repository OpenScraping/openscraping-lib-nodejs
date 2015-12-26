# openscraping-lib-nodejs

Alpha version, do not use yet.

[![Build Status](https://travis-ci.org/zmarty/openscraping-lib-nodejs.svg?branch=master)](https://travis-ci.org/zmarty/openscraping-lib-nodejs)

Turn unstructured HTML pages into structured data. The OpenScraping library can extract information from HTML pages using a JSON config file with xPath rules. It can extract complex objects such as tables and forum posts.

The library requires a JSON configuration file and an HTML document as input.

Here is a simple configuration file that extracts an article from www.bbc.com pages:
```javascript
{
	"title": "//div[contains(@class, 'story-body')]//h1",
	"dateTime": "//div[contains(@class, 'story-body')]//div[contains(@class, 'date')]",
	"body": "//div[@property='articleBody']"
}
```

And here is how to call the library:
```javascript
var openscraping = require('openscraping')
scrapingResults = openscraping.parse(JSON.parse(config), html)
console.log(scrapingResults.title)
```
