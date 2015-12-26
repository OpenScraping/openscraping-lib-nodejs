# OpenScraping Node.js library

Alpha version, do not use for production yet.

[![Build Status](https://travis-ci.org/zmarty/openscraping-lib-nodejs.svg?branch=master)](https://travis-ci.org/zmarty/openscraping-lib-nodejs)

Turn unstructured HTML pages into structured data. The OpenScraping library can extract information from HTML pages using a JSON config file with xPath rules. It can extract complex objects such as tables and forum posts.

The library requires a JSON configuration file and an HTML document as input.

## Example: Extracting an article from bbc.com

Below is a simple configuration file that extracts an article from [a www.bbc.com page](test/www.bbc.com.html).
```javascript
{
	"title": "//div[contains(@class, 'story-body')]//h1",
	"dateTime": "//div[contains(@class, 'story-body')]//div[contains(@class, 'date')]",
	"body": "//div[@property='articleBody']"
}
```

Here is how to call the library:
```javascript
// config contains the JSON config from above, html contains the HTML we want to extract data from
var openscraping = require('openscraping')
scrapingResults = openscraping.parse(JSON.parse(config), html)
console.log(scrapingResults)
```

And here is the result for a bbc news article:
```javascript
{
	title: 'Robert Downey Jr pardoned for 20-year-old drug conviction',
	dateTime: '24 December 2015',
	body: 'Body of the article is shown here'
}
```

## Example: Extracting a list of products from Ikea

The sample configuration below is more complex as it demonstrates support for extracting multiple items at the same time, and running transformations on them. For this exmaple we are using a [products page from ikea.com](test/www.ikea.com.html).
```javascript
{
	"products": 
	{
		"_xpath": "//div[@id='productLists']//div[starts-with(@id, 'item_')]",
		"title": ".//div[contains(@class, 'productTitle')]",
		"description": ".//div[contains(@class, 'productDesp')]",
		"price": 
		{
			"_xpath": ".//div[contains(@class, 'price')]/text()[1]",
			"_transformations": [
				"trim"
			]
		}
	}
}
```

Here is a snippet of the result:
```javascript
{
	products: [{
		title: 'HEMNES',
		description: 'coffee table',
		price: '$139.00'
	},
...
	{
		title: 'NORDEN',
		description: 'sideboard',
		price: '$149.00'
	},
	{
		title: 'SANDHAUG',
		description: 'tray table',
		price: '$79.99'
	}]
}
```
