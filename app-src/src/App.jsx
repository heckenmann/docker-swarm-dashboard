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
import { Container } from 'react-bootstrap'
import { ErrorBoundary } from './common/ErrorBoundary.jsx'
import LoadingBar from './components/layout/LoadingBar.jsx'
import DashboardNavbar from './components/layout/DashboardNavbar.jsx'
import WelcomeMessageComponent from './components/shared/WelcomeMessageComponent.jsx'
import ContentRouter from './components/layout/ContentRouter.jsx'
import {
  currentVariantAtom,
  currentVariantClassesAtom,
} from './common/store/atoms/themeAtoms'
import { maxContentWidthAtom } from './common/store/atoms/uiAtoms'
import './App.css'
import bgLogo from './assets/docker.png'

library.add(fab, fas, far)

const App = () => {
  const currentVariant = useAtomValue(currentVariantAtom)
  const currentVariantClasses = useAtomValue(currentVariantClassesAtom)
  const maxContentWidth = useAtomValue(maxContentWidthAtom)

  return (
    <div
      className={`app ${currentVariantClasses} ${currentVariant === 'dark' ? 'theme-dark' : 'theme-light'}`}
      data-bs-theme={currentVariant}
    >
      <img
        className="background-image"
        aria-hidden="true"
        src={bgLogo}
        alt=""
      />
      <ErrorBoundary>
        <DashboardNavbar />
      </ErrorBoundary>
      <LoadingBar />
      <main role="main">
        <Container fluid={maxContentWidth === 'fluid'}>
          <ErrorBoundary>
            <WelcomeMessageComponent />
            <ContentRouter />
          </ErrorBoundary>
        </Container>
      </main>
    </div>
  )
}

export default App
