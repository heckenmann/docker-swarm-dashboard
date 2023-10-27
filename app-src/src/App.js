import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
//import 'bootswatch/dist/cosmo/bootstrap.min.css';
//import '../node_modules/@fortawesome/fontawesome/styles.css';
import { Provider } from 'jotai'
import React, { Suspense } from 'react'
import { Container } from 'react-bootstrap'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import './App.css'
import { ContentRouter } from './components/ContentRouter'
import { DashboardNavbar } from './components/DashboardNavbar'
import LoadingComponent from './components/LoadingComponent'
import { ErrorBoundary } from './common/ErrorBoundary'
import bg from './files/docker.png'

library.add(fab, fas, far)

SyntaxHighlighter.registerLanguage('javascript', js)

const App = () => {
  return (
    <Provider>
      <div className="App">
        <img alt="background" id="background-image" src={bg} />
        <DashboardNavbar />
        <main role="main">
          <Container fluid className="overflow-auto">
            <ErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <ContentRouter />
              </Suspense>
            </ErrorBoundary>
          </Container>
        </main>
      </div>
    </Provider>
  )
}

export default App
