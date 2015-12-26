/*
This file conforms to ESLint linting rules: http://eslint.org/docs/user-guide/command-line-interface.
ESLine configuration is below. Here is what the numbers mean:
0 - turn the rule off
1 - turn the rule on as a warning (doesn't affect exit code)
2 - turn the rule on as an error (exit code is 1 when triggered)
*/

/* eslint-env node */
/* eslint new-cap: 0 */
/* eslint no-trailing-spaces: [2, { "skipBlankLines": true }] */

'use strict'

module.exports = (function createParser () {
  var xpath = require('xpath')
  var jsdom = require('jsdom').jsdom
  var xmlser = require('xmlserializer')
  var dom = require('xmldom').DOMParser
  
  return {
    parse: parse
  }

  function parse (config, html) {
    config = config || {}
    var document = jsdom(html.toString())
    var xhtml = xmlser.serializeToString(document)
    xhtml = xhtml.replace(' xmlns="http://www.w3.org/1999/xhtml"', '') // Ugly hack, for now
    var doc = new dom().parseFromString(xhtml)
    return parseNode(config, doc)
  }
  
  function parseNode (config, doc) {
    config = config || {}
    
    var hasChildrenRules = hasAnyChildrenRules(config)
    var extractedElements = []
    var i
    var node
    
    if (config && typeof config === 'string') {
      return parseNode({'_xpath': config}, doc)
    } else if (config._xpath && typeof config._xpath === 'string') {
      var nodes = xpath.select(config._xpath, doc)
      
      if (typeof nodes !== 'undefined') {
        if (hasChildrenRules) {
          for (i = 0; i < nodes.length; i++) {
            node = nodes[i]
            extractedElements.push(parseChildren(config, node))
          }
          
          return extractedElements
        } else { // Leaf node(s), so we will attempt to extract text
          for (i = 0; i < nodes.length; i++) {
            node = nodes[i]
            var nodeText = retrieveText(node)
            extractedElements.push(nodeText)
          }
          
          if (extractedElements.length === 1) {
            return extractedElements[0]
          } else {
            return extractedElements
          }
        }
      } else {
        return {}
      }
    } else {
      return parseChildren(config, doc)
    }
  }
  
  function hasAnyChildrenRules (config) {
    config = config || {}
    
    for (var configKey in config) {
      if (typeof configKey === 'string' && configKey.length > 0 && configKey[0] !== '_') {
        return true
      }
    }
    
    return false
  }
  
  function parseChildren (config, node) {
    config = config || {}
    
    var ret = {}
    
    for (var configKey in config) {
      if (typeof configKey === 'string' && configKey.length > 0 && configKey[0] !== '_') {
        var configValue = config[configKey]
        ret[configKey] = parseNode(configValue, node)
      }
    }
    
    return ret
  }
  
  function retrieveText (node) {
    return node.textContent
  }
}())
