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

module.exports = (function createTransformations () {
  var moment = require('moment')
  var findExtraWhitespacesRegex = new RegExp('\\s\\s+', 'gm')
  
  return {
    TrimTransformation: trim,
    ParseDateTransformation: parseDate,
    RemoveExtraWhitespaceTransformation: removeExtraWhitespace,
    TextExtractionBetterWhitespaceTransformation: textExtractionBetterWhitespace
  }
  
  function trim (node, config) {
    var textContent
    
    if (typeof node === 'string') {
      textContent = node
    } else {
      textContent = node.textContent
    }
    
    return textContent.trim()
  }
  
  function parseDate (node, config) {
    var textContent
    
    if (typeof node === 'string') {
      textContent = node
    } else {
      textContent = node.textContent
    }
    
    var extractedDate = moment(new Date(textContent))
    
    if (extractedDate.isValid()) {
      if (config && config._format) {
        return extractedDate.format(config._format)
      } else {
        return extractedDate.format()
      }
    } else {
      return undefined
    }
  }
  
  function removeExtraWhitespace (node, config) {
    var textContent
    
    if (typeof node === 'string') {
      textContent = node
    } else {
      textContent = node.textContent
    }
    
    return textContent.replace(findExtraWhitespacesRegex, ' ')
  }
  
  function textExtractionBetterWhitespace (node, config) {
    var textContent
    
    if (typeof node === 'string') {
      textContent = node
    } else {
      textContent = extractTextContent(node)
    }
    
    return textContent
  }
  
  // Code modified from getTextContent in xmldom/dom.js - https://github.com/jindw/xmldom
  // Node number documentation from https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  function extractTextContent (node) {
    var buf = []
    var textContent
    
    switch (node.nodeType) {
      case 1: // Element node such as <p> or <div>
      case 11: // A DocumentFragment node ( a minimal document object that has no parent)
        node = node.firstChild
        while (node) {
          // Type 7 = a ProcessingInstruction of an XML document such as <?xml-stylesheet ... ?> declaration
          // Type 8 = a Comment node
          if (node.nodeType !== 7 && node.nodeType !== 8) {
            textContent = extractTextContent(node)
            
            if (textContent.length > 0 && buf.length > 0) {
              var previousTextContent = buf[buf.length - 1]
              
              if (textContent[0] !== ' ' && previousTextContent.length > 0 && previousTextContent[previousTextContent.length - 1] !== ' ') {
                buf.push(' ')
              }
            }
            
            buf.push(textContent)
          }
          node = node.nextSibling
        }
        return buf.join('')
      default:
        return node.nodeValue
    }
  }
}())
