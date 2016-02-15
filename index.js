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
  var mapTransformations = require('./mapTransformations')
  var reduceTransformations = require('./reduceTransformations')
  
  jsdom.defaultDocumentFeatures = {
    FetchExternalResources: false,
    ProcessExternalResources: false,
    MutationEvents: false
  }
  
  return {
    parse: parse
  }

  function parse (config, html, externalMapTransformations, externalReduceTransformations) {
    config = config || {}
    externalMapTransformations = externalMapTransformations || {}
    externalReduceTransformations = externalReduceTransformations || {}
    
    // Merge external mapTransformations with built-in ones
    for (var attrname in externalMapTransformations) {
      mapTransformations[attrname] = externalMapTransformations[attrname]
    }

    // Merge external reduceTransformations with built-in ones
    for (var attrname in externalReduceTransformations) {
      reduceTransformations[attrname] = externalReduceTransformations[attrname]
    }
    
    var document = jsdom.jsdom(html.toString())
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
        maybeRemoveNodes(config, doc)
        
        if (hasChildrenRules) {
          for (i = 0; i < nodes.length; i++) {
            node = nodes[i]
            extractedElements.push(parseChildren(config, node))
          }
          
          return extractedElements
        } else { // Leaf node(s), so we will attempt to extract text
          for (i = 0; i < nodes.length; i++) {
            node = nodes[i]
            extractedElements.push(runMapTransformations(node, config._transformations || config._mapTransformations || []))
          }

          extractedElements = runReduceTransformations(extractedElements, config._reduceTransformations || [])
          
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
    
    maybeRemoveNodes(config, node)
    
    for (var configKey in config) {
      if (typeof configKey === 'string' && configKey.length > 0 && configKey[0] !== '_') {
        var configValue = config[configKey]
        var parseResults = parseNode(configValue, node)
        
        if (typeof parseResults !== 'undefined') {
          ret[configKey] = parseResults
        }
      }
    }
    
    return ret
  }
  
  function maybeRemoveNodes (config, node) {    
    if (config && config._removeNodes && node) {
      var removeNodeRules = config._removeNodes
      
      if (typeof removeNodeRules === 'string') {
        removeNodeRules = [ removeNodeRules ]
      }
    
      if (removeNodeRules.length) {
        removeNodes(removeNodeRules, node)
      }
    }
  }
  
  function removeNodes (removeNodeRules, node) {
    for (var removeNodeIndex in removeNodeRules) {
      var removeNodeRule = removeNodeRules[removeNodeIndex]
      var nodesToRemove = xpath.select(removeNodeRule, node)
      
      if (typeof nodesToRemove !== 'undefined') {
        for (var i = 0; i < nodesToRemove.length; i++) {
          removeNode(nodesToRemove[i])
        }
      }
    }
  }
  
  function removeNode (node) {
    if (node && node.parentNode) {
      node.parentNode.removeChild(node)
    }
  }
  
  function runMapTransformations (node, requestedTransformations) {
    if (requestedTransformations.length === 0) {
      return node.textContent
    } else {
      for (var i = 0; i < requestedTransformations.length; i++) {
        var requestedTransformation = requestedTransformations[i]
        
        if (typeof requestedTransformation === 'string') {
          requestedTransformation = { '_type': requestedTransformation }
        }
        
        if (mapTransformations[requestedTransformation._type]) {
          node = mapTransformations[requestedTransformation._type](node, requestedTransformation)
        } else {
          throw new Error('The requested transformation ' + requestedTransformation + ' was not found within the available mapTransformations')
        }
      }
      
      if (typeof node !== 'string') {
        return node.textContent
      } else {
        return node
      }
    }
  }
  
  function runReduceTransformations (extractedElements, requestedTransformations) {
    if (requestedTransformations.length === 0 || !Array.isArray(extractedElements)) {
      return extractedElements
    } else {
      for (var i = 0; i < requestedTransformations.length; i++) {
        var requestedTransformation = requestedTransformations[i]
        
        if (typeof requestedTransformation === 'string') {
          requestedTransformation = { '_type': requestedTransformation }
        }
        
        if (reduceTransformations[requestedTransformation._type]) {
          extractedElements = reduceTransformations[requestedTransformation._type](extractedElements, requestedTransformation)
        } else {
          throw new Error('The requested transformation ' + requestedTransformation + ' was not found within the available reduceTransformations')
        }
      }
      
      return extractedElements
    }
  }
}())
