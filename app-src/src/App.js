import React, { Component } from 'react';
import './App.css';
import { DashboardNavbar } from './components/DashboardNavbar';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { ServicesComponent } from './components/ServicesComponent';
import { AboutComponent } from './components/AboutComponent';
import { TasksComponent } from './components/TasksComponent';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
//import '../node_modules/bootswatch/darkly/bootstrap.min.css';
// import '../node_modules/@fortawesome/fontawesome/styles.css';

import bg from './docker.png';

class App extends Component {

  state = {
    time: new Date(),
    initialized: false,
    nodes: [],
    services: [],
    tasks: []
  }

  componentDidMount() {
    this.loadData();
  }

  update = () => {
    this.loadData();
  }

  async loadData() {
    let localState = this.state;
    localState.nodes = (await (await fetch("/docker/nodes")).json()).sort((a, b) => { return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1; });
    localState.services = (await (await fetch("/docker/services")).json()).sort((a, b) => { return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1; });
    localState.tasks = (await (await fetch("/docker/tasks")).json()).sort((a, b) => { return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1; });
    localState.initialized = true;
    this.setState(localState);
  }



  render() {
    return (
      <HashRouter>
        <div className="App">
          <img alt="background" id="background-image" src={bg} />
          <DashboardNavbar forceUpdate={this.update} />
          <Switch>
            <Route exact path='/' component={() => (<ServicesComponent state={this.state} />)} />
            <Route exact path='/services' component={() => (<ServicesComponent state={this.state} />)} />
            <Route exact path='/tasks' component={() => (<TasksComponent state={this.state} />)} />
            <Route exact path='/about' component={AboutComponent} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

export default App;
