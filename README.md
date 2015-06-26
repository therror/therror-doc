# therror-doc

Documentation parser for [therror](https://github.com/therror/therror)

[![npm version](https://badge.fury.io/js/therror-doc.svg)](http://badge.fury.io/js/therror-doc)
[![Build Status](https://travis-ci.org/therror/therror-doc.svg)](https://travis-ci.org/therror/therror-doc)
[![Coverage Status](https://coveralls.io/repos/therror/therror-doc/badge.svg?branch=master)](https://coveralls.io/r/therror/therror-doc?branch=master)


Creates a javascript object with all the documentation present in therror errors registrations. Once you have this, you will have the possibility to:
* Filter the errors based on your custom criterias, to make versions for developers, delivery teams, operation teams.
* Create Web pages with rich errors description
* Create Markdown files
* Anything you can imagine!


## Installation 
```bash
 npm install --save-dev therror-doc
```

You can also save globally and use the cli to generate docs
```bash
 npm install -g therror-doc
 therror-doc lib/*.js > errors.json
```


## Examples

### CLI
```bash
$ therror-doc --help

  Usage: therror-doc <file ...> [options]

  Generate a json with the errors documentation for the provided files

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

  Examples:

  Get and generate error doc from js files in lib directory, output to stdout
    $ therror-doc lib/*.js
  Get and generate error doc from all node_module dependencies, output to file (bash)
    $ therror-doc $(find node_modules -name *.js) > errors.json
```

Exit Codes:
 * `0`: All went fine
 * `1`: Something failed. Check your `stderr` for details.

### API
Give your file paths to the parser, and it will produce an static js object ready for JSONification

```js
var therrorDoc = require('therror-doc');

therrorDoc.parse([
    './server-errors.js',
    './client-errors.js'
  ], function onParse(err, data) {
    console.log(JSON.stringify(data, null, 2));
  }
);
```

## Current limitations

At this time, the parser only understands error registrations using _exactly_ an asignation of a `therror.register(...)` call. 
```js
var something = therror.register('NAMESPACE', {...});
module.exports = therror.register({...});
therror.register({...});
```

Knowing which variable holds the therror module on a file should not be difficult enought 
(as the parser is using an [esprima AST](http://esprima.org/))


## LICENSE

Copyright 2014,2015 [Telefónica I+D](http://www.tid.es)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.