function AddProject() {
    $("#AddNewSoftware").modal("show");
    $("#AddNewSoftware").on("shown.bs.modal", function() {
        $('#mpname').focus();
        $(document).keypress(function(e) {
            if(e.which == 13) {
                $('#SaveSoftwareBtn').click();
            }
        });
    });
}

function SaveProject() {
    if (($('#mpname').val() == "") || ($('#mpname').val() === undefined)) {
        return undefined
    }
    var projname = $('#mpname').val();
    $.post('http://localhost:9090/Services/SaveProject/', 
           {'project': JSON.stringify({'title': projname})},
           function(data) {
               $('#mpname').val('');
               if ($('#Warn_NoProject').length > 0) {
                    $('#Warn_NoProject').remove();
               }
               AppendProjectPanel(data.results.project.title);
           }
    );
    
}

function GetProjects(callback) {
    // Return all projects, or display notification that no projects exist
    $.post('http://localhost:9090/Services/GetProjects/',
           {},
           function(data) {
             if (callback === undefined) {
                 DisplayProjects(data); // remove all items from div then re-add
             }
             else {
                 callback(data); // allow another method to handle returned projects
             }
           }
    );
}

function DisplayProjects(projects) {
    for (var i=0; i < projects.results.length; i++) {
        AppendProjectPanel(projects.results[i]);
    }
    if (projects.results.length > 0) {
        $('#Warn_NoProject').remove();
    }
    else {
        if ($('#Warn_NoProject').length == 0) {
            $('#NotificationBlock').append(
                '<div id="Warn_NoProject" class="alert alert-warning" role="alert"><span class="glyphicon glyphicon-warning-sign"></span> No projects found. <a href="#" onclick="AddProject();">Click here to add one</a> </div>'
            );
        }
    }
}

function AppendProjectPanel(title) {
    $('#ProjectListingDiv').prepend($("<div>").addClass("panel panel-primary").attr("id", title)
        .append($("<div>").addClass("panel-heading").append($("<span>").html("<b>" + title + "</b> ")).append($("<span>").addClass("glyphicon glyphicon-remove").on("click", function() { 
            DeleteSoftware(title);
        })).on("click", function() { 
            return false; // Fix for issue where clicking on header invokes body onclick event
        }))
        .append($("<div>").addClass("panel-body").append(
            GenerateSoftwareSummary("blah blah blah blah blah<br />Some more blah", "Project").on("click", function() { 
                ProjectSettingsModal(title);
                $('#SoftwareDetails').modal("show");
                return false; // Required to stop modal window from hiding immediately
            }
        )))
        .attr("data-toggle", "modal")
        .attr("data-target", "#SoftwareDetails"));
}

function DeleteSoftware(title) {
    $.post('http://localhost:9090/Services/DeleteProject/',
           {'title': JSON.stringify(title)},
           function(project) {
               if (project.results.deleted == "true") {
                   $('#' + title).remove();
                   GetProjects();
               }
           });
}

function ProjectSettingsModal(title) {
    $('#modal-header-title').html(title);
    
}

function GenerateSoftwareSummary(body, heading, image) {
    var img = (image === undefined) ? "/imgs/folder-tar.png" : image;
    var header = (heading === undefined) ? "Untitled Heading" : heading;
    return $("<div>").addClass("media")
        .append($("<div>").addClass("media-left media-middle")
            .append($("<a>").attr("href", "#")
                .append('<img class="media-object" src="' + img + '" alt="' + img + '">'))
         ).append($("<div>").addClass("media-body")
             .append($("<h4>").addClass("media-heading").html(header))
             .append(body)
        );
}