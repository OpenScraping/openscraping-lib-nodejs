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
      assert.strictEqual('24 December 2015', scrapingResults.dateTime, 'The date was not extracted correctly')
      assert.isString(scrapingResults.body, 'The extracted body should be of type string')
      assert.isAbove(scrapingResults.body.length, 0, 'The extracted body should have a length > 0')
      
      done()
    })
  })
})

describe('eslint', function () {
  var paths = [
    '*.js',
    'test/*.js'
  ]

  var options = {}
  options.formatter = 'compact'

  lint(paths, options)
})
