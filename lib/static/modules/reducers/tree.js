import {mergeWith, isArray, uniq} from 'lodash';
import actionNames from '../action-names';
import {isSuiteFailed} from '../utils';

export default (state = {}, action) => {
    switch (action.type) {
        case actionNames.VIEW_INITIAL: {
            const {tree} = action.payload;
            const failedRootIds = getFailedRootSuiteIds(tree.suites);

            return {
                ...state,
                tree: {
                    ...tree,
                    suites: {
                        ...tree.suites,
                        failedRootIds
                    }
                }
            };
        }

        case actionNames.SUITE_BEGIN_2: {
            const {suiteId, status} = action.payload;

            return {
                ...state,
                tree: {
                    ...state.tree,
                    suites: {
                        ...state.tree.suites,
                        byId: {
                            ...state.tree.suites.byId,
                            [suiteId]: {
                                ...state.tree.suites.byId[suiteId],
                                status
                            }
                        }
                    }
                }
            };
        }

        case actionNames.TEST_BEGIN_2: {
            const {suiteId, resultId, status} = action.payload;

            return {
                ...state,
                tree: {
                    ...state.tree,
                    suites: {
                        ...state.tree.suites,
                        byId: {
                            ...state.tree.suites.byId,
                            [suiteId]: {
                                ...state.tree.suites.byId[suiteId],
                                status
                            }
                        }
                    },
                    results: {
                        ...state.tree.results,
                        byId: {
                            ...state.tree.results.byId,
                            [resultId]: {
                                ...state.tree.results.byId[resultId],
                                status
                            }
                        }
                    }
                }
            };
        }

        case actionNames.TEST_RESULT_2: {
            const newStateTree = mergeWith({}, state.tree, action.payload, (objVal, srcVal) => {
                if (isArray(objVal)) {
                    return uniq(objVal.concat(srcVal));
                }
            });

            newStateTree.suites.failedRootIds = getFailedRootSuiteIds(newStateTree.suites);

            return {
                ...state,
                tree: {
                    ...state.tree,
                    ...newStateTree
                }
            };
        }

        default:
            return state;
    }
};

function getFailedRootSuiteIds(suites) {
    return suites.allRootIds.filter((rootId) => {
        return isSuiteFailed(suites.byId[rootId]);
    });
}

// function addTestResult(state, action) {
//     const {
//         config: {errorPatterns},
//         view: {viewMode, filteredBrowsers, testNameFilter, strictMatchFilter}
//     } = state;
//     const suites = clone(state.suites);

//     [].concat(action.payload).forEach((suite) => {
//         const {suitePath, browserResult, browserId} = suite;
//         const test = findNode(suites, suitePath);

//         if (!test) {
//             return;
//         }

//         test.browsers.forEach((b) => {
//             if (b.name === browserId) {
//                 assign(b, browserResult);
//             }
//         });
//         setStatusForBranch(suites, suitePath);
//         forceUpdateSuiteData(suites, test);
//     });

//     const suiteIds = clone(state.suiteIds);
//     assign(suiteIds, {failed: getFailedSuiteIds(suites)});

//     const groupedErrors = groupErrors({suites, viewMode, errorPatterns, filteredBrowsers, testNameFilter, strictMatchFilter});

//     return assign({}, state, {suiteIds, suites, groupedErrors});
// }
