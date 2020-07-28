'use strict';

const _ = require('lodash');
const {determineStatus} = require('../common-utils');

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

    sortTree() {
        const sortChildSuites = (suiteId) => {
            const childSuite = this._tree.suites.byId[suiteId];

            if (childSuite.suites) {
                childSuite.suites.sort().forEach(sortChildSuites);
            }

            if (childSuite.browsers) {
                childSuite.browsers.sort();
            }
        };

        this._tree.suites.allRootIds.sort().forEach(sortChildSuites);
    }

    getLastResult(formattedResult) {
        const {testPath, browserId: browserName} = formattedResult;
        const suiteId = this._buildId(testPath);
        const browserId = this._buildId(suiteId, browserName);
        const browser = this._tree.browsers.byId[browserId];

        const testResultId = browser.results[browser.results.length - 1];

        return this._tree.results.byId[testResultId];
    }

    getImagesInfo(formattedResult) {
        const {testPath, browserId: browserName, attempt} = formattedResult;
        const suiteId = this._buildId(testPath);
        const browserId = this._buildId(suiteId, browserName);
        const testResultId = this._buildId(browserId, attempt);

        return this._tree.results.byId[testResultId].images.map((imageId) => {
            const imageInfo = this._tree.images.byId[imageId];
            return imageInfo;
        });
    }

    addTestResult(testResult, formattedResult) {
        const {testPath, browserId: browserName, attempt} = formattedResult;
        const {imagesInfo} = testResult;

        const suiteId = this._buildId(testPath);
        const browserId = this._buildId(suiteId, browserName);
        const testResultId = this._buildId(browserId, attempt);
        const imageIds = imagesInfo.filter((image) => image.stateName).map((image) => this._buildId(testResultId, image.stateName));

        this._addSuites(testPath, browserId);
        this._addBrowser({id: browserId, parentId: suiteId, name: browserName}, testResultId, attempt);
        this._addResult({id: testResultId, parentId: browserId, result: testResult}, imageIds);
        this._addImages(imageIds, {imagesInfo, parentId: testResultId});

        this._setStatusForBranch(testPath);
    }

    _buildId(parentId = [], name = []) {
        return [].concat(parentId, name).join(' ');
    }

    _addSuites(testPath, browserId) {
        testPath.reduce((suites, name, ind, arr) => {
            const suitePath = ind === 0 ? [name] : arr.slice(0, ind + 1);
            const id = this._buildId(suitePath);

            if (!suites.byId[id]) {
                const root = ind === 0;
                const parentId = root ? null : this._buildId(suitePath.slice(0, -1));
                const suite = {id, parentId, name, root, suitePath};

                this._addSuite(suite);
            }

            if (ind !== arr.length - 1) {
                const childSuiteId = this._buildId(id, arr[ind + 1]);
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

    _addBrowser({id, parentId, name}, testResultId, attempt) {
        const {browsers} = this._tree;

        if (!browsers.byId[id]) {
            browsers.byId[id] = {id, parentId, name, results: []};
            browsers.allIds.push(id);
        }

        this._addResultIdToBrowser(id, testResultId, attempt);
    }

    _addResultIdToBrowser(browserId, testResultId, attempt) {
        this._tree.browsers.byId[browserId].results[attempt] = testResultId;
    }

    _addResult({id, parentId, result}, imageIds) {
        const resultWithoutImagesInfo = _.omit(result, 'imagesInfo');

        if (!this._tree.results.byId[id]) {
            this._tree.results.allIds.push(id);
        }

        this._tree.results.byId[id] = {id, parentId, ...resultWithoutImagesInfo, images: imageIds};
    }

    _addImages(imageIds, {imagesInfo, parentId}) {
        imageIds.forEach((id, ind) => {
            this._tree.images.byId[id] = {id, parentId, ...imagesInfo[ind]};
            this._tree.images.allIds.push(id);
        });
    }

    _setStatusForBranch(testPath = []) {
        const suiteId = this._buildId(testPath);

        if (!suiteId) {
            return;
        }

        const suite = this._tree.suites.byId[suiteId];

        const resultStatuses = suite.browsers
            ? suite.browsers.map((browserId) => {
                const browser = this._tree.browsers.byId[browserId];
                const lastResultId = browser.results[browser.results.length - 1];

                return this._tree.results.byId[lastResultId].status;
            })
            : [];

        const childSuiteStatuses = suite.suites
            ? suite.suites.map((childSuiteId) => {
                return this._tree.suites.byId[childSuiteId].status;
            })
            : [];

        const status = determineStatus([...resultStatuses, ...childSuiteStatuses]);

        // if newly determined status is the same as current status, do nothing
        if (suite.status === status) {
            return;
        }

        suite.status = status;
        this._setStatusForBranch(testPath.slice(0, -1));
    }

    convertToOldFormat() {
        const tree = {children: []};
        const {suites} = this._tree;

        suites.allRootIds.forEach((rootSuiteId) => {
            const suite = this._convertSuiteToOldFormat(_.clone(suites.byId[rootSuiteId]));
            tree.children.push(suite);
        });

        return {suites: tree.children};
    }

    _convertSuiteToOldFormat(suite) {
        if (suite.suites) {
            suite.children = suite.suites.map((childSuiteId) => {
                const childSuite = _.clone(this._tree.suites.byId[childSuiteId]);
                const result = this._convertSuiteToOldFormat(childSuite);

                return result;
            });
        }

        if (suite.browsers) {
            suite.browsers = suite.browsers.map((browserId) => {
                const browser = _.clone(this._tree.browsers.byId[browserId]);
                return this._convertBrowserToOldFormat(browser);
            });
        }

        delete suite.suites;
        delete suite.id;
        delete suite.parentId;
        delete suite.root;

        return suite;
    }

    _convertBrowserToOldFormat(browser) {
        browser.retries = browser.results.slice(0, -1).map((resultId) => {
            const result = _.clone(this._tree.results.byId[resultId]);
            return this._conviertImagesToOldFormat(result);
        });

        const resultId = browser.results[browser.results.length - 1];
        browser.result = _.clone(this._tree.results.byId[resultId]);
        this._conviertImagesToOldFormat(browser.result);

        delete browser.results;
        delete browser.id;
        delete browser.parentId;

        return browser;
    }

    _conviertImagesToOldFormat(result) {
        result.imagesInfo = result.images.map((imageId) => {
            const image = _.clone(this._tree.images.byId[imageId]);

            delete image.id;
            delete image.parentId;

            return image;
        });

        delete result.images;
        delete result.id;
        delete result.parentId;

        return result;
    }
};
