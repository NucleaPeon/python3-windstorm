$(document).on("ready", function() {
    $("#AddTestSuite").on("shown.bs.modal", function() {
        $('#tsname').focus();
        var func = $(document).keypress(function(e) {
            if(e.which == 13) {
                $('#SaveTestSuite').click();
                $('#AddTestSuite').modal("hide");
                return false;
            }
        });
    });
    $("#ProjectSelect").on("shown.bs.modal", function() {
        GetProjects();
        $('#projectloadergif').addClass("hidden");
        
    });
    $("#ProjectSelect").on("hidden.bs.modal", function() {
        $('.progressbar').empty()
    });
    
    $("#AddTestSuite").on("hidden.bs.modal", function() {
        delete $(document).keypress();
        $("#tsname").val("");
    });
});

function GetTestSuites(callback) {
    $.post('http://localhost:9090/Services/GetTestSuites/',
           {},
           function(data) {
             if (callback === undefined) {
                 DisplaySuites(data.results); // remove all items from div then re-add
             }
             else {
                 callback(data); // allow another method to handle returned projects
             }
           }
    );
}

function DisplaySuites(suites) {
    var suitelbls = Object.keys(suites);
    for (var i=0; i < suitelbls.length; i++) {
        AppendTestSuite(suitelbls[i]);
    }
    if (suitelbls.length > 0) {
        $('#Warn_NoSuites').remove();
    }
    else {
        if ($('#Warn_NoSuites').length == 0) {
            $('#NotificationBlock').append(
                '<div id="Warn_NoSuites" class="alert alert-warning" role="alert"><span class="glyphicon glyphicon-warning-sign"></span> No Test Suites found. <a href="#" onclick="AddTestSuite();">Click here to add one</a> </div>'
            );
        }
    }
}

function SelectTest(testdivname) {
    var div = $('#' + testdivname);
    var divbox = div.find("input.checkbox")[0];
    if (divbox.checked === true) {
        div.removeClass("panel-default");
        div.addClass("panel-primary testsuite-active");
    }
    else {
        div.removeClass("panel-primary testsuite-active");
        div.addClass("panel-default");
    }
    if ($('.testsuite-active').length > 0) {
        $('#DeleteTestSuites').removeAttr("disabled");
    }
    else {
        $('#DeleteTestSuites').prop("disabled", true);
    }
}

function AddTestSuite() {
    $("#AddTestSuite").modal("show");
}

function DeleteTestSuites() {
    var suites = $('.testsuite-active');
    var suitelbls = []
    
    for (var i=0; i < suites.length; i++)  {
        suitelbls.push(suites[i].id);
    }
    console.log(suitelbls);
    if (suitelbls.length > 0) {
        jQuery.ajaxSettings.traditional = true;
        $.post('http://localhost:9090/Services/DeleteTestSuites/',
           {"suites": suitelbls},
           function(data) {
               console.log(data);
           });
        suites.remove();
        $('#DeleteTestSuites').prop("disabled", true);
        GetTestSuites();
    }
}

function SaveTestSuite(testsuitename) {
    AppendTestSuite(testsuitename);
}

function Upload(testsuitename) {
    alert("Upload file/folder " + $('#upload' + testsuitename).val());
}

function FileBrowseNotify(testsuitename, filefoldername) {
    alert("Please drag and drop your file or folder into the text input");
}

function GenerateTestTable(testsuitename) {
    return "<br>";
}

function GetProjects() {
    // Return all projects, or display notification that no projects exist
    $.post('http://localhost:9090/Services/GetProjects/',
           {},
           function(data) {
               jQuery.ajaxSettings.traditional = true;
               for (var i=0; i<data.results.length; i++) {
                   var name = data.results[i];
                   if ($('#' + data.results[i]).length == 0) {
                        $("#projectlisting")
                            .append($("<div>").attr("id", name)
                                .append($("<div>").addClass("input-group")
                                    .append($("<span>").addClass("input-group-addon")
                                        .append($("<input>").addClass("checkbox").attr({
                                                "type": "checkbox",
                                                "aria-label": "...",
                                                "id": "include" + name
                                            })
                                        )
                                    )
                                    .append($("<span>").addClass("input-group-addon")
                                        .append($("<span>").html(name))
                                    )
                                    .append($("<span>").addClass("input-group-addon")
                                        .append("<span>").addClass("btn btn-sm btn-default").attr({"refid": "pb" + name,
                                            "project": name})
                                        .html("Update Test Listing")
                                        .on("click", function() {
                                            //$('#ProjectSelect').modal("hide");
                                            if ($('#bar' + $(this).attr("refid")).length < 1) {
                                                $('#' + $(this).attr("refid"))
                                                    .append($("<br>"))
                                                    .append($("<div>").addClass("progress")
                                                        .append($("<div>").addClass("progress-bar progress-bar-info progress-bar-striped active")
                                                            .attr({"role": "progressbar", "aria-valuenow": "100", "aria-valuemin": "0", "aria-valuemax": "100",
                                                                "style": "width: 100%;"})
                                                                .append($("<b>").html("Searching...").attr("id", "txt" + $(this).attr("refid")))
                                                            .append($("<span>").addClass("sr-only").html("0%").attr("id", "bar" + $(this).attr("refid")))
                                                        )
                                                    );
                                                var refid = '#' + $(this).attr("refid");
                                                var plugin = "TestsByFilename";
                                                $.ajax({
                                                    type: "POST",
                                                    url: 'http://localhost:9090/Services/GetProjectPathsByName/',
                                                    data: {name: name},
                                                    success: function(projpaths) {
                                                        var paths = projpaths.results;
                                                        console.log(paths);
                                                        $.ajax({
                                                            type: "POST",
                                                            url: 'http://localhost:9090/Services/LoadTestsByPlugin/',
                                                            data: {
                                                                plugin: plugin,
                                                                path: projpaths.results 
                                                            },
                                                            success: function(data) {
                                                                console.log(data.results);
                                                            },
                                                            dataType: "json"
                                                        }).done(function(data) {
                                                            console.log(data);
                                                            $(refid).empty();
                                                        });
                                                    },
                                                    dataType: "json"
                                                });
                                            }
                                            console.log("Display Tests Button Clicked");
                                            
                                        })
                                    )
                                    .append($("<span>").addClass("input-group-addon")
                                        .append($("<span>").addClass("badge").html(0))
                                    )
                                )
                            )
                            .append($("<div>").attr("id", "pb" + name).addClass("progressbar"));
                    }
                }
            }
    );
}

function AppendTestSuite(testsuitename) {
    /**
        * 
        <!-- Contents here -->
        <center>
            <span class="glyphicon glyphicon-plus"></span> Add &nbsp; <span class="glyphicon glyphicon-remove"></span> Delete
        </center>
        
        <table class="table">
            <tr>
                <td><input type="checkbox" aria-label="..."></td>
                <td><code>Title</code></td>
                <td>
                </td>
            </tr>
            <tr>
            </tr>
        </table>
        <!-- end -->
    **/
    if ($('#' + testsuitename).length == 0) {
        $('#TestSuiteListing')
            .append($("<div>").addClass("panel panel-default testsuite").attr("id", testsuitename)
                .append($("<div>").addClass("panel-heading")
                    .append($("<div>").addClass("input-group")
                        .append($("<span>").addClass("input-group-addon")
                            .append($("<input>").addClass("checkbox").attr({
                                "type": "checkbox",
                                "aria-label": "..."
                            })
                            .on("click", function() { SelectTest(testsuitename); } ))
                        )
                        .append($("<input>").attr({
                            "id": testsuitename + "Lbl",
                            "type": "text",
                            "placeholder": "Test Suite Name",
                            "disabled": "disabled"
                        }).val(testsuitename).addClass("text form-control"))
                    )
                )
                .append($("<div>").addClass("panel-body")
                    .append($("<ul>").addClass("list-group")
                        .append($("<li>").addClass("list-group-item")
                            .append($("<span>").addClass("badge").html(0))
                            .append($("<span>").addClass("glyphicon glyphicon-tasks").html("&nbsp;"))
                            .append($("<a>").addClass("accordion-toggle").attr({
                                "data-parent": "#accordion2",
                                "data-toggle": "collapse",
                                "href": "#collapseOne"
                            }).html('Test Listings ')).append("&nbsp; &nbsp;").append($("<div>").addClass("btn-group").attr("role", "group")
                                .append($("<div>").addClass("input-group")
                                    .append($("<span>").addClass("input-group-addon")
                                        .append($("<input>").addClass("checkbox").attr({
                                                "type": "checkbox",
                                                "aria-label": "...",
                                                "id": "update" + testsuitename
                                            })
                                        )
                                    )
                                    .append($("<span>").addClass("input-group-addon")
                                        .append($("<span>").html("Update Tests on Run"))
                                    )
                                    .append($("<span>").addClass("input-group-addon")
                                        .append("<span>").addClass("btn btn-default").html("Add Tests From...")
                                        .on("click", function() {
                                            $('#ProjectSelect').modal("show");
                                        })
                                    )
                                )
                            )
                            .append($("<div>").addClass("accordion").attr("id", "accordion2")
                                .append($("<div>").addClass("accordion-group")
                                    .append($("<div>").addClass("accordion-body collapse").attr("id", "collapseOne")
                                        .append($("<div>").addClass("accordion-inner")
                                            .append(GenerateTestTable(testsuitename))
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );
    }
}

function UploaderSettings() {
    console.log("TODO");
}

function GetListOfPlugins() {
    $.ajax({
        type: "POST",
        url: 'http://localhost:9090/Services/GetListOfPlugins/',
        data: {},
        success: function(data) {
            console.log(data.results);
        },
        dataType: "json"
    });
}

function LoadTestsByPlugin() {
    $.ajax({
        type: "POST",
        url: 'http://localhost:9090/Services/LoadTestsByPlugin/',
        data: {},
        success: function(data) {
            console.log(data.results);
        },
        dataType: "json"
    });
    
    $.ajax({
        type: "POST",
        url: 'http://localhost:9090/Services/LoadTestsByPlugin/',
        data: {plugin: "TestsByFilename"},
        success: function(data) {
            console.log(data.results);
        },
        dataType: "json"
    });
}

function GetProjectPathsByName(name) {
    console.log(name);
    $.ajax({
        type: "POST",
        url: 'http://localhost:9090/Services/GetProjectPathsByName/',
        data: {name: name},
        success: function(projpaths) {
            console.log(projpaths.results);
        },
        dataType: "json"
    }).done(function(data) {
    });
}