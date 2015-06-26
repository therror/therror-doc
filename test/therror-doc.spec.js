'use strict';

var therrordoc = require('../lib/therror-doc'),
    path = require('path');

describe('Therror Documentation parser', function() {
  var probes = {}, expectations = {};
  before(function() {
    probes.namespace = path.resolve(__dirname, './probes/namespaced.js');
    probes.nonamespace = path.resolve(__dirname, './probes/nonamespaced.js');
    probes.namespacedup = path.resolve(__dirname, './probes/namespaceddup.js');
    probes.multi = path.resolve(__dirname, './probes/multi.js');
    probes.singlecall = path.resolve(__dirname, './probes/singlecall.js');

    expectations.namespace = require('./expectations/namespaced.json');
    expectations.nonamespace = require('./expectations/nonamespaced.json');
    expectations.merged = require('./expectations/merged.json');
  });
  describe('Namespace Parsing', function() {
    it('should be able to parse error registrations with namespaces', function(done) {
      therrordoc.parse([
        probes.namespace
      ], function onParse(err, data) {
        expect(data).to.be.deep.equal(expectations.namespace);
        done(err);
        //done();
      });
    });

    it('should be able to parse error registrations without namespaces', function(done) {
      therrordoc.parse([
        probes.nonamespace
      ], function onParse(err, data) {
        expect(data).to.be.deep.equal(expectations.nonamespace);
        done(err);
      });
    });

    it('should be able to parse several files', function(done) {
      therrordoc.parse([
        probes.namespace,
        probes.nonamespace
      ], function onParse(err, data) {
        expect(data).to.be.deep.equal(
            expectations.nonamespace.concat(
                expectations.namespace
            )
        );
        done(err);
      });
    });

    it('should be able to merge multiple namespaces', function(done) {
      therrordoc.parse([
        probes.namespace,
        probes.namespacedup
      ], function(err, data) {
        expect(data).to.be.deep.equal(expectations.merged);
        done(err);
      });
    });

    it('should be able to identify multiple namespaces in one file', function(done) {
      therrordoc.parse([
        probes.multi
      ], function(err, data) {
        expect(data).to.be.deep.equal(expectations.merged);
        done(err);
      });
    });

    it('should be able to parse error registrations when it\'s only a call', function(done) {
      therrordoc.parse([
        probes.singlecall
      ], function onParse(err, data) {
        expect(data).to.be.deep.equal(expectations.namespace);
        done(err);
      });
    });
  });

  describe('Helper methods', function() {
    it('should sort all the namespaces, putting first the null ones', function() {
      var probe = [
        {namespace: 'A'},
        {namespace: null},
        {namespace: 'C'},
        {namespace: 'B'},
        {namespace: 'Aa'},
        {namespace: null},
        {namespace: 'B'},
        {namespace: 'AA'}
      ];

      expect(therrordoc._sortByNamespace(probe)).to.be.deep.equal([
        {namespace: null},
        {namespace: null},
        {namespace: 'A'},
        {namespace: 'AA'},
        {namespace: 'Aa'},
        {namespace: 'B'},
        {namespace: 'B'},
        {namespace: 'C'}
      ]);
    });

    it('should find the duplicated namespaces', function() {
      var probe = [
        {namespace: 'A'},
        {namespace: null},
        {namespace: 'C'},
        {namespace: 'B'},
        {namespace: 'Aa'},
        {namespace: null},
        {namespace: 'B'},
        {namespace: 'AA'}
      ];

      expect(therrordoc._findDuplicatedNamespaces(probe)).to.be.deep.equal({
        '__GLOBAL': [
          {namespace: null},
          {namespace: null}
        ],
        'B': [
          {namespace: 'B'},
          {namespace: 'B'}
        ]
      });
    });

    it('should merge the errors in namespaces', function() {
      var probe = [
        {
          namespace: 'A',
          errors: [{type: 'ERR'}, {type: 'ERR2'}]
        }, {
          namespace: 'A',
          errors: [{type: 'ERR2'}, {type: 'ERR4'}]
        }
      ];
      expect(therrordoc._mergeNamespaces(probe)).to.be.deep.equal({
        namespace: 'A',
        errors: [
          {type: 'ERR'},
          {type: 'ERR2'},
          {type: 'ERR2'},
          {type: 'ERR4'}
        ]
      });
    });

    it('should merge the documentation in namespaces', function() {
      var probe = [
        {
          namespace: 'A',
          doc: {
            description: 'foo description',
            tags: [{title: 'foo'}]
          }
        }, {
          namespace: 'A',
          doc: {
            description: 'bar description',
            tags: [{title: 'foo'}]
          }
        }, {
          namespace: 'A',
          doc: null
        }
      ];
      expect(therrordoc._mergeNamespaces(probe)).to.be.deep.equal({
        namespace: 'A',
        doc: {
          description: 'foo description bar description',
          tags: [{title: 'foo'}, {title: 'foo'}]
        }
      });
    });
  });
});
