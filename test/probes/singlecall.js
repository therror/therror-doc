'use strict';

var therror = require('therror');

/**
 * NS documentation
 *
 * @flag
 * @field Documentation
 */
therror.register('NS', {
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

function someOther(){
}

var plo = 'plo';

someOther(plo);

