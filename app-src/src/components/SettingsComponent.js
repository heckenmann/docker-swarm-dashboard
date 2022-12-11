import {useAtom, useAtomValue} from 'jotai';
import {Table, Card, Button, ButtonGroup, FormCheck} from 'react-bootstrap';
import {
    currentVariantAtom,
    currentVariantClassesAtom, isDarkModeAtom, logsConfigAtom, logsShowLogsAtom,
    messagesAtom,
    nodesAtom,
    refreshIntervalAtom, servicesAtom, smallTablesAtom, tableSizeAtom, tasksAtom, useNewApiToogleAtom, viewAtom
} from '../common/store/atoms';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {MessageReducer, RefreshIntervalToggleReducer} from "../common/store/reducers";
import {useResetAtom} from "jotai/utils";

function SettingsComponent() {
    const [, messageReducer] = useAtom(messagesAtom, MessageReducer);
    const currentVariant = useAtomValue(currentVariantAtom);
    const currentVariantClasses = useAtomValue(currentVariantClassesAtom);
    const [refreshInterval, toggleRefresh] = useAtom(refreshIntervalAtom, RefreshIntervalToggleReducer);
    const [isDarkMode, setIsDarkMode] = useAtom(isDarkModeAtom);
    const [useNewApiToogle, setUseNewApiToggle] = useAtom(useNewApiToogleAtom);
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
                        <td>Interval Refresh</td>
                        <td><FormCheck type="switch" variant={refreshInterval ? 'secondary' : 'outline-secondary'} onChange={toggleRefreshAndNotifyUser} checked={refreshInterval != null} disabled={true} /></td>
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
                    <tr>
                        <td><FontAwesomeIcon icon="pizza-slice" /></td>
                        <td>New REST-API Toggle (Beta)</td>
                        <td><FormCheck type="switch" variant={useNewApiToogle ? 'secondary' : 'outline-secondary'} onChange={() =>  setUseNewApiToggle(!useNewApiToogle)} checked={useNewApiToogle} /></td>
                    </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card >
    );
}

export { SettingsComponent };