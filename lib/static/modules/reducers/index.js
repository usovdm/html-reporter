'use strict';

import {isEmpty} from 'lodash';
import reduceReducers from 'reduce-reducers';
import notificationsReducer from './notifications';
import reporter, {getInitialState} from './reporter';
import tree from './tree';
import defaultState from '../default-state';

const compiledData = window.data || defaultState;

export default reduceReducers(
    (state) => isEmpty(state) ? getInitialState(defaultState, compiledData) : state,
    notificationsReducer,
    tree,
    reporter
);
