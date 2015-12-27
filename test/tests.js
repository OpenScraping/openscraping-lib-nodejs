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
      assert.strictEqual('Robert Downey Jr pardoned for 20-year-old drug conviction', scrapingResults.title, 'The title was not extracted correctly')
      assert.strictEqual('2015-12-24', scrapingResults.dateTime, 'The date was not extracted correctly')
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
      assert.strictEqual(61, scrapingResults.products.length, 'The code should extract 61 products from the page')
      
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
      assert.strictEqual('SANDHAUG', lastProduct.title, 0, 'The title of the last product should be: SANDHAUG')
      assert.strictEqual('tray table', lastProduct.description, 0, 'The title of the last product should be: tray table')
      assert.strictEqual('$79.99', lastProduct.price, 0, 'The title of the last product should be: $79.99')
      
      done()
    })
  })
  
  it('should not extract any values for the wrong config', function (done) {
    var files = ['www.bbc.com.json', 'www.ikea.com.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.isObject(scrapingResults, 'The scraping results should be of type object')
      assert.strictEqual(0, Object.keys(scrapingResults).length, 'The scrapingResults object should be empty')
      
      done()
    })
  })
  
  it('should only extract an empty array for a wrong config when _forceArray is true', function (done) {
    var files = ['www.bbc.com.forceArray.json', 'www.ikea.com.html']
    
    async.map(files, readFilesAsync, function (err, results) {
      if (err) throw err
     
      scrapingResults = openscraping.parse(JSON.parse(results[0]), results[1])
      assert.isObject(scrapingResults, 'The scraping results should be of type object')
      assert.strictEqual(1, Object.keys(scrapingResults).length, 'The scrapingResults object should have one item because we set _forceArray: true for dateTime')
      assert.isArray(scrapingResults.dateTime, 'scrapingResults.dateTime should be an array because we set _forceArray: true for dateTime')
      assert.strictEqual(0, scrapingResults.dateTime.length, 'scrapingResults.dateTime no items because the rule should not match')
      
      done()
    })
  })
})

// Run eslint
describe('eslint', function () {
  var paths = [
    '*.js',
    'test/*.js'
  ]

  var options = {}
  options.formatter = 'compact'

  lint(paths, options)
})
