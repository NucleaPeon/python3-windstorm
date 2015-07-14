$(document).on("ready", function() {
    $("#AddNewSoftware").on("shown.bs.modal", function() {
        $('#mpname').focus();
        var func = $(document).keypress(function(e) {
            if(e.which == 13) {
                $('#SaveSoftwareBtn').click();
                $('#AddNewSoftware').modal("hide");
            }
        });
    });
    $("#AddNewSoftware").on("hidden.bs.modal", function() {
        delete $(document).keypress();
        $("#mpname").val("");
    });
});

function AddProject() {
    $("#AddNewSoftware").modal("show");
}

function SaveProject() {
    if (($('#mpname').val() == "") || ($('#mpname').val() === undefined)) {
        // Highlight the field in red background by adding in required class
        return undefined
    }
    // TODO: Validation of title
    var projname = $('#mpname').val().replace(" ", "_");
    $.post('http://localhost:9090/Services/SaveProject/', 
           {'project': JSON.stringify({'title': projname})},
           function(data) {
               $('#mpname').val('');
               if ($('#Warn_NoProject').length > 0) {
                    $('#Warn_NoProject').remove();
               }
               AppendProjectPanel(data.results.project.title);
               $("#Messages").append($("<li>").addClass("list-group-item").html("Saved project " + data.results.project.title));
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
    // Check to ensure project doesn't already exist before appending it
    if ($('#' + title).length == 0) {
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
}

function DeleteSoftware(title) {
    console.log(title);
    $.post('http://localhost:9090/Services/DeleteProject/',
           {'title': title},
           function(project) {
               if (project.results.deleted == "true") {
                   $('#' + title).remove();
                   GetProjects();
                   $("#Messages").append($("<li>").addClass("list-group-item").html("Deleted project " + title));
               }
           });
}

function ProjectSettingsModal(title) {
    $('#modal-header-title').html(title);
}

function ProjectUploadFolder(event) {
    event.preventDefault();
    var data = event.dataTransfer.getData("text");
    data = data.split("\n");
    var filename = null;
    for (d in data) {
        $('#list_projectfiles')
            .append($("<div>").addClass("input-group projectfilepath").attr("id", "filename" + d)
                .append($("<span>").addClass("input-group-addon glyphicon glyphicon-file"))
                .append($("<input>").prop("type", "text").prop("disabled", true).addClass("form-control").val(data[d]))
                .append($("<span>").addClass("input-group-addon btn btn-default glyphicon glyphicon-remove")
                    .on("click", function() {
                        console.log("Remove");
                        $(this).parent().remove();
                    })
                ).css("padding-bottom", "1em"));
            
            
            //.html(data[d]));
    }
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