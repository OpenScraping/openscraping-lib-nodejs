# OpenScraping HTML Structured Data Extraction Node.js library

[![license:isc](https://img.shields.io/badge/license-isc-brightgreen.svg?style=flat-square)](https://github.com/zmarty/openscraping-lib-nodejs/blob/master/LICENSE) [![Build Status](https://img.shields.io/travis/zmarty/openscraping-lib-nodejs.svg?style=flat-square)](https://travis-ci.org/zmarty/openscraping-lib-nodejs) [![npm package version](https://img.shields.io/npm/v/openscraping.svg?style=flat-square)](https://www.npmjs.com/package/openscraping) [![devDependencies:?](https://img.shields.io/david/zmarty/openscraping-lib-nodejs.svg?style=flat-square)](https://david-dm.org/zmarty/openscraping-lib-nodejs)

Turn unstructured HTML pages into structured data. The OpenScraping library can extract information from HTML pages using a JSON config file with xPath rules. It can extract complex objects such as tables and forum posts.

**Beta version, do not use for production yet.**

The library requires a JSON configuration file and an HTML document as input.

## Self-contained example
First install the package using npm in your project:

```
npm install openscraping
```

Then paste this simple example in a js file and run it with node:
```javascript
var openscraping = require('openscraping')

var config = `
{
  "title": "//h1",
  "body": "//div[contains(@class, 'article')]"
}
`

var html = '<html><body><h1>Article title</h1><div class="article">Article contents</div></body></html>'

var scrapingResults = openscraping.parse(JSON.parse(config), html)

console.log('Extracted title: ' + scrapingResults.title)
console.log('Extracted body: ' + scrapingResults.body)
console.log('Full extracted json: ' + JSON.stringify(scrapingResults))
```

Here is the output:
```
Extracted title: Article title
Extracted body: Article contents
Full extracted json: {"title":"Article title","body":"Article contents"}
```

## Example: Extracting an article from bbc.com

Below is a simple configuration file that extracts an article from [a www.bbc.com page](https://github.com/zmarty/openscraping-lib-nodejs/blob/master/test/www.bbc.com.html).
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

Here is how the [www.bbc.com page](https://github.com/zmarty/openscraping-lib-nodejs/blob/master/test/www.bbc.com.html) looked like on the day we saved the HTML for this sample:
<p align="center"><img src='https://i.imgur.com/jVqxuJn.jpg' alt='BBC News example page' width='500'></p>

## Example: Extracting a list of products from Ikea

The sample configuration below is more complex as it demonstrates support for extracting multiple items at the same time, and running transformations on them. For this example we are using a [products page from ikea.com](https://github.com/zmarty/openscraping-lib-nodejs/blob/master/test/www.ikea.com.html).
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
        "TrimTransformation"
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

Here is how the [www.ikea.com page](https://github.com/zmarty/openscraping-lib-nodejs/blob/master/test/www.ikea.com.html) looked like on the day we saved the HTML for this sample:
<p align="center"><img src='https://i.imgur.com/2Q65ybI.jpg' alt='Ikea example page' width='500'></p>
