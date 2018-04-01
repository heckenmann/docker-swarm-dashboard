import React, { Component } from 'react';
import './App.css';
import { DashboardNavbar } from './components/DashboardNavbar';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { ServicesComponent } from './components/ServicesComponent';
import { AboutComponent } from './components/AboutComponent';
import { TasksComponent } from './components/TasksComponent';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
//import '../node_modules/bootswatch/darkly/bootstrap.min.css';
import '../node_modules/font-awesome/css/font-awesome.css';

import bg from './docker.png';
import { Button } from 'react-bootstrap';

class App extends Component {
  render() {
    return (
      <HashRouter>
        <div className="App">
          <img alt="background" id="background-image" src={bg} />
          <DashboardNavbar />
          <Switch>
            <Route exact path='/' component={ServicesComponent} />
            <Route exact path='/services' component={ServicesComponent} />
            <Route exact path='/tasks' component={TasksComponent} />
            <Route exact path='/about' component={AboutComponent} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

export default App;
