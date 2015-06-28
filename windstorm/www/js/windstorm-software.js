
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
               console.log(data.results.project.title);
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
                '<div id="Warn_NoProject" class="alert alert-warning" role="alert"><span class="glyphicon glyphicon-warning-sign"></span> No projects found. <a href="#" data-toggle="modal" data-target="#AddNewSoftware">Click here to add one</a> </div>'
            );
        }
    }
}

function AppendProjectPanel(title) {
    $('#ProjectListingDiv').prepend($("<div>").addClass("panel panel-primary").attr("id", title)
        .append($("<div>").addClass("panel-heading").append($("<span>").html(title + " ")).append($("<span>").addClass("glyphicon glyphicon-remove").on("click", function() { 
            DeleteSoftware(title);
        } )))
        .append($("<div>").addClass("panel-body").append(GenerateSoftwareSummary())));
}

function DeleteSoftware(title) {
    $.post('http://localhost:9090/Services/DeleteProject/',
           {'title': JSON.stringify(title)},
           function(project) {
               console.log(project);
               console.log(project.results);
               if (project.results.deleted == "true") {
                   $('#' + title).remove();
                   GetProjects();
               }
               else {
               }
           }
    );
    
    
}

function GenerateSoftwareSummary() {
    /**
    <div class="media">
  <div class="media-left media-middle">
    <a href="#">
      <img class="media-object" src="..." alt="...">
    </a>
  </div>
  <div class="media-body">
    <h4 class="media-heading">Middle aligned media</h4>
    ...
  </div>
</div>
**/
    return $("<div>").addClass("media")
        .append($("<div>").addClass("media-left media-middle")
            .append($("<a>").attr("href", "#")
                .append("<img>").addClass("media-object").attr({"src": "...", "alt": "..."})));
}