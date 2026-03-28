import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { Row, Col, Form, Button, ButtonGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { currentVariantAtom } from '../../common/store/atoms/themeAtoms'
import {
  logsFormSinceAtom,
  logsFormSinceAmountAtom,
  logsFormSinceUnitAtom,
  logsFormSinceIsISOAtom,
  logsFormSinceErrorAtom,
} from '../../common/store/atoms/logsAtoms'
import { isValidSince } from './logsUtils'

/**
 * SinceInput renders the "since" field for log configuration.
 * Supports duration mode (amount + unit selectors + presets) and ISO timestamp mode.
 * Reads and writes Jotai atoms directly; no props required.
 */
const SinceInput = React.memo(function SinceInput() {
  const currentVariant = useAtomValue(currentVariantAtom)
  const [since, setSince] = useAtom(logsFormSinceAtom)
  const [sinceAmount, setSinceAmount] = useAtom(logsFormSinceAmountAtom)
  const [sinceUnit, setSinceUnit] = useAtom(logsFormSinceUnitAtom)
  const [sinceIsISO, setSinceIsISO] = useAtom(logsFormSinceIsISOAtom)
  const [sinceError, setSinceError] = useAtom(logsFormSinceErrorAtom)

  return (
    <Form.Group as={Row} className="mb-3" controlId="logsformsince">
      <Form.Label column sm="2">
        Since
      </Form.Label>
      <Col sm="10">
        <div className="d-flex align-items-center gap-2 w-100 flex-nowrap">
          {!sinceIsISO ? (
            <>
              <Form.Control
                type="number"
                min="1"
                value={sinceAmount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '')
                  setSinceAmount(v)
                  setSince(`${v}${sinceUnit}`)
                  setSinceError(false)
                }}
                aria-label="Since amount"
                isInvalid={!!sinceError}
                className="me-2 w-auto"
              />
              <ButtonGroup aria-label="Since units">
                {[
                  { k: 's', label: 's (seconds)' },
                  { k: 'm', label: 'm (minutes)' },
                  { k: 'h', label: 'h (hours)' },
                  { k: 'd', label: 'd (days)' },
                ].map((u) => (
                  <Button
                    key={u.k}
                    variant={
                      sinceUnit === u.k ? 'primary' : 'outline-secondary'
                    }
                    onClick={() => {
                      setSinceUnit(u.k)
                      setSince(`${sinceAmount}${u.k}`)
                      setSinceError(false)
                    }}
                  >
                    {u.label}
                  </Button>
                ))}
              </ButtonGroup>
              <ButtonGroup aria-label="Since presets">
                {['5m', '15m', '1h', '6h', '24h'].map((p) => {
                  const match = p.match(/^(\d+)([smhd])$/)
                  return (
                    <Button
                      key={p}
                      variant="outline-secondary"
                      onClick={() => {
                        setSinceAmount(match[1])
                        setSinceUnit(match[2])
                        setSince(p)
                        setSinceError(false)
                      }}
                    >
                      {p}
                    </Button>
                  )
                })}
              </ButtonGroup>
            </>
          ) : (
            <Form.Control
              type="text"
              value={since}
              onChange={(e) => {
                setSince(e.target.value)
                setSinceError(false)
              }}
              onBlur={() => {
                if (!isValidSince(since)) setSinceError('Invalid ISO timestamp')
              }}
              placeholder="2023-01-01T12:00:00Z"
              isInvalid={!!sinceError}
              className="w-100"
            />
          )}
          <Button
            variant="outline-secondary"
            className="ms-2 flex-shrink-0"
            aria-pressed={sinceIsISO}
            aria-label={sinceIsISO ? 'Switch to duration' : 'Switch to ISO'}
            onClick={() =>
              setSinceIsISO((v) => {
                const newV = !v
                if (newV) {
                  const iso24 = new Date(
                    Date.now() - 24 * 60 * 60 * 1000,
                  ).toISOString()
                  setSince(iso24)
                } else {
                  setSince(`${sinceAmount}${sinceUnit}`)
                }
                setSinceError(false)
                return newV
              })
            }
          >
            <FontAwesomeIcon
              icon={sinceIsISO ? 'clock' : 'calendar'}
              className="me-1"
            />
            {sinceIsISO ? 'Use duration' : 'Use ISO'}
          </Button>
        </div>
        {sinceError && (
          <div className="invalid-feedback d-block">{sinceError}</div>
        )}
        <Form.Text
          className={
            currentVariant === 'dark' ? 'text-secondary' : 'text-muted'
          }
        >
          Show logs since the given duration (e.g. &quot;1h&quot;) or ISO
          timestamp. Matches Docker&apos;s --since behavior. See{' '}
          <a
            href="https://docs.docker.com/engine/reference/commandline/cli/#filtering"
            target="_blank"
            rel="noreferrer"
          >
            Docker docs
          </a>
          .
        </Form.Text>
      </Col>
    </Form.Group>
  )
})

SinceInput.propTypes = {}

export default SinceInput
