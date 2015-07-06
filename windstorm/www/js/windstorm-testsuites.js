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
           {"suites": ["Test"]},
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
                            .append($("<a>").addClass("accordion-toggle").attr({
                                "data-parent": "#accordion2",
                                "data-toggle": "collapse",
                                "href": "#collapseOne"
                            }).html("Test Entity (Unittest File?)")).append("&nbsp;")
                            .append($("<div>").addClass("accordion").attr("id", "accordion2")
                                .append($("<div>").addClass("accordion-group")
                                    .append($("<div>").addClass("accordion-body collapse").attr("id", "collapseOne")
                                        .append($("<div>").addClass("accordion-inner")
                                            .append("<span>Hello World!</span>")
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