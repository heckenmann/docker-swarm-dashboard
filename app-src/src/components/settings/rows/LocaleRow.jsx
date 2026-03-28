import React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { localeAtom } from '../../../common/store/atoms/uiAtoms'
import { dashboardSettingsAtom } from '../../../common/store/atoms/foundationAtoms'
import { FormControl, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * LocaleRow renders the locale setting row.
 */
const LocaleRow = React.memo(function LocaleRow() {
  const [locale, setLocale] = useAtom(localeAtom)
  const dashboardSettings = useAtomValue(dashboardSettingsAtom)

  return (
    <tr>
      <td>
        <span
          className="d-inline-flex align-items-center justify-content-center rounded bg-secondary bg-opacity-10 p-2 me-2"
          aria-hidden
        >
          <FontAwesomeIcon icon="globe" />
        </span>
      </td>
      <td>
        Locale
        <div className="small text-muted">
          Language locale for the UI.
          <div className="small text-muted fw-bold mt-1">Env: DSD_LOCALE</div>
        </div>
      </td>
      <td>
        <FormControl
          size="sm"
          aria-label="Locale"
          placeholder="e.g. en-US, de-DE, fr-FR"
          value={locale}
          onChange={(event) => setLocale(event.target.value)}
        />
      </td>
      <td className="small text-muted">
        {String(dashboardSettings?.locale || '')}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-muted"
          onClick={() => setLocale(dashboardSettings?.locale || '')}
          aria-label="Reset locale to default"
        >
          <FontAwesomeIcon icon="undo" />
        </Button>
      </td>
    </tr>
  )
})

export default LocaleRow
