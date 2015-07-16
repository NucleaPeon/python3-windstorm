$(document).on("ready", function() {
    $("#AddNewSoftware").on("shown.bs.modal", function() {
        $("#SaveSoftwareBtn").on("click", function() {
             SaveProject();
             return false;
        });
        $('#mpname').focus();
        var func = $(document).keypress(function(e) {
            if(e.which == 13) {
                $('#SaveSoftwareBtn').click();
                $('#AddNewSoftware').modal("hide");
                return false;
            }
        });
    });
    
    $("#AddNewSoftware").on("hidden.bs.modal", function() {
        $(document).off("keypress");
        $("#mpname").val("");
        $('#list_projectfiles').empty();
        $("#SaveSoftwareBtn").off("click");
    });
});

function AddProject() {
    $("#AddNewSoftware").modal("show");
}

function SaveProject() {
    var val = $('#mpname').val();
    if ((val == "") || (val === undefined)) {
        // Highlight the field in red background by adding in required class
        return undefined
    }
    if ($("#" + val).length == 0) {
        // TODO: Validation of title
        var projname = $('#mpname').val().replace(" ", "_");
        $.post('http://localhost:9090/Services/SaveProject/', 
            {title: projname},
            function(data) {
                $('#mpname').val('');
                if ($('#Warn_NoProject').length > 0) {
                        $('#Warn_NoProject').remove();
                }
                AppendProjectPanel(data.results);
                $("#Messages").append($("<li>").addClass("list-group-item").html("Saved project " + data.results.title));
                return false;
            }
        );
    }
}

function UpdateProject() {
    // projectfilepath
    // TEMP:
    var items = [];
    var elements = $(".projectfilepath input");
    for (var i=0; i < elements.length; i++) {
        items.push(elements[i].value);
    }
    ////////
    jQuery.ajaxSettings.traditional = true;
    $.post('http://localhost:9090/Services/UpdateProject/',
           {project: $('#modal-header-title').html(),
            files: items,
            description: $('#projectdescription').val()},
           function(data) {
               $("#Messages").append($("<li>").addClass("list-group-item").html("Updated Project" + $('#modal-header-title').html()));
               $("#numberoffiles").val(data.results.files.length);
               $('#list_projectfiles').empty();
               GenFileBlock(data.results.files);
               $("#projectsize").val(data.results.size);
               $('#mediabody' + data.results.title).html(data.results.description);
           },
           "json");
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

function AppendProjectPanel(project) {
    // Check to ensure project doesn't already exist before appending it
    if ($('#' + project.title).length == 0) {
        $('#ProjectListingDiv').prepend($("<div>").addClass("panel panel-primary").attr("id", project.title)
            .append($("<div>").addClass("panel-heading").append($("<span>").html("<b>" + project.title + "</b> ")).append($("<span>").addClass("glyphicon glyphicon-remove").on("click", function() { 
                DeleteSoftware(project.title);
            })).on("click", function() { 
                return false; // Fix for issue where clicking on header invokes body onclick event
            }))
            .append($("<div>").addClass("panel-body").append(
                GenerateSoftwareSummary(project.title, project.description, "Project").on("click", function() { 
                    ProjectSettingsModal(project.title, function() { 
                        GenFileBlock(project.files);
                        $('#SoftwareDetails').modal("show");
                    });
                    return false; // Required to stop modal window from hiding immediately
                }
            )))
            .attr("data-toggle", "modal")
            .attr("data-target", "#SoftwareDetails"));
    }
}

function DeleteSoftware(title) {
    $.post('http://localhost:9090/Services/DeleteProject/',
           {title: title},
           function(project) {
               if (project.results.deleted == "true") {
                   $('#' + title).remove();
                   GetProjects();
                   $("#Messages").append($("<li>").addClass("list-group-item").html("Deleted project " + title));
               }
           });
}

function ProjectSettingsModal(title, callback) {
    console.log("ProjectSettingsModal");
    console.log(title);
    $('#modal-header-title').html(title);
    $.post('http://localhost:9090/Services/GetProject/',
           {name: title},
           function(project) {
               $('#numberoffiles').val(project.results.files.length);
               $('#projectsize').val(project.results.size);
               
           })
    // Get project details based on title
    // fill in files, size and # of files inputs
    callback();
}

function GenFileBlock(data) {
    var filename = null;
    for (d in data) {
        if ((data[d] != "") && (data[d] !== undefined)) {
            $('#list_projectfiles').empty();
            $('#list_projectfiles')
                .append($("<div>").addClass("input-group projectfilepath").attr("id", "filename" + d)
                    .append($("<span>").addClass("input-group-addon glyphicon glyphicon-file"))
                    .append($("<input>").prop("type", "text").prop("disabled", true).addClass("form-control filevalue").val(data[d]))
                    .append($("<span>").addClass("input-group-addon btn btn-default glyphicon glyphicon-remove")
                        .on("click", function() {
                            $(this).parent().remove();
                        })
                    ).css("padding-bottom", "1em"));
        }
    }
}

function ProjectUploadFolder(event) {
    event.preventDefault();
    var data = event.dataTransfer.getData("text");
    data = data.split("\n");
    GenFileBlock(data);
}

function GenerateSoftwareSummary(title, body, heading, image) {
    var img = (image === undefined) ? "/imgs/folder-tar.png" : image;
    var header = (heading === undefined) ? "Untitled Heading" : heading;
    return $("<div>").addClass("media")
        .append($("<div>").addClass("media-left media-middle")
            .append($("<a>").attr("href", "#")
                .append('<img class="media-object" src="' + img + '" alt="' + img + '">')))
        .append($("<div>").addClass("media-body")
            .append($("<h4>").addClass("media-heading").html(header).attr("id", "mediahead" + title))
            .append($("<div>").attr("id", "mediabody" + title).html(body))
        );
}