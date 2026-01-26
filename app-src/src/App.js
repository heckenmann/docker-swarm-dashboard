import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
//import 'bootswatch/dist/cosmo/bootstrap.min.css';
//import '../node_modules/@fortawesome/fontawesome/styles.css';
// Provider is intentionally omitted here; the app-level Provider with a
// dedicated store is created in `index.js` so components read from that
// single store instance.
import { useAtomValue } from 'jotai'
import { isDarkModeAtom } from './common/store/atoms'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import './App.css'

library.add(fab, fas, far)

SyntaxHighlighter.registerLanguage('javascript', js)

const App = () => {
  const isDarkMode = useAtomValue(isDarkModeAtom)

  return (
    <div className={`App ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <DashboardNavbar />
        </Suspense>
      </ErrorBoundary>
      <main role="main">
        <Container fluid className="overflow-auto">
          <ErrorBoundary>
            <Suspense fallback={<LoadingComponent />}>
              <WelcomeMessageComponent />
              <ContentRouter />
            </Suspense>
          </ErrorBoundary>
        </Container>
      </main>
    </div>
  )
}

export default App
