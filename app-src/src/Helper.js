
const getStyleClassForState = (state) => {
    let styleClass = 'secondary';
    if (state === 'running') {
        styleClass = 'success';
    } else if (state === 'failed'
        || state === 'rejected'
        || state === 'orphaned') {
        styleClass = 'danger';
    } else if (state === 'shutdown'
        || state === 'complete') {
        styleClass = 'dark';
    } else if (state === 'new'
        || state === 'ready'
        || state === 'pending'
        || state === 'preparing'
        || state === 'starting') {
        styleClass = 'warning';
    }
    return styleClass;
}

export {getStyleClassForState};