/**
 * @license
 * Copyright 2015 Telefónica Investigación y Desarrollo, S.A.U
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var fs = require('fs'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    estraverse = require('estraverse'),
    async = require('async'),
    doctrine = require('doctrine'),
    _ = require('underscore'),
    errors = require('./errors');

function isJSDoc(comment) {
  return comment.type === 'Block' &&
      comment.value.indexOf('*') === 0;
}

function isTherrorRegister(node) {
  return node &&
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.callee.object.name === 'therror' &&
      node.callee.property.name === 'register';
}

function isNamespaced(node) {
  return node &&
      node.arguments[0].type === 'Literal' &&
      node.arguments[1].type === 'ObjectExpression';

}

/**
 * Takes an AST and adds parsedComments
 * Each node with comments will have 2 new properties
 *  - leadingComments: The raw comment
 *  - jsdoc: The comment analysed as a jsdoc
 *
 * @param {AST} syntax the original AST
 * @return {AST} the new AST with comments
 */
function addComments(syntax) {

  //We attach the comments to the AST
  syntax = escodegen.attachComments(
      syntax,
      syntax.comments,
      syntax.tokens
  );

  //Taverse the AST with comments looking for comments!
  estraverse.traverse(syntax, {
    leave: function(node) {
      if (node.leadingComments) {
        //Comment found!
        //We add the parsed comment to the node,
        node.jsdoc = node.leadingComments
            .filter(function(comment) {
            //is a jsdoc comment?
            return isJSDoc(comment);
          })
          .map(function(comment) {
            return doctrine.parse(comment.value, {
              unwrap: true
            });
          })[0]; //We use only the first jsdoc comment found
      }
    }
  });

  return syntax;
}

function getTherrorDataFromNode(node) {

  var namespace = {
    errors: []
  }, errorsProperties;

  if (isNamespaced(node)) {
    namespace.namespace = node.arguments[0].value;
    errorsProperties = node.arguments[1].properties;
  } else {
    namespace.namespace = null;
    errorsProperties = node.arguments[0].properties;
  }

  namespace.errors = errorsProperties.map(function(errorNode) {
    var val;

    //Get the fields representation
    //Cochinus maximus!
    //dont wanna to traverse all possible values
    //lets escodegen to do the dirty job
    //skype:(devil)
    eval('val = ' + escodegen.generate(errorNode.value)); // eslint-disable-line no-eval
    var fields = _.map(val, function(value, key) {
      return {
        key: key,
        value: value
      };
    });

    //attach comments to the fields
    if (errorNode.value.properties) {
      errorNode.value.properties.forEach(function(item, index) {
        fields[index].doc = item.jsdoc || null;
      });
    }

    var obj = {
      type: errorNode.key.name,
      fields: fields,
      doc: errorNode.jsdoc || null
    };
    return obj;
  });

  return namespace;
}

function parseFileForErrors(filename, cb) {
  fs.readFile(filename, {encoding: 'utf8'}, function(err, code) {
    if (err) {
      return cb(errors.CannotRead(err, err.path));
    }
    var namespaces = [];
    try {

      //We make the AST for the code
      var syntax = addComments(esprima.parse(code, {
        comment: true,
        range: true,
        tokens: true
      }));

      //Traverse the AST with comments looking for comments!
      estraverse.traverse(syntax, {
        leave: function(node) {
          var ns;
          if (node.type === 'ExpressionStatement' &&
              isTherrorRegister(node.expression.right)) {
            //module.exports = therror.register();

            ns = getTherrorDataFromNode(node.expression.right);
            ns.doc = node.jsdoc || null;
            namespaces.push(ns);
          } else if (node.type === 'VariableDeclaration' &&
              isTherrorRegister(node.declarations[0].init)) {
            //var a = therror.register();
            ns = getTherrorDataFromNode(node.declarations[0].init);
            ns.doc = node.jsdoc || null;
            namespaces.push(ns);
          } else if (node.type === 'ExpressionStatement' &&
              isTherrorRegister(node.expression)) {
            //therror.register();
            ns = getTherrorDataFromNode(node.expression);
            ns.doc = node.jsdoc || null;
            namespaces.push(ns);
          }
        }
      });
    } catch (e) {
      return cb(errors.Parse(e, filename));
    }
    cb(null, namespaces);
  });
}

/**
 * Sorts the errors by namespace
 *
 * @param {Array} data the data resulting for parsing all files
 * @return {Array} the sorted namespaces
 */
function sortByNamespace(data) {
  return data.sort(function compare(a, b) {
    if (!b.namespace || a.namespace > b.namespace) {
      return 1;
    } else if (!a.namespace || a.namespace < b.namespace) {
      return -1;
    } else {
      return 0;
    }
  });
}

/**
 * Indexes a namespaces array by namespace
 *
 * @param {Array} data
 * @return {Object} the namespaces indexed
 */
function indexNamespaces(data) {
  return data.reduce(function(memo, item) {
    var targetID = item.namespace || '__GLOBAL',
        target = memo[targetID] || (memo[targetID] = []);

    target.push(item);
    return memo;
  }, {});
}
/**
 * Finds the dup namespaces in an object data
 *
 * @param {Object} data
 * @return {Object} The duplicated namespaces indexed by namespace
 */
function findDuplicatedNamespaces(data) {
  var obj = indexNamespaces(data);

  Object.keys(obj).forEach(function(key) {
    if (obj[key].length <= 1) {
      delete obj[key];
    }
  });
  return obj;
}

/**
 * Merges the error in one namespace
 *
 * @param {Array} arr the array of namespaces to merge
 * @return {Object} a namespace error definition
 */
function mergeNamespaces(arr) {
  var obj = {
        namespace: arr[0].namespace
      },
      intermediateErrors = [],
      intermediateTags = [],
      intermediateDescription = [];

  arr.forEach(function(ns) {
    if (ns.errors) {
      intermediateErrors = intermediateErrors.concat(ns.errors);
    }
    if (ns.doc) {
      if (ns.doc.tags) {
        intermediateTags = intermediateTags.concat(ns.doc.tags);
      }
      if (ns.doc.description) {
        intermediateDescription.push(ns.doc.description);
      }
    }
  });

  if (intermediateErrors.length) {
    obj.errors = intermediateErrors;
  }

  if (intermediateTags.length) {
    obj.doc = {};
    obj.doc.tags = intermediateTags;
  }
  if (intermediateDescription.length) {
    obj.doc = obj.doc || {};
    obj.doc.description = intermediateDescription.join(' ');
  }
  return obj;
}

/**
 * Merges namespaces removing duplicates and sorting the results
 *
 * @param {Array} data
 * @param {Function} cb callback
 */
function merge(data, cb) {
  var res = [],
      ordered = sortByNamespace(data),
      dups = findDuplicatedNamespaces(ordered),
      indexed = indexNamespaces(ordered);

  Object.keys(dups).forEach(function(ns) {
    indexed[ns] = [mergeNamespaces(dups[ns])];
  });

  Object.keys(indexed).forEach(function(ns) {
    res.push(indexed[ns][0]);
  });

  cb(null, res);
}
/**
 * Analyzes the provided files searching for
 * <code>
 *   therror.register('namespace', {
 *    ERROR_ID: {}
 *    });
 * </code>
 * and returns in the callback an Array with all the found errors
 * with their documentation
 *
 * @param {Array.<String>} files
 * @param {Function} cb
 */
var parse = function(files, cb) {
  async.waterfall([
    async.apply(async.concat, files, parseFileForErrors),
    merge
  ], cb);
};

/**
 * The exported API
 * @type {Function}
 */
module.exports = {
  parse: parse,
  _sortByNamespace: sortByNamespace,
  _findDuplicatedNamespaces: findDuplicatedNamespaces,
  _mergeNamespaces: mergeNamespaces
};
