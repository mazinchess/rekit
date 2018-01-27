import React, { Component } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon } from 'antd';
import classnames from 'classnames';
import history from '../../common/history';
import { closeTab } from './redux/actions';
import editorStateMap from './editorStateMap';

export class TabsBar extends Component {
  static propTypes = {
    home: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
  };

  getCurrentFile() {
    // only for element page
    const { pathname } = this.props.router.location;
    const arr = _.compact(pathname.split('/')).map(decodeURIComponent);
    if (arr[0] === 'element') return arr[1];
    return null;
  }

  getElementData(file) {
    const { elementById, projectRoot } = this.props.home;
    if (!file) return null;
    file = decodeURIComponent(file);
    const fullPath = projectRoot + file;
    const arr = fullPath.split('.');
    const ext = arr.length > 1 ? arr.pop() : null;
    const ele = elementById[file];

    if (!ele) return null;

    return {
      ...ele,
      hasDiagram: /^(js|jsx)$/.test(ext),
      hasTest: ele.feature && /^(js|jsx)$/.test(ext),
      hasCode: /^(js|jsx|html|css|less|scss|txt|json|sass|md|log|pl|py|sh|cmd)$/.test(ext),
      isPic: /^(jpe?g|png|gif|bmp)$/.test(ext),
    };
  }

  isCurrentTab(tab) {
    const { pathname } = document.location;
    switch (tab.type) {
      case 'home':
        return pathname === '/';
      case 'element':
        return tab.key === this.getCurrentFile();
      case 'routes':
        return pathname.indexOf(`/${tab.key}`) === 0;
      case 'tests':
        return _.startsWith(pathname, '/tools/tests');
      default:
        return false;
    }
  }

  handleTabClick = (key) => {
    const tab = _.find(this.props.home.openTabs, { key });
    let path;
    switch (tab.type) {
      case 'home':
        path = '/';
        break;
      case 'element':
        path = `/element/${encodeURIComponent(key)}/${tab.subTab}`;
        break;
      case 'routes':
        path = `/${tab.key}/${tab.subTab || ''}`;
        break;
      case 'tests':
        path = tab.pathname;
        break;
      default:
        console.error('unknown tab type: ', tab);
        break;
    }
    if (document.location.pathname !== path) {
      // this.props.actions.openTab(tab.file, tab.tab);
      history.push(path);
    }
  }

  handleClose = (evt, tab) => {
    evt.stopPropagation();
    this.props.actions.closeTab(tab.key);
    const { openTabs, historyTabs, cssExt } = this.props.home;
    const ele = this.getElementData(tab.key);
    if (ele) {
      const codeFile = ele.file;
      const styleFile = `src/features/${ele.feature}/${ele.name}.${cssExt}`;
      const testFile = `tests/${ele.file.replace(/^src\//, '').replace('.js', '')}.test.js`;

      delete editorStateMap[codeFile];
      delete editorStateMap[styleFile];
      delete editorStateMap[testFile];
    }

    if (historyTabs.length === 1) {
      history.push('/blank');
    } else if (this.isCurrentTab(tab)) {
      // Close the current one
      const nextKey = historyTabs[1]; // at this point the props has not been updated.
      const nextTab = _.find(openTabs, { key: nextKey });
      let path = '';
      switch (nextTab.type) {
        case 'home':
          path = '/';
          break;
        case 'element':
          path = `/element/${encodeURIComponent(nextTab.key)}/${nextTab.subTab}`;
          break;
        default:
          break;
      }
      history.push(path);
    }
  }

  render() {
    const { openTabs } = this.props.home;
    return (
      <div className="home-tabs-bar">
        {openTabs.map(tab => (
          <span
            key={tab.key}
            onClick={() => this.handleTabClick(tab.key)}
            className={classnames('tab', { 'tab-active': this.isCurrentTab(tab) })}
          >
            <Icon type={tab.icon || 'file'} />
            <label title={`${tab.feature}/${tab.name}`}>{tab.name}</label>
            <Icon type="close" onClick={(evt) => this.handleClose(evt, tab)} />
          </span>
        ))}       
      </div>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state) {
  return {
    home: state.home,
    router: state.router,
  };
}

/* istanbul ignore next */
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ closeTab }, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TabsBar);
