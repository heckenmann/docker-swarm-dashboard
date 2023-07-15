import {useAtom, useAtomValue} from 'jotai';
import {Table, Card, FormCheck} from 'react-bootstrap';
import {
    currentVariantAtom,
    currentVariantClassesAtom, isDarkModeAtom,
    refreshIntervalAtom, tableSizeAtom,
} from '../common/store/atoms';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {RefreshIntervalToggleReducer} from "../common/store/reducers";

function SettingsComponent() {
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const [refreshInterval, toggleRefresh] = useAtom(refreshIntervalAtom, RefreshIntervalToggleReducer);
    const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
    const [tableSize, setTableSize] = useAtom(tableSizeAtom);

    const toggleRefreshAndNotifyUser = () => {
        toggleRefresh();
    }

    return (
        <Card bg={currentVariant} className={currentVariantClasses}>
            <Card.Body>
                <Table variant={isDarkMode ? currentVariant : null} striped size={tableSize}>
                    <thead>
                    <tr>
                        <th className="col-sm-1"></th>
                        <th className="col-sm-5">Setting</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td><FontAwesomeIcon icon={refreshInterval ? "stop-circle" : "play-circle"} /></td>
                        <td>Interval Refresh (3000 ms)</td>
                        <td><FormCheck type="switch" variant={refreshInterval ? 'secondary' : 'outline-secondary'} onChange={toggleRefreshAndNotifyUser} checked={refreshInterval != undefined} /></td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon="lightbulb" /></td>
                        <td>Dark Mode</td>
                        <td><FormCheck type="switch" variant={isDarkMode ? 'secondary' : 'outline-secondary'} onChange={() => setIsDarkMode(!isDarkMode)} value={isDarkMode} checked={isDarkMode} /></td>
                    </tr>
                    <tr>
                        <td><FontAwesomeIcon icon="table-cells" /></td>
                        <td>Small tables</td>
                        <td><FormCheck type="switch" variant={tableSize ? 'secondary' : 'outline-secondary'} onChange={() =>  setTableSize(tableSize == 'sm' ? 'lg' : 'sm')} checked={tableSize == 'sm'} /></td>
                    </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card >
    );
}

export { SettingsComponent };