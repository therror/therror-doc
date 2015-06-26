'use strict';

var therror = require('therror');

/**
 * NS documentation
 *
 * @flag
 * @field Documentation
 */
var a = therror.register('NS', {
  /**
   * ERR description
   *
   * @flag
   * @field Documentation
   */
  ERR: {
    /**
     * The field documentation
     *
     * @flag
     * @field Documentation
     */
    key1: 'value1',
    key2: 'value2'
  },
  ERR2: {
    key2: 'value2'
  }
}, {
  method: function method() {
  },
  field: 'field'
});


/**
 * NS documentation2
 *
 * @flag2
 * @field Documentation2
 */
var b = therror.register('NS', {
  /**
   * ERR description
   *
   * @flag
   * @field Documentation
   */
  ERR: {
    /**
     * The field documentation
     *
     * @flag
     * @field Documentation
     */
    key1: 'value1',
    key2: 'value2'
  },
  ERR3: {
    key3: 'value3'
  }
});
