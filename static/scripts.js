function refresh() {
    resetTable();
}

function resetTable() {
    $('#containerTable').fadeOut('fast');
    $('#containerTable').promise().done(function() {
        $('#tableHead th').remove();
        $('#tableBody tr').remove();

        $('#tableHead').append('<th></th>');

        // Load Nodes
        $.getJSON("/docker/nodes", function (nodes) {
            nodes.sort(function (a, b) {
                return a['Description']['Hostname'] > b['Description']['Hostname'] ? 1 : -1;
            });
            for (node in nodes) {
                $('#tableBody').append('\
            <tr id="' + nodes[node]['ID'] + '"><td class="firstCol" scope="row">' + nodes[node]['Description']['Hostname'] + ' (' + nodes[node]['Spec']['Role'] + ')' +
                    '<br/>' + nodes[node]['Status']['Addr'] +
                    '</td></tr>');
            }

            // Load Services
            $.getJSON("/docker/services", function (services) {
                services.sort(function (a, b) {
                    return a['Spec']['Name'] > b['Spec']['Name'] ? 1 : -1;
                });
                for (service in services) {
                    $('#tableHead').append('<th><div class="rotated">' + services[service]['Spec']['Name'] + '</div></th>');
                    //    id="' + services[service]['ID'] + '"
                    $('#tableBody tr').append('<td id="' + services[service]['ID'] + '"></td>');
                }

                // Load tasks
                $.getJSON("/docker/tasks", function (tasks) {
                    for (task in tasks) {
                        taskObject = tasks[task];
                        state = taskObject['Status']['State']
                        if (state == 'complete') {
                            continue;
                        }

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

                        $('#' + taskObject['NodeID'] + ' #' + taskObject['ServiceID']).append('<span class="badge badge-pill ' + badgeClass + '">' + state + '</span><br/>');
                    }
                    // $('thead>tr').append('<th></th>');
                    // $('tbody>tr').append('<td></td>');

                    $('#containerTable').fadeIn('fast');
                });
            });
        });}
    );
}

// while(true) {
// $('body').delay(1000);
// console.log("Hallo");
// }

// F5
// https://stackoverflow.com/questions/4788201/handling-f5-in-jquery
$(document).bind('keydown keyup', function (e) {
    //if (e.which === 116) {
    //    console.log('F5 fetched');
    //    resetTable();
    //    return false;
    //}
    // if(e.which === 82 && e.ctrlKey) {
    //    console.log('blocked');
    //    return false;
    // }
});

// First run
resetTable();

