function SelectTest(testdivname) {
    var div = $('#' + testdivname);
    var divbox = div.find("input.checkbox")[0];
    if (divbox.checked === true) {
        div.removeClass("panel-default");
        div.addClass("panel-primary");
    }
    else {
        div.removeClass("panel-primary");
        div.addClass("panel-default");
    }
}