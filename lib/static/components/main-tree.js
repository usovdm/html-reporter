'use strict';

import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {bindActionCreators} from 'redux';

import ErrorGroupsList from './error-groups/list';
import Suites from './suites';
import clientEvents from '../../gui/constants/client-events';
import {openDbConnection, closeDbConnection, suiteBegin, suiteBegin2, testBegin, testBegin2, testResult, testResult2, testsEnd} from '../modules/actions';
import Loading from './loading';

class MainTree extends Component {
    static propTypes = {
        gui: PropTypes.bool,
        groupByError: PropTypes.bool.isRequired
    }

    componentDidMount() {
        this.props.gui && this._subscribeToEvents();

        if (!this.props.gui) {
            this.props.actions.openDbConnection();
        }
    }

    componentWillUnmount() {
        if (!this.props.gui) {
            this.props.actions.closeDbConnection();
        }
    }

    _subscribeToEvents() {
        const {actions} = this.props;
        const eventSource = new EventSource('/events');
        eventSource.addEventListener(clientEvents.BEGIN_SUITE, (e) => {
            const data = JSON.parse(e.data);
            actions.suiteBegin(data);
        });

        eventSource.addEventListener(clientEvents.BEGIN_STATE, (e) => {
            const data = JSON.parse(e.data);
            actions.testBegin(data);
        });

        [clientEvents.TEST_RESULT, clientEvents.ERROR].forEach((eventName) => {
            eventSource.addEventListener(eventName, (e) => {
                const data = JSON.parse(e.data);
                actions.testResult(data);
            });
        });

        [clientEvents.TEST_RESULT_2, clientEvents.ERROR].forEach((eventName) => {
            eventSource.addEventListener(eventName, (e) => {
                const data = JSON.parse(e.data);
                actions.testResult2(data);
            });
        });
        eventSource.addEventListener(clientEvents.BEGIN_SUITE_2, (e) => {
            const data = JSON.parse(e.data);
            actions.suiteBegin2(data);
        });
        eventSource.addEventListener(clientEvents.BEGIN_STATE_2, (e) => {
            const data = JSON.parse(e.data);
            actions.testBegin2(data);
        });

        eventSource.addEventListener(clientEvents.END, () => {
            this.props.actions.testsEnd();
        });
    }

    render() {
        const {groupByError, suites, fetchDbDetails} = this.props;

        if (!Object.keys(suites).length && !fetchDbDetails) {
            return (<Loading active={true}/>);
        }

        return groupByError
            ? <ErrorGroupsList/>
            : <Suites/>;
    }
}

const actions = {testBegin, testBegin2, suiteBegin, suiteBegin2, testResult, testResult2, testsEnd, openDbConnection, closeDbConnection};

export default connect(
    (state) => {
        const {groupByError} = state.view;
        return ({
            gui: state.gui,
            groupByError,
            fetchDbDetails: state.fetchDbDetails,
            suites: state.suites
        });
    },
    (dispatch) => ({actions: bindActionCreators(actions, dispatch)})
)(MainTree);
