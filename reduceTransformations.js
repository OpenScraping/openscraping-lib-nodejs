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
  return {
    MergeTextArrayIntoSingleText: mergeTextArrayIntoSingleText
  }
  
  function mergeTextArrayIntoSingleText (node, config) {
    var textContent
    
    if (typeof node === 'string') {
      textContent = node
    } else if (Array.isArray(node)) {
      textContent = ""
      
      node.forEach(function(entry) {
        if (typeof entry === 'string') {
          var trimmedEntry = entry.trim()
          
          if (trimmedEntry.length > 0) {
            if (textContent.length > 0) {
              textContent += " "
            }
            
            textContent += trimmedEntry
          }
        }
      })
    }
    
    return textContent
  }
}())
