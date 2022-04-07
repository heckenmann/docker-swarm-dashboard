import { Table } from "react-bootstrap";
import { flatten } from "../common/utils";

export function JsonTable(props) {

    const flattenConfig = flatten(props.json);
    const rows = Object.keys(flattenConfig).map(node => <tr key={node}><td>{node}</td><td>{flattenConfig[node]}</td></tr>)

    return (
        <Table variant={props.variant}>
            <thead>
                <tr>
                    <th>Key</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </Table>
    );
}