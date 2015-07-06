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