import React from 'react';
import { useAtom } from 'jotai';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import {
  tableSizeAtom,
  showNamesButtonsAtom,
  showNavLabelsAtom,
  maxContentWidthAtom,
  isDarkModeAtom,
  refreshIntervalAtom,
} from '../../common/store/atoms';

/**
 * SettingsComponent - A component for managing user settings.
 * @returns {JSX.Element} The settings panel.
 */
function SettingsComponent() {
  const [tableSize, setTableSize] = useAtom(tableSizeAtom);
  const [showNamesButtons, setShowNamesButtons] = useAtom(showNamesButtonsAtom);
  const [showNavLabels, setShowNavLabels] = useAtom(showNavLabelsAtom);
  const [maxContentWidth, setMaxContentWidth] = useAtom(maxContentWidthAtom);
  const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
  const [refreshInterval, setRefreshInterval] = useAtom(refreshIntervalAtom);

  const handleReset = () => {
    setTableSize('lg');
    setShowNamesButtons(true);
    setShowNavLabels(false);
    setMaxContentWidth('fluid');
    setIsDarkMode(false);
    setRefreshInterval(null);
  };

  return (
    <div className="settings-component">
      <h2>Settings</h2>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Table Size</Form.Label>
          <Form.Select
            data-testid="table-size-select"
            value={tableSize}
            onChange={(e) => setTableSize(e.target.value)}
          >
            <option value="sm">Small</option>
            <option value="lg">Large</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="show-names-buttons"
            data-testid="show-names-buttons-checkbox"
            label="Show names buttons"
            checked={showNamesButtons}
            onChange={(e) => setShowNamesButtons(e.target.checked)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="show-nav-labels"
            data-testid="show-nav-labels-checkbox"
            label="Show navigation labels"
            checked={showNavLabels}
            onChange={(e) => setShowNavLabels(e.target.checked)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Max Content Width</Form.Label>
          <Form.Select
            data-testid="max-content-width-select"
            value={maxContentWidth}
            onChange={(e) => setMaxContentWidth(e.target.value)}
          >
            <option value="fluid">Fluid (full width)</option>
            <option value="fixed">Fixed (container)</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Interval Refresh</Form.Label>
          <div className="btn-group" role="group">
            <Button
              data-testid="refresh-off-button"
              variant={refreshInterval === null ? 'primary' : 'secondary'}
              onClick={() => setRefreshInterval(null)}
            >
              Off
            </Button>
            <Button
              data-testid="refresh-5s-button"
              variant={refreshInterval === 5000 ? 'primary' : 'secondary'}
              onClick={() => setRefreshInterval(5000)}
            >
              5s
            </Button>
            <Button
              data-testid="refresh-10s-button"
              variant={refreshInterval === 10000 ? 'primary' : 'secondary'}
              onClick={() => setRefreshInterval(10000)}
            >
              10s
            </Button>
            <Button
              data-testid="refresh-30s-button"
              variant={refreshInterval === 30000 ? 'primary' : 'secondary'}
              onClick={() => setRefreshInterval(30000)}
            >
              30s
            </Button>
            <Button
              data-testid="refresh-60s-button"
              variant={refreshInterval === 60000 ? 'primary' : 'secondary'}
              onClick={() => setRefreshInterval(60000)}
            >
              60s
            </Button>
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="dark-mode"
            data-testid="dark-mode-checkbox"
            label="Dark mode"
            checked={isDarkMode}
            onChange={(e) => setIsDarkMode(e.target.checked)}
          />
        </Form.Group>

        <Button
          variant="secondary"
          data-testid="reset-button"
          onClick={handleReset}
        >
          Reset to defaults
        </Button>
      </Form>
    </div>
  );
}

export default SettingsComponent;
