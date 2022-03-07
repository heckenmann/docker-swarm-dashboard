import React, { Component, useDebugValue } from 'react';
import { ReactInterval } from 'react-interval';
import './App.css';
import { DashboardNavbar } from './components/DashboardNavbar';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ServicesComponent } from './components/ServicesComponent';
import { AboutComponent } from './components/AboutComponent';
import { TasksComponent } from './components/TasksComponent';
import { PortsComponent } from './components/PortsComponent';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
//import '../node_modules/bootswatch/darkly/bootstrap.min.css';
//import '../node_modules/@fortawesome/fontawesome/styles.css';

import bg from './docker.png';
import { Container } from 'react-bootstrap';
import { LogsComponent } from './components/LogsComponent';
import { StacksComponent } from './components/StacksComponent';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';

library.add(fab, fas, far)

SyntaxHighlighter.registerLanguage('javascript', js);

class App extends Component {

  state = {
    time: new Date(),
    initialized: false,
    refreshInterval: null,
    nodes: [],
    services: [],
    tasks: []
  }

  setState = (state) => {
    state.time = new Date();
    super.setState(state);
  }

  componentDidMount() {
    this.loadData();
  }

  update = () => {
    this.loadData();
  }

  async loadData() {
    let localState = this.state;
    localState.nodes = (await (await fetch   ("/docker/nodes")).json()).sort((a, b) => { return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1; });
    localState.services = (await (await fetch("/docker/services")).json()).sort((a, b) => { return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1; });
    localState.tasks = (await (await fetch   ("/docker/tasks")).json()).sort((a, b) => { return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1; });
    localState.initialized = true;
    this.setState(localState);
  }

  toggleRefresh = () => {
    let localState = this.state;
    if (localState.refreshInterval) {
      localState.refreshInterval = null;
    } else {
      localState.refreshInterval = 1000;
    }
    this.setState(localState);
  }

  render() {
    return (
      <HashRouter>
        <div className="App">
          <ReactInterval enabled={this.state.refreshInterval !== null} timeout={this.state.refreshInterval} callback={this.update} />
          <img alt="background" id="background-image" src={bg} />
          <DashboardNavbar state={this.state} forceUpdate={this.update} toggleRefresh={this.toggleRefresh} />

          <main role='main'>
            <Container fluid className="overflow-auto">
              <Routes>
                <Route exact path='/stacks'   element={<StacksComponent state={this.state} />} />
                <Route exact path='/services' element={<ServicesComponent state={this.state} />} />
                <Route exact path='/'         element={<ServicesComponent state={this.state} />} />
                <Route exact path='/tasks'    element={<TasksComponent state={this.state} />} />
                <Route exact path='/ports'    element={<PortsComponent state={this.state} />} />
                <Route exact path='/logs'     element={<LogsComponent state={this.state} />} />
                <Route exact path='/about'    element={<AboutComponent />} />
              </Routes>
            </Container>
          </main>
        </div>
      </HashRouter>
    );
  }
}

export default App;
