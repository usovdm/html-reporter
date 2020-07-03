'use strict';

const _ = require('lodash');

module.exports = class ResultsTreeBuilder {
    static create() {
        return new this();
    }

    constructor() {
        this._tree = {
            suites: {byId: {}, allIds: [], allRootIds: []},
            browsers: {byId: {}, allIds: []},
            results: {byId: {}, allIds: []},
            images: {byId: {}, allIds: []}
        };
    }

    get tree() {
        return this._tree;
    }

    toOldFormat() {
        const tree = {children: []};
        const {suites} = this._tree;

        suites.allRootIds.forEach((rootSuiteId) => {
            const suite = this._prepareSuite(_.clone(suites.byId[rootSuiteId]));
            tree.children.push(suite);
        });

        return tree.children;
    }

    _prepareSuite(suite) {
        if (suite.suites) {
            suite.children = suite.suites.map((childSuiteId) => {
                const childSuite = _.clone(this._tree.suites.byId[childSuiteId]);
                const result = this._prepareSuite(childSuite);

                return result;
            });
        }

        if (suite.browsers) {
            suite.browsers = suite.browsers.map((browserId) => {
                const browser = _.clone(this._tree.browsers.byId[browserId]);
                return this._prepareBrowser(browser);
            });
        }

        delete suite.suites;
        delete suite.id;
        delete suite.root;

        return suite;
    }

    _prepareBrowser(browser) {
        browser.retries = browser.results.slice(0, -1).map((resultId) => {
            const result = _.clone(this._tree.results.byId[resultId]);
            return this._prepareImages(result);
        });

        const resultId = browser.results[browser.results.length - 1];
        browser.result = _.clone(this._tree.results.byId[resultId]);
        this._prepareImages(browser.result);

        delete browser.results;
        delete browser.id;

        return browser;
    }

    _prepareImages(result) {
        result.imagesInfo = result.images.map((imageId) => {
            const image = _.clone(this._tree.images.byId[imageId]);
            delete image.id;

            return image;
        });

        delete result.images;
        delete result.id;

        return result;
    }

    addTestResult(testResult, formattedResult) {
        const {testPath, browserId: browserName, attempt} = formattedResult;
        const {imagesInfo} = testResult;

        const suiteId = testPath.join(' ');
        const browserId = `${suiteId} ${browserName}`;
        const testResultId = `${browserId} ${attempt}`;
        const imageIds = imagesInfo.map((image) => `${testResultId} ${image.stateName}`);

        this._addSuites(testPath, browserId);
        this._addBrowser({id: browserId, name: browserName}, testResultId, attempt);
        this._addResult({id: testResultId, result: testResult}, imageIds);
        this._addImages(imageIds, imagesInfo);
    }

    _addSuites(testPath = [], browserId) {
        testPath.reduce((suites, name, ind, arr) => {
            const suitePath = ind === 0 ? [name] : arr.slice(0, ind + 1);
            const id = suitePath.join(' ');

            if (!suites.byId[id]) {
                const suite = {id, name, root: ind === 0, suitePath};
                this._addSuite(suite);
            }

            if (ind !== arr.length - 1) {
                const childSuiteId = `${id} ${arr[ind + 1]}`;
                this._addChildSuiteId(id, childSuiteId);
            } else {
                this._addBrowserId(id, browserId);
            }

            return suites;
        }, this._tree.suites);
    }

    _addSuite(suite) {
        const {suites} = this._tree;

        suites.byId[suite.id] = suite;
        suites.allIds.push(suite.id);

        if (suite.root) {
            suites.allRootIds.push(suite.id);
        }
    }

    _addChildSuiteId(parentSuiteId, childSuiteId) {
        const {suites} = this._tree;

        if (!suites.byId[parentSuiteId].suites) {
            suites.byId[parentSuiteId].suites = [childSuiteId];
            return;
        }

        if (!this._isChildSuiteIdExists(parentSuiteId, childSuiteId)) {
            suites.byId[parentSuiteId].suites.push(childSuiteId);
        }
    }

    _isChildSuiteIdExists(parentSuiteId, childSuiteId) {
        return _.includes(this._tree.suites.byId[parentSuiteId].suites, childSuiteId);
    }

    _addBrowserId(parentSuiteId, browserId) {
        const {suites} = this._tree;

        if (!suites.byId[parentSuiteId].browsers) {
            suites.byId[parentSuiteId].browsers = [browserId];
            return;
        }

        if (!this._isBrowserIdExists(parentSuiteId, browserId)) {
            suites.byId[parentSuiteId].browsers.push(browserId);
        }
    }

    _isBrowserIdExists(parentSuiteId, browserId) {
        return _.includes(this._tree.suites.byId[parentSuiteId].browsers, browserId);
    }

    _addBrowser({id, name}, testResultId, attempt) {
        const {browsers} = this._tree;

        if (!browsers.byId[id]) {
            browsers.byId[id] = {id, name, results: []};
            browsers.allIds.push(id);
        }

        browsers.byId[id].results[attempt] = testResultId;
    }

    _addResult({id, result}, imageIds) {
        const resultWithoutImagesInfo = _.omit(result, 'imagesInfo');

        this._tree.results.byId[id] = {id, ...resultWithoutImagesInfo, images: imageIds};
        this._tree.results.allIds.push(id);
    }

    _addImages(imageIds, imagesInfo) {
        imageIds.forEach((id, ind) => {
            this._tree.images.byId[id] = {id, ...imagesInfo[ind]};
            this._tree.images.allIds.push(id);
        });
    }
};
