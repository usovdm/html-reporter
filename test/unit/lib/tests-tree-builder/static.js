'use strict';

const _ = require('lodash');
const StaticResultsTreeBuilder = require('lib/tests-tree-builder/static');
const {SUCCESS} = require('lib/constants/test-statuses');

describe('StaticResultsTreeBuilder', () => {
    const sandbox = sinon.sandbox.create();
    let builder;

    const mkDataFromDb_ = (data) => {
        return _.defaults(data, {
            suitePath: ['default-parent-suite', 'default-child-suite'],
            suiteName: 'default-child-suite',
            name: 'default-browser',
            suiteUrl: 'default-url',
            metaInfo: {},
            description: 'default-descr',
            error: null,
            skipReason: '',
            imagesInfo: [],
            screenshot: true,
            multipleTabs: true,
            status: SUCCESS,
            timestamp: 100500
        });
    };

    const mkDataRowFromDb_ = (result = mkDataFromDb_()) => {
        return [
            JSON.stringify(result.suitePath),
            result.suiteName,
            result.name,
            result.suiteUrl,
            JSON.stringify(result.metaInfo),
            result.description,
            JSON.stringify(result.error),
            result.skipReason,
            JSON.stringify(result.imagesInfo),
            Number(result.screenshot),
            Number(result.multipleTabs),
            result.status,
            result.timestamp
        ];
    };

    const formatToTestResult = (result, data = {}) => {
        return {
            description: result.description,
            imagesInfo: result.imagesInfo,
            metaInfo: result.metaInfo,
            multipleTabs: result.multipleTabs,
            name: result.name,
            screenshot: result.screenshot,
            status: result.status,
            suiteUrl: result.suiteUrl,
            skipReason: result.skipReason,
            error: result.error,
            ...data
        };
    };

    beforeEach(() => {
        sandbox.stub(StaticResultsTreeBuilder.prototype, 'addTestResult');
        sandbox.stub(StaticResultsTreeBuilder.prototype, 'sortTree');
        sandbox.stub(StaticResultsTreeBuilder.prototype, 'convertToOldFormat').returns({});

        builder = StaticResultsTreeBuilder.create();
    });

    afterEach(() => sandbox.restore());

    describe('"build" method', () => {
        it('should add test result for each passed row', () => {
            const dataFromDb1 = mkDataFromDb_({suitePath: ['s1'], name: 'yabro'});
            const dataFromDb2 = mkDataFromDb_({suitePath: ['s2'], name: 'yabro'});
            const rows = [mkDataRowFromDb_(dataFromDb1), mkDataRowFromDb_(dataFromDb2)];

            builder.build(rows);

            assert.calledWith(
                StaticResultsTreeBuilder.prototype.addTestResult.firstCall,
                formatToTestResult(dataFromDb1, {attempt: 0}),
                {browserId: 'yabro', testPath: ['s1'], attempt: 0}
            );
            assert.calledWith(
                StaticResultsTreeBuilder.prototype.addTestResult.secondCall,
                formatToTestResult(dataFromDb2, {attempt: 0}),
                {browserId: 'yabro', testPath: ['s2'], attempt: 0}
            );
        });

        it('should add result for the same test with increase attempt', () => {
            const dataFromDb1 = mkDataFromDb_({suitePath: ['s1'], name: 'yabro', timestamp: 10});
            const dataFromDb2 = mkDataFromDb_({suitePath: ['s1'], name: 'yabro', timestamp: 20});
            const rows = [mkDataRowFromDb_(dataFromDb1), mkDataRowFromDb_(dataFromDb2)];

            builder.build(rows);

            assert.calledWith(
                StaticResultsTreeBuilder.prototype.addTestResult.firstCall,
                formatToTestResult(dataFromDb1, {attempt: 0}),
                {browserId: 'yabro', testPath: ['s1'], attempt: 0}
            );
            assert.calledWith(
                StaticResultsTreeBuilder.prototype.addTestResult.secondCall,
                formatToTestResult(dataFromDb1, {attempt: 1}),
                {browserId: 'yabro', testPath: ['s1'], attempt: 1}
            );
        });

        it('should sort tree after add test results', () => {
            const rows = [mkDataRowFromDb_()];

            builder.build(rows);

            assert.callOrder(
                StaticResultsTreeBuilder.prototype.addTestResult,
                StaticResultsTreeBuilder.prototype.sortTree
            );
        });

        it('should convert tree to old format by default', () => {
            const rows = [mkDataRowFromDb_()];

            builder.build(rows);

            assert.calledOnceWith(StaticResultsTreeBuilder.prototype.convertToOldFormat);
        });

        it('should not convert tree to old format if passed option with "false" value', () => {
            const rows = [mkDataRowFromDb_()];

            builder.build(rows, {convertToOldFormat: false});

            assert.notCalled(StaticResultsTreeBuilder.prototype.convertToOldFormat);
        });
    });
});
