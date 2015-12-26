// This example file assumes you installed openscraping through npm in a new separate project
// using the command:  npm install openscraping

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
