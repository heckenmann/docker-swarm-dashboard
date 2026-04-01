import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Table, Button } from 'react-bootstrap'
import DSDCard from '../common/DSDCard.jsx'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import { versionAtom } from '../../common/store/atoms/dashboardAtoms'
import { viewAtom } from '../../common/store/atoms/navigationAtoms'
import { debugId } from '../../common/navigationConstants'

/**
 * AboutComponent is a functional component that displays information about the Docker Swarm Dashboard project.
 * It includes project links, acknowledgments, and tools used in the project.
 */
const AboutComponent = React.memo(function AboutComponent() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const version = useAtomValue(versionAtom)

  const [, updateView] = useAtom(viewAtom)

  return (
    <DSDCard
      icon="info-circle"
      title="About"
      body={
        <>
          <h1>Docker Swarm Dashboard '{version.version}'</h1>
          <h2>by heckenmann</h2>
          <Table variant={currentVariant}>
            <tbody>
              <tr>
                <td>License:</td>
                <td>
                  <a href="https://github.com/heckenmann/docker-swarm-dashboard/blob/master/LICENSE">
                    https://github.com/heckenmann/docker-swarm-dashboard/blob/master/LICENSE
                  </a>
                </td>
              </tr>
              <tr>
                <td>GitHub-Project:</td>
                <td>
                  <a href="https://github.com/heckenmann/docker-swarm-dashboard">
                    https://github.com/heckenmann/docker-swarm-dashboard
                  </a>
                </td>
              </tr>
              <tr>
                <td>Docker Registry:</td>
                <td>
                  <a href="https://github.com/heckenmann/docker-swarm-dashboard/pkgs/container/docker-swarm-dashboard">
                    https://github.com/heckenmann/docker-swarm-dashboard/pkgs/container/docker-swarm-dashboard
                  </a>
                </td>
              </tr>
            </tbody>
          </Table>
          <h2>Frameworks & Libraries</h2>
          <ul>
            <li>
              <Button
                variant="link"
                target="_blank"
                href="https://apexcharts.com/"
              >
                ApexCharts
              </Button>
            </li>
            <li>
              <Button
                variant="link"
                target="_blank"
                href="https://getbootstrap.com/"
              >
                Bootstrap
              </Button>
            </li>
            <li>
              <Button
                variant="link"
                target="_blank"
                href="https://www.cypress.io/"
              >
                Cypress
              </Button>
            </li>
            <li>
              <Button
                variant="link"
                target="_blank"
                href="https://fontawesome.com/"
              >
                Fontawesome
              </Button>
            </li>
            <li>
              <Button
                variant="link"
                target="_blank"
                href="https://www.gorillatoolkit.org/"
              >
                Gorilla
              </Button>
            </li>
            <li>
              <Button variant="link" target="_blank" href="https://jotai.org/">
                Jotai
              </Button>
            </li>
            <li>
              <Button
                variant="link"
                target="_blank"
                href="https://reactjs.org/"
              >
                React
              </Button>
            </li>
          </ul>
          <h2>Application</h2>
          <Button
            onClick={() =>
              updateView((prev) => ({
                ...prev,
                id: debugId,
              }))
            }
          >
            <FontAwesomeIcon icon="bug" />
            Debug
          </Button>
        </>
      }
    />
  )
})

export default AboutComponent
