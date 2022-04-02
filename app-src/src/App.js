import React, { Suspense } from 'react';
import './App.css';
import { DashboardNavbar } from './components/DashboardNavbar';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { DashboardComponent } from './components/DashboardComponent';
import { AboutComponent } from './components/AboutComponent';
import { TasksComponent } from './components/TasksComponent';
import { PortsComponent } from './components/PortsComponent';
import { DetailsServiceComponent } from './components/DetailsServiceComponent';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
//import 'bootswatch/dist/cosmo/bootstrap.min.css';
//import '../node_modules/@fortawesome/fontawesome/styles.css';
import { Provider } from 'jotai';

import bg from './docker.png';
import { Container } from 'react-bootstrap';
import { LogsComponent } from './components/LogsComponent';
import { StacksComponent } from './components/StacksComponent';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { DetailsNodeComponent } from './components/DetailsNodeComponent';
import { NodesComponent } from './components/NodesComponent';
import { DashboardVerticalComponent } from './components/DashboardVerticalComponent';
import LoadingComponent from './components/LoadingComponent';

library.add(fab, fas, far)

SyntaxHighlighter.registerLanguage('javascript', js);

const App = () => {
  return (
    <Provider>
      <HashRouter>
        <div className="App">
          <img alt="background" id="background-image" src={bg} />
          <DashboardNavbar />
          <main role='main'>
            <Container fluid className="overflow-auto">
              <Suspense fallback={<LoadingComponent />}>
                <Routes>
                  <Route exact path='/' element={<DashboardComponent />} />
                  <Route exact path='/dashboard/*' element={<DashboardRoutes />} />
                  <Route exact path='/stacks' element={<StacksComponent />} />
                  <Route exact path='/services/*' element={<ServiceRoutes />} />
                  <Route exact path='/tasks' element={<TasksComponent />} />
                  <Route exact path='/nodes/*' element={<NodeRoutes />} />
                  <Route exact path='/ports' element={<PortsComponent />} />
                  <Route exact path='/logs' element={<LogsComponent />} />
                  <Route exact path='/about' element={<AboutComponent />} />
                </Routes>
              </Suspense>
            </Container>
          </main>
        </div>
      </HashRouter >
    </Provider>
  );
}

export default App;

function ServiceRoutes() {
  return (
    <Routes>
      <Route path=":id" element={<DetailsServiceComponent />} />
    </Routes>
  );
}

function NodeRoutes() {
  return (
    <Routes>
      <Route path="/" element={<NodesComponent />} />
      <Route path=":id" element={<DetailsNodeComponent />} />
    </Routes>
  );
}

function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardComponent />} />
      <Route path="/horizontal" element={<DashboardComponent />} />
      <Route path="/vertical" element={<DashboardVerticalComponent />} />
    </Routes>
  );
}