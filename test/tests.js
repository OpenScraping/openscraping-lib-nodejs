/*
This file conforms to ESLint linting rules: http://eslint.org/docs/user-guide/command-line-interface.
ESLine configuration is below. Here is what the numbers mean:
0 - turn the rule off
1 - turn the rule on as a warning (doesn't affect exit code)
2 - turn the rule on as an error (exit code is 1 when triggered)
*/

/* eslint-env node */
/* eslint no-trailing-spaces: [2, { "skipBlankLines": true }] */
/* global describe it */

'use strict'

var assert = require('chai').assert
var async = require('async')
var fs = require('fs')
var path = require('path')
var openscraping = require('../')
var mapTransformations = require('../mapTransformations')
var lint = require('mocha-eslint')
var scrapingResults

function readFilesAsync (file, callback) {
  fs.readFile(path.resolve(__dirname, file), 'utf8', callback)
}

// Run xpath tests
describe('xpath', function () {
  it('should extract values correctly for BBC News', function (done) {
    var files = ['www.bbc.com.json', 'www.bbc.com.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.strictEqual(scrapingResults.title, 'Robert Downey Jr pardoned for 20-year-old drug conviction', 'The title was not extracted correctly')
      assert.strictEqual(scrapingResults.dateTime, '2015-12-24', 'The date was not extracted correctly')
      assert.isString(scrapingResults.body, 'The extracted body should be of type string')
      assert.isAbove(scrapingResults.body.length, 0, 'The extracted body should have a length > 0')
      
      done()
    })
  })
  
  it('should extract values correctly from IKEA', function (done) {
    var files = ['www.ikea.com.json', 'www.ikea.com.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.isObject(scrapingResults, 'The scraping results should be of type object')
      assert.isArray(scrapingResults.products, 'The extracted products should be of type array')
      assert.strictEqual(scrapingResults.products.length, 61, 'The code should extract 61 products from the page')
      
      for (var i = 0; i < scrapingResults.products.length; i++) {
        var product = scrapingResults.products[i]
        assert.isString(product.title, 'The extracted product title should be of type string')
        assert.isString(product.description, 'The extracted product description should be of type string')
        assert.isString(product.price, 'The extracted product price should be of type string')
        
        assert.isAbove(product.title.length, 0, 'The product title should have a length > 0')
        assert.isAbove(product.description.length, 0, 'The product description should have a length > 0')
        assert.isAbove(product.price.length, 0, 'The product price should have a length > 0')
      }
      
      var lastProduct = scrapingResults.products[60]
      assert.strictEqual(lastProduct.title, 'SANDHAUG', 'The title of the last product should be: SANDHAUG')
      assert.strictEqual(lastProduct.description, 'tray table', 'The title of the last product should be: tray table')
      assert.strictEqual(lastProduct.price, '$79.99', 'The title of the last product should be: $79.99')
      
      done()
    })
  })
  
  it('should not extract any values for the wrong config', function (done) {
    var files = ['www.bbc.com.json', 'www.ikea.com.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.isObject(scrapingResults, 'The scraping results should be of type object')
      assert.strictEqual(Object.keys(scrapingResults).length, 0, 'The scrapingResults object should be empty')
      
      done()
    })
  })
  
  it('should always extract an array when _forceArray is true', function (done) {
    var config = `
    {
      "title":
      {
        "_xpath": "//h1",
        "_forceArray": true
      },
      "body": "//div[contains(@class, 'article')]",
      "noMatch":
      {
        "_xpath": "//notag",
        "_forceArray": true
      },
      "footer":
      {
        "_xpath": "//p",
        "_forceArray": false
      }
    }
    `

    var html = '<html><body><h1>Article title</h1><div class="article">Article contents</div><p>Footer1</p><p>Footer2</p></body></html>'
    
    scrapingResults = openscraping.parse(JSON.parse(config), html)
    assert.isObject(scrapingResults, 'The scraping results should be of type object')
    assert.strictEqual(Object.keys(scrapingResults).length, 4, 'The scrapingResults object should contain four items')
    
    assert.isArray(scrapingResults.title, 'scrapingResults.title should be an array because we set _forceArray: true')
    assert.strictEqual(scrapingResults.title.length, 1, 'scrapingResults.title should contain a single item because the rule matches once')
    
    assert.isString(scrapingResults.body, 'scrapingResults.body should be a string because we did not set _forceArray: true and the rule only matches once in the HTML')
    
    assert.isArray(scrapingResults.noMatch, 'scrapingResults.noMatch should be an array because we set _forceArray: true')
    assert.strictEqual(scrapingResults.noMatch.length, 0, 'scrapingResults.noMatch should contain no items because the rule does not match')
    
    assert.isArray(scrapingResults.footer, 'scrapingResults.footer should be an array because the rule should match twice, even if we did not set _forceArray: true')
    assert.strictEqual(scrapingResults.footer.length, 2, 'scrapingResults.footer should contain two items')
    
    done()
  })
})

// Run eslint
// Disabled due to eslint config problem: https://github.com/OpenScraping/openscraping-lib-nodejs/issues/2
/*
describe('eslint', function () {
  var paths = [
    '*.js',
    'test/*.js'
  ]

  var options = {}
  options.formatter = 'compact'

  lint(paths, options)
})
*/

// Run _removeNodes tests
describe('_removeNodes rules in the config file', function () {
  
  it('should correctly remove the script tags from an HTML page with script tags', function (done) {
    var files = ['remove-script-tags-test.json', 'remove-script-tags-test.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.isObject(scrapingResults, 'The scraping results should be of type object')
      assert.strictEqual(scrapingResults.adsWithScript, 'Only text that should remain here', 'scrapingResults.adsWithScript should only contain the text that remains after we removed the script tags and their contents')
      
      done()
    })
  })

  it('should correctly remove unwanted nodes from a complex HTML page', function (done) {
    var files = ['remove-unwanted-nodes.json', 'remove-unwanted-nodes.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.isObject(scrapingResults, 'The scraping results should be of type object')
      assert.isString(scrapingResults.text, 'scrapingResults.text should exist and be a string')
      assert.isAbove(scrapingResults.text.length, 0, 'The extracted text should have a length > 0')
      assert.notInclude(scrapingResults.text, 'Last Updated: February 14 2016', '_removeNodes rule should have removed the author and date div')
      assert.notInclude(scrapingResults.text, 'Venus Williams: Victorious', '_removeNodes rule should have removed the image caption')
      assert.notInclude(scrapingResults.text, 'Related Content', '_removeNodes rule should have removed the related content box')
      
      done()
    })
  })  
})

// Run transformation tests
describe('mapTransformations.TrimTransformation', function () {
  it('should trim text', function (done) {
    assert.strictEqual(mapTransformations.TrimTransformation('no outside spaces    '), 'no outside spaces', 'Should remove whitespace to the left and right of the string')
    assert.strictEqual(mapTransformations.TrimTransformation('    no outside spaces'), 'no outside spaces', 'Should remove whitespace to the left and right of the string')
    assert.strictEqual(mapTransformations.TrimTransformation('    no outside spaces    '), 'no outside spaces', 'Should remove whitespace to the left and right of the string')
    assert.strictEqual(mapTransformations.TrimTransformation(' no outside spaces '), 'no outside spaces', 'Should remove whitespace to the left and right of the string')
    
    done()
  })
})

describe('mapTransformations.ParseDateTransformation', function () {
  it('should parse text to date', function (done) {
    assert.isUndefined(mapTransformations.ParseDateTransformation('no date here'), 'An invalid date text should not be parsed to a date object')
    assert.strictEqual(mapTransformations.ParseDateTransformation('2016-01-06', { '_format': 'YYYY' }), '2016', 'Should correctly parse the text to date')
    
    done()
  })
})

describe('mapTransformations.RemoveExtraWhitespaceTransformation', function () {
  it('should replace extra whitespaces', function (done) {
    assert.strictEqual(mapTransformations.RemoveExtraWhitespaceTransformation('no  extra    whitespaces    '), 'no extra whitespaces ', 'Should replace any two consecutive whitespaces with a single whitespace')
    
    done()
  })
})

describe('mapTransformations.TextExtractionBetterWhitespaceTransformation', function () {
  it('should add extra white spaces between a subheading and the body of the article', function (done) {
    var config = `
    {
      "body":
      {
        "_xpath": "//div[contains(@class, 'article')]",
        "_mapTransformations":
        [
          "TextExtractionBetterWhitespaceTransformation"
        ]
      }
    }
    `

    var html = '<html><body><h1>Article title</h1><div class="article"><h2>Subheading</h2>Article <a href="">three    words  link </a> contents</div><p>Footer1</p><p>Footer2</p></body></html>'
    
    scrapingResults = openscraping.parse(JSON.parse(config), html)
    assert.isString(scrapingResults.body, 'scrapingResults.body should exist and be a string')
    assert.strictEqual(scrapingResults.body, 'Subheading Article three    words  link  contents', 'body should contain whitespace between the subheading and the article contents')
    
    done()
  })
})

describe('reduceTransformations.MergeTextArrayIntoSingleText', function () {
  it('should merge an array of strings into a single string, while ignoring empty strings', function (done) {
    var files = ['merge-text-array-into-single-text.json', 'merge-text-array-into-single-text.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.isObject(scrapingResults, 'The scraping results should be of type object')
      assert.strictEqual(scrapingResults.text, 'Para1 Para2 Para3 Pa ra4', 'MergeTextArrayIntoSingleText should merge the array into a single string, using white space for concatenation')
      
      done()
    })
  })
})

