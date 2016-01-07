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
  var jsdom = require('jsdom')
  var xmlser = require('xmlserializer')
  var dom = require('xmldom').DOMParser
  var transformations = require('./transformations')
  
  jsdom.defaultDocumentFeatures = {
    FetchExternalResources: false,
    ProcessExternalResources: false,
    MutationEvents: false
  }
  
  return {
    parse: parse
  }

  function parse (config, html, externalTransformations) {
    config = config || {}
    externalTransformations = externalTransformations || {}
    
    // Merge external transformations with built-in ones
    for (var attrname in externalTransformations) {
      transformations[attrname] = externalTransformations[attrname]
    }
    
    var document = jsdom.jsdom(html.toString())
    var xhtml = xmlser.serializeToString(document)
    xhtml = xhtml.replace(' xmlns="http://www.w3.org/1999/xhtml"', '') // Ugly hack, for now
    var doc = new dom().parseFromString(xhtml)
    return parseNode(config, doc, transformations)
  }
  
  function parseNode (config, doc, transformations) {
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
            extractedElements.push(parseChildren(config, node, transformations))
          }
          
          return extractedElements
        } else { // Leaf node(s), so we will attempt to extract text
          for (i = 0; i < nodes.length; i++) {
            node = nodes[i]
            extractedElements.push(retrieveNodeContents(node, transformations, config._transformations || []))
          }

          if (extractedElements.length === 0 && !config._forceArray) {
            return undefined
          } else if (extractedElements.length === 1 && !config._forceArray) {
            return extractedElements[0]
          } else {
            return extractedElements
          }
        }
      } else {
        return {}
      }
    } else {
      return parseChildren(config, doc, transformations)
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
  
  function parseChildren (config, node, transformations) {
    config = config || {}
    
    var ret = {}
    
    for (var configKey in config) {
      if (typeof configKey === 'string' && configKey.length > 0 && configKey[0] !== '_') {
        var configValue = config[configKey]
        var parseResults = parseNode(configValue, node, transformations)
        
        if (typeof parseResults !== 'undefined') {
          ret[configKey] = parseResults
        }
      }
    }
    
    return ret
  }
  
  function retrieveNodeContents (node, transformations, requestedTransformations) {
    if (requestedTransformations.length === 0) {
      return node.textContent
    } else {
      for (var i = 0; i < requestedTransformations.length; i++) {
        var requestedTransformation = requestedTransformations[i]
        
        if (typeof requestedTransformation === 'string') {
          requestedTransformation = { '_type': requestedTransformation }
        }
        
        if (transformations[requestedTransformation._type]) {
          node = transformations[requestedTransformation._type](node, requestedTransformation)
        } else {
          throw new Error('The requested transformation ' + requestedTransformation + ' was not found within the available transformations')
        }
      }
      
      if (typeof node !== 'string') {
        return node.textContent
      } else {
        return node
      }
    }
  }
}())
