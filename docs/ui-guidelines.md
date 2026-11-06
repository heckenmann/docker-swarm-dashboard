# Dashboard UI guidelines

These rules apply to new UI and to existing UI touched by a change. They are
project decisions informed by the references below; they do not introduce a
second component system. Read the closest existing view before implementing.

## Tables

- Use React Bootstrap `Table`, `DSDCard`, `SortableHeader`, and `sortData`.
  Do not build an alternative table, card, sorting, or entity-action system.
- Inventory and detail tables use `responsive`, `striped`, `bordered`, `hover`,
  `variant={currentVariant}`, `size={tableSize}`, and
  `className="mb-0 align-middle"`. Bind the current theme and `tableSizeAtom`;
  never hardcode density or colors. Tables must touch the card edges: pass
  them as `DSDCard` children or use `MetricCard noBody={true}`. A table card
  must not contain a `Card.Body` wrapper, including one with `p-0`; remove
  the wrapper instead. Responsive table wrappers are allowed and must have
  no padding. Keep ordinary text/metadata padding separate from table content.
- Preserve the shared 28px table-header height. Keep names and adjacent actions
  on one line. Use separate columns for names and IDs; do not turn ordinary
  rows into stacked cards. Use monospace for IDs and addresses, right alignment
  for numeric counts, and consistent locale/time-zone formatting for dates.
- Use one column per property. Do not pack unrelated boolean properties into a
  multiline “Flags” cell. Use concise text such as Yes, No, and Unknown; color
  alone must never convey state. Unknown, missing, false, zero, and empty are
  different states and must remain different in the API as well as the UI.
- Make meaningful data columns sortable with the existing three-click cycle:
  ascending, descending, original order. Keep independent state for independent
  tables; sorting one table must not reorder another. Use the correct number
  and date types. Reuse keyboard activation and `aria-sort` from SortableHeader.
- Give tables accessible names, use real column headers, and keep empty-state
  `colSpan` equal to the number of visible columns. Empty, loading, unavailable,
  missing references, and failed requests need explicit, distinct messages.
- Preserve a readable table at narrow widths with the responsive wrapper;
  horizontal overflow belongs to the table, not the entire page. Test both
  densities, light/dark themes, keyboard sorting, and a narrow viewport.

## Names, actions, filtering, and details

- Use `EntityName` and the existing entity wrappers for open/filter/log actions.
  A network uses `NetworkName`, a service uses `ServiceName`. Honor
  `showNamesButtonsAtom`; do not replace shared actions with ad-hoc blue text
  buttons or repeat action icons with a different appearance.
- A link to a filtered view must set the intended filter and clear contradictory
  filters. Test the destination content with stale filters already present;
  checking the destination URL alone is insufficient.
- Keep inventory filters compact, preferably in `headerActions`. Reuse the
  existing InputGroup, clear action, and theme. Label controls accessibly;
  placeholder text is supplementary. Do not render a full-width row for every
  filter dimension. State whether matching is substring or exact.
- Detail pages use the same entity icon as the inventory and navigation. Put
  key metadata into the established responsive Row/Col pattern. Use the same
  table styling for associations and configuration. Raw JSON belongs in an
  explicitly labelled technical section, not in place of ordinary metadata.
- Raw JSON must follow Service and Node details: `MetricCard` with title
  `Raw JSON`, icon `code`, and a plain `<pre><code>` block using `pre-wrap`,
  monospace, 12px text, and `mb-0`. Do not add copy buttons, language selectors,
  syntax-editor controls, nested borders, or an independent scrolling pane to
  one entity's JSON view. `CodeField` is for config content, not entity JSON.
- Use warning/error alerts for actionable exceptional states. Explain observation
  limits in concise supporting text; do not make every normal page look like an
  error or place a large information alert above the primary content.

## Icons: one meaning per symbol

Use the existing Font Awesome library. Bootstrap does not require Bootstrap
Icons, and adding another icon family would introduce inconsistent shapes.
An icon represents one semantic concept across navigation, card headers, filter
selectors, and actions. Never reuse an entity icon for a different entity or
an action icon for a different operation. Repeating the network icon for IPAM
and network traffic is the same concept; using the node icon for networks is not.

| Meaning | Existing Font Awesome name | Applies to |
| --- | --- | --- |
| Dashboard layout | `grip`, `grip-vertical` | Horizontal and vertical dashboard |
| Timeline | `timeline` | Timeline navigation |
| Nodes / Docker hosts | `server` | Nodes navigation, details, node information |
| Networks / network configuration and traffic | `network-wired` | Networks navigation, details, IPAM, network observations |
| Services | `folder` | Service details, service filter selector, service associations |
| Stacks | `cubes` | Stack navigation and stack filter selector |
| Tasks | `tasks` | Task navigation and task associations |
| Configs | `file` | Config inventories and detail headings |
| Secrets | `key` | Secret inventories and detail headings |
| Published ports | `building` | Port inventory and port rows |
| Logs | `desktop` | Logs navigation and show-logs action |
| Open details / inspect | `search` | Entity detail action; not generic text filtering |
| Apply a filter | `filter` | Entity filter action |
| Clear / dismiss | `times` | Clear a filter or dismiss content |
| Settings | `gear` | Application settings |
| Refresh | `sync` | Refresh current data |
| Sort | `sort`, `sort-up`, `sort-down` | Unsorted, ascending, descending table headers |
| Technical code / JSON | `code` | Explicit code/JSON sections |
| Labels / tags | `tags` | Docker label metadata |
| Information | `info-circle` | Informational context |
| Download update | `cloud-download-alt` | Version update action |
| Warning | `exclamation-triangle` | Warning context |

Before choosing an icon, inspect this mapping and nearby uses. Choose a distinct,
recognizable symbol for a new concept, and document its meaning here. Do not
rename established symbols merely to match a personal preference.

Icon-only controls require an accessible name and a discoverable tooltip/title.
Decorative icons beside visible text stay hidden from assistive technology.
Preserve the user's navigation-label and entity-action settings. Do not rely on
an icon or color as the only way to communicate a state or operation.

## Review checklist

1. Compare the implementation with an existing inventory and detail view.
2. Verify icon meaning in the navigation, heading, entity rows, and actions.
3. Verify sorting, density, theme, header/body columns, and responsive overflow.
4. Verify loading, failure, empty data, missing references, and unknown metadata.
5. Follow every cross-view action with old filters present and inspect its result.
6. Inspect the actual rendered UI at desktop and mobile widths, in both themes.

## Sources

- [Bootstrap 5.3 tables](https://getbootstrap.com/docs/5.3/content/tables/):
  opt-in table variants, density, responsive wrappers, and color-independent meaning.
- [Bootstrap 5.3 icons](https://getbootstrap.com/docs/5.3/extend/icons/):
  external icon libraries, including Font Awesome.
- [W3C WAI tables tutorial](https://www.w3.org/WAI/tutorials/tables/):
  semantic relationships between headers and cells.
- [W3C WAI sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/):
  keyboard interaction and communicating sort state.
- [Nielsen Norman Group: consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/):
  consistent terminology, behavior, and symbols.
- [Nielsen Norman Group: icon usability](https://www.nngroup.com/articles/icon-usability/):
  recognizable symbols, labels, and avoiding ambiguous meanings.
