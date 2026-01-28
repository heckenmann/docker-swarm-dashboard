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
import { Suspense } from 'react'
import { useAtomValue } from 'jotai'
import { ErrorBoundary } from './common/ErrorBoundary'
import LoadingComponent from './components/LoadingComponent'
import { DashboardNavbar } from './components/DashboardNavbar'
import { Container } from 'react-bootstrap'
import { WelcomeMessageComponent } from './components/WelcomeMessageComponent'
import { ContentRouter } from './components/ContentRouter'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
} from './common/store/atoms'
import './App.css'

library.add(fab, fas, far)

const App = () => {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)

  return (
    <div
      className={`App ${currentVariantClasses} ${currentVariant === 'dark' ? 'theme-dark' : 'theme-light'}`}
      data-bs-theme={currentVariant}
    >
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
