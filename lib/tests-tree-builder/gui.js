'use strict';

const BaseTestsTreeBuilder = require('./base');

module.exports = class GuiTestsTreeBuilder extends BaseTestsTreeBuilder {
    getTestBranch(id) {
        const getSuites = (suite) => {
            if (suite.root) {
                return {[suite.id]: {status: suite.status}};
            }

            return {
                ...getSuites(this._tree.suites.byId[suite.parentId]),
                ...{[suite.id]: {status: suite.status}}
            };
        };

        const result = this._tree.results.byId[id];
        const results = {byId: {[result.id]: result}, allIds: [result.id]};
        const images = result.images.reduce((acc, imgId) => {
            acc.byId[imgId] = this._tree.images.byId[imgId];
            acc.allIds.push(imgId);

            return acc;
        }, {byId: {}, allIds: []});
        const browser = this._tree.browsers.byId[result.parentId];
        const browsers = {
            byId: {[result.parentId]: {results: [result.id]}}
        };

        const suites = {
            byId: getSuites(this._tree.suites.byId[browser.parentId])
        };

        return {suites, browsers, results, images};
    }

    reuseTestsTree(testsTree) {
        this._tree.browsers.allIds.forEach((browserId) => this._reuseBrowser(testsTree, browserId));
    }

    _reuseBrowser(testsTree, browserId) {
        const reuseBrowser = testsTree.browsers.byId[browserId];

        if (!reuseBrowser) {
            return;
        }

        this._tree.browsers.byId[browserId] = reuseBrowser;

        reuseBrowser.results.forEach((resultId) => this._reuseResults(testsTree, resultId));
        this._reuseSuiteStatus(testsTree, this._tree.browsers.byId[browserId].parentId);
    }

    _reuseResults(testsTree, resultId) {
        const reuseResult = testsTree.results.byId[resultId];

        if (!this._tree.results.byId[resultId]) {
            this._tree.results.allIds.push(resultId);
        }

        this._tree.results.byId[resultId] = reuseResult;

        reuseResult.images.forEach((imageId) => this._reuseImages(testsTree, imageId));
    }

    _reuseImages(testsTree, imageId) {
        const reuseImage = testsTree.images.byId[imageId];

        if (!this._tree.images.byId[imageId]) {
            this._tree.images.allIds.push(imageId);
        }

        this._tree.images.byId[imageId] = reuseImage;
    }

    _reuseSuiteStatus(testsTree, suiteId) {
        if (!suiteId) {
            return;
        }

        const suite = this._tree.suites.byId[suiteId];
        suite.status = testsTree.suites.byId[suiteId].status;

        this._reuseSuiteStatus(testsTree, suite.parentId);
    }
};
