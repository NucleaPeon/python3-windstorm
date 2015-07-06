$(document).on("ready", function() {
    $("#AddTestSuite").on("shown.bs.modal", function() {
        $('#tsname').focus();
        var func = $(document).keypress(function(e) {
            if(e.which == 13) {
                $('#SaveTestSuite').click();
                $("#tsname").val("");
                $('#AddTestSuite').modal("hide");
            }
        });
    });
    $("#AddTestSuite").on("hidden.bs.modal", function() {
        delete $(document).keypress();
        $("#tsname").val("");
    });
});

function SelectTest(testdivname) {
    var div = $('#' + testdivname);
    var divbox = div.find("input.checkbox")[0];
    var divlbl = $('#TestDivLbl');
    if (divbox.checked === true) {
        div.removeClass("panel-default");
        div.addClass("panel-primary testsuite-active");
        divlbl.removeAttr("disabled");
    }
    else {
        div.removeClass("panel-primary testsuite-active");
        div.addClass("panel-default");
        divlbl.prop("disabled", true);
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

function SaveTestSuite() {
    /**
     * 
     
    <div class="panel-heading">
        <div class="input-group">
            <span class="input-group-addon">
                <input class="checkbox" type="checkbox" aria-label="..." onclick='SelectTest("TestDiv");'>
                <!-- On checkbox check, add panel-primary class. On uncheck, remove class -->
            </span>
            <input id="TestDivLbl" type="text" class="text form-control" aria-label="..." placeholder="Test Suite Name" disabled="disabled">
        </div><!-- /input-group -->
    </div>
    <div class="panel-body">
        <ul class="list-group">
            <li class="list-group-item">
                <span class="badge">0</span>
                <a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion2" href="#collapseOne">
                    Test Entity (Unittest File?)
                </a>
                <div class="accordion" id="accordion2">
                    <div class="accordion-group">
                        <div id="collapseOne" class="accordion-body collapse">
                            <div class="accordion-inner">
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
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
**/
    var testsuitename = "TestDiv";
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
                    )
                )
            )
        );
    
}