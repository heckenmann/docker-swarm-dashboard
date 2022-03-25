import React, { useEffect, useState } from 'react';
import { ReactInterval } from 'react-interval';
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
//import '../node_modules/bootswatch/darkly/bootstrap.min.css';
//import '../node_modules/@fortawesome/fontawesome/styles.css';

import bg from './docker.png';
import { Container } from 'react-bootstrap';
import { LogsComponent } from './components/LogsComponent';
import { StacksComponent } from './components/StacksComponent';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { DetailsNodeComponent } from './components/DetailsNodeComponent';
import { NodesComponent } from './components/NodesComponent';


library.add(fab, fas, far)

SyntaxHighlighter.registerLanguage('javascript', js);

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [nodes, setNodes] = useState(null);
  const [services, setServices] = useState(null);
  const [tasks, setTasks] = useState(null);

  const baseUrl = "/";

  useEffect(() => {
    loadData();
  }, [])

  const loadData = async () => {
    setIsInitialized(false);
    setNodes((await (await fetch(baseUrl + "docker/nodes")).json()).sort((a, b) => { return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1; }));
    setServices((await (await fetch(baseUrl + "docker/services")).json()).sort((a, b) => { return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1; }));
    setTasks((await (await fetch(baseUrl + "docker/tasks")).json()).sort((a, b) => { return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1; }));
    setIsInitialized(true);
  }

  const toggleRefresh = () => {
    if (refreshInterval) {
      setRefreshInterval(null);
    } else {
      setRefreshInterval(1000);
    }
  }


  return (
    <>
      <ReactInterval enabled={refreshInterval !== null} timeout={refreshInterval} callback={loadData} />
      <HashRouter>
        <div className="App">
          <img alt="background" id="background-image" src={bg} />
          <DashboardNavbar refreshInterval={refreshInterval} forceUpdate={loadData} toggleRefresh={toggleRefresh} />

          <main role='main'>
            <Container fluid className="overflow-auto">
              <Routes>
                <Route exact path='/' element={<DashboardComponent isInitialized={isInitialized} services={services} nodes={nodes} tasks={tasks} />} />
                <Route exact path='/stacks' element={<StacksComponent isInitialized={isInitialized} services={services} />} />
                <Route exact path='/services/*' element={<ServiceRoutes isInitialized={isInitialized} services={services} />} />
                <Route exact path='/tasks' element={<TasksComponent isInitialized={isInitialized} services={services} nodes={nodes} tasks={tasks} />} />
                <Route exact path='/nodes/*' element={<NodeRoutes isInitialized={isInitialized} nodes={nodes} />} />
                <Route exact path='/ports' element={<PortsComponent isInitialized={isInitialized} services={services} />} />
                <Route exact path='/logs' element={<LogsComponent isInitialized={isInitialized} services={services} nodes={nodes} tasks={tasks} />} />
                <Route exact path='/about' element={<AboutComponent />} />
              </Routes>
            </Container>
          </main>
        </div>
      </HashRouter >
    </>
  );
}

function ServiceRoutes(props) {
  return (
    <Routes>
      <Route path=":id" element={<DetailsServiceComponent isInitialized={props.isInitialized} services={props.services} />} />
    </Routes>
  );
}

function NodeRoutes(props) {
  return (
    <Routes>
      <Route path="/" element={<NodesComponent isInitialized={props.isInitialized} nodes={props.nodes} />} />
      <Route path=":id" element={<DetailsNodeComponent isInitialized={props.isInitialized} nodes={props.nodes} />} />
    </Routes>
  );
}

export default App;
