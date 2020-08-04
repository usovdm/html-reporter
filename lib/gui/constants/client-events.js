'use strict';

const commonClientEvents = require('../../constants/client-events');

module.exports = Object.assign(commonClientEvents, {
    BEGIN_SUITE: 'beginSuite',
    BEGIN_STATE: 'beginState',

    TEST_RESULT: 'testResult',

    RETRY: 'retry',
    ERROR: 'err',

    END: 'end',
    // -------------------
    TEST_RESULT_2: 'TEST_RESULT_2',
    BEGIN_SUITE_2: 'BEGIN_SUITE_2',
    BEGIN_STATE_2: 'BEGIN_STATE_2'
});
