import React, { Suspense, useEffect } from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap/dist/css/bootstrap.min.css'
import { useAtomValue } from 'jotai'
import { loadable } from 'jotai/utils'
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

const currentVariantLoadable = loadable(currentVariantAtom)
const currentVariantClassesLoadable = loadable(currentVariantClassesAtom)
const maxContentWidthLoadable = loadable(maxContentWidthAtom)

/**
 * AppContent handles the main layout and theme-dependent styling.
 */
const AppContent = () => {
  const currentVariantRes = useAtomValue(currentVariantLoadable)
  const currentVariantClassesRes = useAtomValue(currentVariantClassesLoadable)
  const maxContentWidthRes = useAtomValue(maxContentWidthLoadable)

  // Use data if available, or fallbacks to avoid suspension of the shell
  const currentVariant =
    currentVariantRes.state === 'hasData' ? currentVariantRes.data : 'light'
  const currentVariantClasses =
    currentVariantClassesRes.state === 'hasData'
      ? currentVariantClassesRes.data
      : 'bg-light text-dark'
  const maxContentWidth =
    maxContentWidthRes.state === 'hasData' ? maxContentWidthRes.data : 'fluid'

  // If we have an error in these fundamental settings, trigger the ErrorBoundary.
  if (currentVariantRes.state === 'hasError') throw currentVariantRes.error
  if (currentVariantClassesRes.state === 'hasError')
    throw currentVariantClassesRes.error
  if (maxContentWidthRes.state === 'hasError') throw maxContentWidthRes.error

  // Sync theme to document element for CSS variables to work properly
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', currentVariant)
    if (currentVariant === 'dark') {
      document.documentElement.classList.add('theme-dark')
    } else {
      document.documentElement.classList.remove('theme-dark')
    }
  }, [currentVariant])

  return (
    <div className={`app ${currentVariantClasses}`}>
      <img
        className="background-image"
        aria-hidden="true"
        src={bgLogo}
        alt=""
      />

      <DashboardNavbar />

      <LoadingBar />

      <main role="main">
        <Container fluid={maxContentWidth === 'fluid'}>
          <Suspense fallback={null}>
            <WelcomeMessageComponent />
            <ContentRouter />
          </Suspense>
        </Container>
      </main>
    </div>
  )
}

/**
 * Main App component.
 */
const App = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
