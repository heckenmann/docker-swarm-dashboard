function resetTable() {
    $('#tableHead th').remove();
    $('#tableBody tr').remove();

    $('#tableHead').append('<th></th>');

    // Load Nodes
    $.getJSON("/docker/nodes", function (nodes) {
        nodes.sort(function (a, b) {
            return a['Description']['Hostname'] > b['Description']['Hostname'];
        });
        for (node in nodes) {
            $('#tableBody').append('\
            <tr id="' + nodes[node]['ID'] + '"><td style="width: 200px;" scope="row">' + nodes[node]['Description']['Hostname'] + ' (' + nodes[node]['Spec']['Role'] + ')' +
                '<br/>' + nodes[node]['Status']['Addr'] +
                '</td></tr>');
        }

        // Load Services
        $.getJSON("/docker/services", function (services) {
            services.sort(function (a, b) {
                return a['Spec']['Name'] > b['Spec']['Name'];
            });
            for (service in services) {
                $('#tableHead').append('<th style="width: 40px;"><div class="rotated">' + services[service]['Spec']['Name'] + '</div></th>');
                //    id="' + services[service]['ID'] + '"
                $('#tableBody tr').append('<td id="' + services[service]['ID'] + '"></td>');
            }

            // Load tasks
            $.getJSON("/docker/tasks", function (tasks) {
                for (task in tasks) {
                    taskObject = tasks[task];
                    if (taskObject['DesiredState'] == 'shutdown') {
                        continue;
                    }

                    badgeClass = 'badge-secondary';
                    if (taskObject['DesiredState'] == 'running') {
                        badgeClass = 'badge-success';
                    } else if (taskObject['DesiredState'] == 'failed'
                        || taskObject['DesiredState'] == 'rejected'
                        || taskObject['DesiredState'] == 'orphaned') {
                        badgeClass = 'badge-danger';
                    } else if (taskObject['DesiredState'] == 'shutdown'
                        || taskObject['DesiredState'] == 'complete') {
                        badgeClass = 'badge-dark';
                    } else if (taskObject['DesiredState'] == 'new'
                        || taskObject['DesiredState'] == 'ready'
                        || taskObject['DesiredState'] == 'pending'
                        || taskObject['DesiredState'] == 'preparing'
                        || taskObject['DesiredState'] == 'starting') {
                        badgeClass = 'badge-warning';
                    }

                    $('#' + taskObject['NodeID'] + ' #' + taskObject['ServiceID']).append('<span class="badge badge-pill ' + badgeClass + '">' + taskObject['DesiredState'] + '</span><br/>');
                }
                $('thead>tr').append('<th></th>');
                $('tbody>tr').append('<td></td>');
            });
        });
    });
}

// while(true) {
// $('body').delay(1000);
// console.log("Hallo");
// }

// F5
// https://stackoverflow.com/questions/4788201/handling-f5-in-jquery
$(document).bind('keydown keyup', function (e) {
    // if(e.which === 116) {
    //    resetTable();
    //    return false;
    // }
    // if(e.which === 82 && e.ctrlKey) {
    //    console.log('blocked');
    //    return false;
    // }
});

// First run
resetTable();
