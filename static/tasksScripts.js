function refresh() {
    resetTasks();
}

function resetTasks() {
    $("#refreshButton").attr("disabled", "disabled");
    $('#tasksTable').fadeOut('fast');
    $('#tasksTable').promise().done(function () {
        $('#tasksTable #tableBody tr').remove();

        $.getJSON("/docker/nodes", function (nodes) {
            $.getJSON("/docker/services", function (services) {
                $.getJSON("/docker/tasks", function (tasks) {
                    tasks = tasks.sort(function (a, b) {
                        return a['Status']['Timestamp'] < b['Status']['Timestamp'] ? 1 : -1;
                    });
                    for (task in tasks) {
                        taskObject = tasks[task];
                        currentNode = nodes.find(node => node['ID'] == taskObject['NodeID']);
                        currentService = services.find(service => service['ID'] == taskObject['ServiceID']);

                        currentNodeName = currentNode == null ? "" : currentNode['Description']['Hostname'];
                        currentServiceName = currentService == null ? "" : currentService['Spec']['Name'];
                        currentError = taskObject['Status']['Err'] == null ? "" : taskObject['Status']['Err'];

                        // TODO CopyPaste
                        state = taskObject['Status']['State']
                        badgeClass = 'badge-secondary';
                        if (state == 'running') {
                            badgeClass = 'badge-success';
                        } else if (state == 'failed'
                            || state == 'rejected'
                            || state == 'orphaned') {
                            badgeClass = 'badge-danger';
                        } else if (state == 'shutdown'
                            || state == 'complete') {
                            badgeClass = 'badge-dark';
                        } else if (state == 'new'
                            || state == 'ready'
                            || state == 'pending'
                            || state == 'preparing'
                            || state == 'starting') {
                            badgeClass = 'badge-warning';
                        }

                        $('#tableBody').append('\
            <tr>\
            <td>'+ new Date(taskObject['Status']['Timestamp']).toLocaleString() + '</td>\
            <td><span class="badge badge-pill ' + badgeClass + '">' + state + '</span></td>\
            <td>'+ taskObject['DesiredState'] + '</td>\
            <td>'+ currentServiceName +'</td>\
            <td>'+ currentNodeName + '</td>\
            <td>'+ currentError +'</td>\
            </tr>');
                    }

                    $('#tasksTable').fadeIn('fast');
                    $("#refreshButton").removeAttr("disabled");  
                });
            });
        });
    });
}

resetTasks();