# OpenScraping HTML Structured Data Extraction Node.js library

[![license:isc](https://img.shields.io/badge/license-isc-brightgreen.svg?style=flat-square)](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/LICENSE) [![Build Status](https://img.shields.io/travis/OpenScraping/openscraping-lib-nodejs.svg?style=flat-square)](https://travis-ci.org/OpenScraping/openscraping-lib-nodejs) [![npm package version](https://img.shields.io/npm/v/openscraping.svg?style=flat-square)](https://www.npmjs.com/package/openscraping) [![devDependencies:?](https://img.shields.io/david/OpenScraping/openscraping-lib-nodejs.svg?style=flat-square)](https://david-dm.org/OpenScraping/openscraping-lib-nodejs)

Turn unstructured HTML pages into structured data. The OpenScraping library can extract information from HTML pages using a JSON config file with xPath rules. It can scrape even multi-level complex objects such as tables and forum posts. 

This is the **Node.js** version. A separate but similar **C#** library is located [here](https://github.com/Microsoft/openscraping-lib-csharp/).

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

## OpenScraping API Server

If you want to directly run an API server with both a test console UI and an HTTP API, please take a look at the [OpenScraping API Server](https://github.com/OpenScraping/openscraping-api-server-nodejs). The API server does **not** contain a crawler, it just runs rules against HTML sent in with an HTTP POST.

## Example: Extracting an article from bbc.com

Below is a simple configuration file that extracts an article from [a www.bbc.com page](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/test/www.bbc.com.html).
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

Here is how the [www.bbc.com page](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/test/www.bbc.com.html) looked like on the day we saved the HTML for this sample:
<p align="center"><img src='https://i.imgur.com/jVqxuJn.jpg' alt='BBC News example page' width='500'></p>

## Example: Extracting a list of products from Ikea

The sample configuration below is more complex as it demonstrates support for extracting multiple items at the same time, and running transformations on them. For this example we are using a [products page from ikea.com](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/test/www.ikea.com.html).
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
      "_mapTransformations": [
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

Here is how the [www.ikea.com page](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/test/www.ikea.com.html) looked like on the day we saved the HTML for this sample:
<p align="center"><img src='https://i.imgur.com/2Q65ybI.jpg' alt='Ikea example page' width='500'></p>

## Map and Reduce Transformations

In the Ikea example above we used a map transformation called *TrimTransformation*. Transformation modify the raw extracted HTML nodes in some ways. For instance, TrimTransformation just runs [*str*.trim()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim) on the extracted text before it gets written to the JSON output.

The difference between **map** and **reduce** transformations is that map transformations act on individual items (for instance on all paragraphs that match the rule _//p_), while reduce transformations act on the array of extracted items (in our case on all paragraphs). Reduce transformations can be used, for instance, to merge all extracted paragraphs into a single continuous string, because they receive an array of strings as input, and they can choose to return a single string as output.

#### Built-in **map** transformations

Name                                         | Purpose | Example
-------------------------------------------- | ------- | --------------
ParseDateTransformation                      | Uses the [*Date*.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) function to parse a string into a date, then converts it back to a string with a certain date format. | [Here](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/test/www.bbc.com.json)
RemoveExtraWhitespaceTransformation      | Replaces consecutive spaces with a single space. For the string "hello     world" it would return "hello world". | 
TrimTransformation                           | Runs  [*str*.trim()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim) on the extracted text before it gets written to the JSON output.  | [Here](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/test/www.ikea.com.json)
TextExtractionBetterWhitespaceTransformation | The default text extractor just calls *node.textContent*, which often concatenates strings without adding white space between them. This implementation tries to solve this problem by adding extra white spaces in some cases. |

#### Built-in **reduce** transformations

Name                                         | Purpose | Example
-------------------------------------------- | ------- | --------------
MergeTextArrayIntoSingleText                      | Expects an array of strings as input, and outputs a single string that concatenates all strings from the input array. Each string is trimmed. If an array item is empty, it is ignored. The transformation concatenates strings using a single space character. | [Here](https://github.com/OpenScraping/openscraping-lib-nodejs/blob/master/test/merge-text-array-into-single-text.json)
