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

var therror = require('therror'),
    pkg = require('./../package.json'),
    url = require('url'),
    querystring = require('querystring');

//the Base URL for all the errors in the project, using this app version
var baseURL = url.format([
      pkg.homepage,
      'v' + pkg.version,
      'errors'
    ].join('/') + '/#!/'
);

/**
 * Therror Doc generation errors
 */
module.exports = therror.register('TherrorDoc', {
  /**
   * The specified file cannot be opened
   *
   * therror-doc execution was not able to open the specified file for reading
   *
   * @solution check the path you provided to therror-doc is valid, the file
   * exists and have the appropriate permissions to open it
   *
   */
  CannotRead: {
    message: 'Cannot read file "{2}" for parsing errors: {1}'
  },
  /**
   * Unable to parse file
   *
   * therror-doc uses esprima project to get the error information and documentation
   * directly from your source code. Maybe shipped esprima dependency is not able to
   * understand your code, or we have a bug in our parsing routine
   *
   * @solution Check the specified file for syntax errors, and solve them.
   *
   */
  Parse: {
    message: 'Unable to parse "{2}" while looking for errors: {1}'
  }
}, {
  getURL: function getURL() {
    var qs = querystring.stringify(this._args
            .map(function(arg) {
              return this.stringify(arg);
            }, this)
            .reduce(function(memo, value, index) {
              memo['p' + index] = value;
              return memo;
            }, {})
    );
    return baseURL + this._namespace + '/' + this._type + '?' + qs;
  }
});

