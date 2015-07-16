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
        $('#accept_ts_btn').off("click");
    });
    
    $("#AddTestSuite").on("hidden.bs.modal", function() {
        $(document).off("keypress");
        $("#tsname").val("");
    });
    
    $("#RunTestModal").on("shown.bs.modal", function() {
        $('#run').on("click", function() {
            StartRunTests();
        });
    });
    
    $("#RunTestModal").on("hidden.bs.modal", function() {
        $('#run').off("click");
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
    if (suitelbls.length > 0) {
        jQuery.ajaxSettings.traditional = true;
        $.post('http://localhost:9090/Services/DeleteTestSuites/',
           {"suites": suitelbls,
            "group": "TestTestGroup"},
           function(data) {
               console.log("TODO");
               console.log(data);
           });
        suites.remove();
        $('#DeleteTestSuites').prop("disabled", true);
        GetTestSuites();
    }
}

function SaveTestSuite(testsuitename) {
    if ($('#tsname').val() != "") {
        $.post('http://localhost:9090/Services/SaveTestSuite/',
            {suite: testsuitename},
            function(data) {
                GetTestSuites();
            });
    }
}

function Upload(testsuitename) {
    alert("Upload file/folder " + $('#upload' + testsuitename).val());
}

function FileBrowseNotify(testsuitename, filefoldername) {
    alert("Please drag and drop your file or folder into the text input");
}

function GetProjects() {
    // Return all projects, or display notification that no projects exist
    $.post('http://localhost:9090/Services/GetProjects/',
           {},
           function(data) {
               jQuery.ajaxSettings.traditional = true;
               for (var i=0; i<data.results.length; i++) {
                   var name = data.results[i].title;
                   if ($('#projdata' + name).length == 0) {
                        $("#projectlisting")
                            .append($("<div>").attr("id", "projdata" + name).addClass("projectdata col-md-12")
                                .append($("<div>").addClass("input-group")
                                    .append($("<span>").addClass("input-group-addon")
                                        .append($("<input>").addClass("checkbox").attr({
                                                "type": "checkbox",
                                                "id": "include" + name,
                                                "proj": name
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
                                                CountTestsForProject(name, function() {
                                                    $(refid).empty();
                                                });
                                                
                                            }
                                        })
                                    )
                                    .append($("<span>").addClass("input-group-addon")
                                        .append($("<span>").addClass("badge").attr("id", "badge" + name).html(0))
                                    )
                                )
                            )
                            .append($("<div>").attr("id", "pb" + name).addClass("progressbar"));
                    }
                }
            }
    );
}

function CountTestsForProject(name, callback) {
    /**
     * Function that updates modal window test counts for a project
     * based on name.
     * 
     * Callback argument is optional; if supplied, it will call
     * the method with the number of tests it found as the first parameter
     * and list of test names as second.
     */
    jQuery.ajaxSettings.traditional = true;
    $.ajax({
        type: "POST",
        url: 'http://localhost:9090/Services/GetProjectsByName/',
        data: {name: name},
        success: function(project) {
            $.ajax({
                type: "POST",
                url: 'http://localhost:9090/Services/LoadTestsByPlugin/',
                data: {
                    plugin: project.results.plugin,
                    path: project.results.files
                },
                success: function(data) {
                    $('#badge' + name).html(data.results.length);
                    if (callback !== undefined) {
                        callback(data.results.length, data.results);
                    }
                },
                dataType: "json"
            });
        },
        dataType: "json"
    });
}

function AppendTestSuite(testsuitename) {
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
                            .append($("<span>").addClass("badge").attr("id", "badge" + testsuitename).html(0))
                            .append($("<span>").addClass("glyphicon glyphicon-tasks").html("&nbsp;"))
                            .append($("<a>").addClass("accordion-toggle").attr({
                                "data-parent": "#accordion"  + testsuitename,
                                "data-toggle": "collapse",
                                "href": "#collapse" + testsuitename
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
                                            // Add accept button event to update test values
                                            $('#accept_ts_btn').on("click", function() {
                                                UpdateProjectTests(testsuitename);
                                            })
                                        })
                                    )
                                    .append($('<span disabled="disabled">').addClass("input-group-addon btn btn-success").html("Run Tests").css("color", "white")
                                    .attr({"id": "runtests" + testsuitename, "proj": testsuitename})
                                    .on("click", function() {
                                        $('#runtesttitle').html($(this).attr("proj"));
                                        $('#RunTestModal').modal("show");
                                    }))
                                    .append($('<span disabled="disabled">').addClass("input-group-addon btn btn-success glyphicon glyphicon-play")
                                        .attr({"id": "runtestsauto" + testsuitename, "proj": testsuitename})
                                        .on("click", function() {
                                            $('#runtesttitle').html($(this).attr("proj"));
                                            $('#runtestsauto' + testsuitename).attr({"disabled": "disabled"})
                                            StartRunTests();
                                        })
                                    )
                                )
                            )
                            .append($("<div>").addClass("accordion").attr("id", "accordion" + testsuitename)
                                .append($("<div>").addClass("accordion-group")
                                    .append($("<div>").addClass("accordion-body collapse").attr("id", "collapse" + testsuitename)
                                        .append($("<div>").addClass("accordion-inner").attr("id", "tstests" + testsuitename)
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

function UpdateProjectTests(testsuitename, successcb) {
    /**
     * Invoked when the user clicks "accept" button in modal window
     * for adding in project and additional tests into the suite.
     * 
     * Updates project information from the modal window, specifically
     * the checked projects and any additional tests dragged into the
     * drop element.
     * 
     * If a project is selected for inclusion of its tests into the 
     * suite, it will count the tests for the project and add them
     * into badges (refreshes all tests) and hides modal window.
     * 
     * Requests a refreshed test view on the main testsuite web page
     * in the suite's accordion elements.
     */
    var projects = $('#projectlisting').children();
    var testsFromProjects = 0;
    var projid = null;
    var checked = [];
    
    var checkprojects = function(current_checked, callback) {
        if ($(".projectdata .checkbox:checked").length >= current_checked) {
            callback();
        }
    }
    
    var success = function(checked, testsuitename) {
        $.post("http://localhost:9090/Services/UpdateTestSuite/",
            {projects: checked,
            suite: testsuitename},
            function(data) {
            },
            "json"
        ).done(function(data) {
            RefreshTestViewInSuite(testsuitename);
        });
    }
    
    var updateproject = function(project) {
        checked.push(project.attr("proj"));
        CountTestsForProject(project.attr("id"), function(testCount, tests) {
            testsFromProjects += Number(testCount)
            $("#badge" + project.attr("id")).html(testCount);
            $('#badge' + testsuitename).html(testsFromProjects);
            $('#ProjectSelect').modal("hide");
            $('#tests' + testsuitename).append("Test");
            checkprojects(checked.length, function() { 
                if (successcb === undefined) {
                    success(checked, testsuitename);    
                } else {
                    successcb(checked, testsuitename)
                }
            });
        });
    }
    
    var checkeditems = $(".projectdata .checkbox:checked")
    for(var i=0; i < checkeditems.length; i++) {
        updateproject($(checkeditems[i]));
    }
    

}

function RefreshTestViewInSuite(testsuitename) {
    $.ajax({
        type: "POST",
        url: 'http://localhost:9090/Services/GetTestsBySuiteName/',
        data: {
            suite: testsuitename
        },
        success: function(data) {
            $("#tstests" + testsuitename).empty().append($("<br>"));
            var testcount = 0;
            var testlist = null;
            for (var i=0; i<data.results.projects.length; i++) {
                CountTestsForProject(data.results.projects[i], function(numtests, tests) {
                    testcount += Number(numtests);
                    testlist = [];
                    for (var j=0; j < tests.length; j++) {
                        testlist.push($("<li>").addClass("list-group-item").html(tests[j]))
                    }
                    $('#tstests' + testsuitename)
                        .append($("<div>").addClass("panel panel-default")
                            .append($("<div>").addClass("panel-heading")
                                .append($("<h3>").addClass("panel-title").html(data.results.projects[i]))
                                .on("click", function() {
                                    
                                    $('#collapse' + testsuitename + data.results.projects[i]).collapse('toggle');
                                })
                            )
                            .append($("<div>").addClass("accordion panel-body").attr("id", testsuitename + data.results.projects[i])
                                    .append($("<div>").addClass("in collapse accordion-group accordion-body")
                                    .attr("id", "collapse" + testsuitename + data.results.projects[i])
                                            .append($("<ul>").addClass("list-group")
                                                    .append(testlist)
                                            )
                                    )
                                )
                        );
                    $('#badge' + testsuitename).html(testcount);
                    if (testcount > 0) {
                        $('#runtests' + testsuitename).removeAttr('disabled');
                        $('#runtestsauto' + testsuitename).removeAttr('disabled');
                    }
                });
            }
            for (var i=0; i<data.results.additional.length; i++) {
                console.log("TODO");
                console.log(data.results.additional[i]);
            }
            $('#collapse' + testsuitename).collapse('show');
        },
        dataType: "json"
    });
}

function StartRunTests(completecallback) {
    $('#testprogress').empty();
    $('#run').attr({"disabled": "disabled"});
    var testsuitename = $('#runtesttitle').html();
    var oncomplete = function() {
        console.log("Testing complete");
    }
    
    if ((testsuitename !== undefined) && (testsuitename != "")) {
        $('#testprogress')
            .append($("<hr>"))
            .append($("<br>"))
            .append($("<div>").addClass("progress")
                .append($("<div>").addClass("progress-bar").attr({
                    "role": "progressbar", "aria-valuenow": "0", "aria-valuemin": "2",
                    "aria-valuemax": "100", "style": "width: 0%;", "id": "run_single"
                }).css("color", "black"))
             )
            .append($("<div>").addClass("progress")
                .append($("<div>").addClass("progress-bar").attr({
                    "role": "progressbar", "aria-valuenow": "0", "aria-valuemin": "2",
                    "aria-valuemax": "100", "style": "width: 0%;", "id": "run_overall"
                }).css("color", "white"))
             );
            
        // Define async callback methods for "synchronous-like" functionality loops
        var runtest = function(tests, totaltests, callback, success) {
            if (tests.length <= 0) {
                $('#run_overall').css("width",  "100%");
                $("#run").removeAttr("disabled");
                $('#runtestsauto' + testsuitename).removeAttr("disabled")
                console.log("Preparing to call success()");
                if (success !== undefined) {
                    console.log("Calling success callback");
                    success();
                }
                else {
                    return;
                }
            }
            else {
                $('#run_single').attr("aria-valuenow", 50);
                $('#run_single').css("width",  "50%");
                /**
                * tests: list of filename/paths to test modules
                * totaltests: length of every test module being run (does not change)
                * callback: function to call once one test module has run
                */
                $.post("http://localhost:9090/Services/RunTest/",
                    {test: tests[0]},
                    function(data) {
                        $('#run_overall').attr("aria-valuenow", Number($('#run_overall').attr("aria-valuenow")) + 1);
                        $('#run_overall').css("width",  ((Number($('#run_overall').attr("aria-valuenow"))/Number($('#run_overall').attr("aria-valuemax"))) * 100) + "%");
                        $('#run_overall').html(tests[0]);
                        $('#run_single').attr("aria-valuenow",  0);
                        $('#run_single').css("width",  "0%");
                    },
                    "json"
                ).done(function(data) {
                    console.log("Finished running test");
                    // Recall this method but with the first element chopped. This means
                    // our width will increase based on its equation until it reaches 100.
                    $('#run_single').attr("aria-valuenow",  100);
                    $('#run_single').css("width",  "100%");
                    callback(tests.slice(1), totaltests, callback, success);
                });
            }
        };
        
        // Start running tests
        $.post("http://localhost:9090/Services/GetSuiteTestFilenames/",
            {suite: testsuitename}, /** FIXME: Hardcode for now **/
            function(testdata) {
                // Calculate total tests
                var total = 0;
                for(var suite in testdata.results) {
                    for(var project in testdata.results[suite]) {
                        total += testdata.results[suite][project].length;
                    }
                }
                $('#run_overall').css("width", "0%");
                $('#run_overall').attr("aria-valuemax", total);
                // PROBLEM AREA: Loops are spamming runtest requests. It should start
                // as one request which leads into others.
                
                var run_project_tests = function(tests, success) {
                    console.log("run projects");
                    for(var t in tests) {
                        runtest(tests[t], t.length, runtest, oncomplete);
                    }
                };
                
                var run_suites = function(suites, success) {
                    console.log("run_suites");
                    for(var s in suites) {
                        run_project_tests(suites[s]);
                    }
                }
                console.log("Starting to run tests from GetSuiteTestFilenames");
                run_suites(testdata.results);
            },
            "json"
        );
    }
}

function TestGroupTestsByFilename() {
}