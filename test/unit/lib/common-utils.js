'use strict';

const sinon = require('sinon');
const {determineStatus} = require('lib/common-utils');
const {RUNNING, QUEUED, ERROR, FAIL, UPDATED, SUCCESS, IDLE, SKIPPED} = require('lib/constants/test-statuses');

describe('common-utils', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('determineStatus', () => {
        it(`should not rewrite suite status to ${IDLE} if some test already has final status`, () => {
            const status = determineStatus([SUCCESS, IDLE]);

            assert.equal(status, SUCCESS);
        });

        it(`should return "${SUCCESS}" if statuses is not passed`, () => {
            const status = determineStatus([]);

            assert.equal(status, SUCCESS);
        });

        describe('return the highest priority status from passed', () => {
            it(`should return ${RUNNING}`, () => {
                const status = determineStatus([SKIPPED, IDLE, SUCCESS, UPDATED, FAIL, ERROR, QUEUED, RUNNING]);

                assert.equal(status, RUNNING);
            });

            it(`should return ${QUEUED}`, () => {
                const status = determineStatus([SKIPPED, IDLE, SUCCESS, UPDATED, FAIL, ERROR, QUEUED]);

                assert.equal(status, QUEUED);
            });

            it(`should return ${ERROR}`, () => {
                const status = determineStatus([SKIPPED, IDLE, SUCCESS, UPDATED, FAIL, ERROR]);

                assert.equal(status, ERROR);
            });

            it(`should return ${FAIL}`, () => {
                const status = determineStatus([SKIPPED, IDLE, SUCCESS, UPDATED, FAIL]);

                assert.equal(status, FAIL);
            });

            it(`should return ${UPDATED}`, () => {
                const status = determineStatus([SKIPPED, IDLE, SUCCESS, UPDATED]);

                assert.equal(status, UPDATED);
            });

            it(`should return ${SUCCESS}`, () => {
                const status = determineStatus([SKIPPED, IDLE, SUCCESS]);

                assert.equal(status, SUCCESS);
            });

            it(`should return ${IDLE}`, () => {
                const status = determineStatus([SKIPPED, IDLE]);

                assert.equal(status, IDLE);
            });

            it(`should return ${SKIPPED}`, () => {
                const status = determineStatus([SKIPPED]);

                assert.equal(status, SKIPPED);
            });
        });
    });
});
