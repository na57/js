function newBtnGroup(id) {
    return $("<div></div>").addClass("btn-group").attr("id", id);
}

function newABtn(text) {
    return newA().addClass("btn").text(text);
}

function UserIcon() {
    return $("<i></i>").addClass("icon-user");
}

function StarIcon(){
    return $("<i></i>").addClass("icon-star");
}

function StarEmptyIcon() {
    return $("<i></i>").addClass("icon-star-empty");
}

function newDropdownMenu(onMenuCreating) {
    var menu = $("<ul></ul>").addClass("dropdown-menu");
    onMenuCreating(menu);
    return menu;
}

function newCaret() {
    return $("<span></span>").addClass("caret");
}

function newCaretDropdownToggle() {
    var a = newA("#").addClass("btn").addClass("dropdown-toggle").attr("data-toggle", "dropdown");
    a.append(newCaret());
    return a;
}

function Icon(cssClass) {
    return $("<i></i>").addClass(cssClass);
}

function IconPlus() {
    return Icon("icon-plus");
}

var B = function () { };
B.li = function () {
    return $('<li/>');
};
B.a = function () { return $('<a/>').attr('href', '#'); };
B.ul = function () { return $('<ul/>'); };
B.span = function () { return $('<span/>'); };
B.div = function () { return $('<div/>'); };
B.label = function () { return $('<label/>'); };
B.tr = function () { return $('<tr/>'); };
B.td = function () { return $('<td/>'); };
B.th = function () { return $('<th/>'); };
B.select = function () { return $('<select/>'); };
B.option = function () { return $('<option/>'); };
B.input = function () { return $('<input/>'); };


B.divControlGroup = function () { return B.div().addClass('control-group'); };
B.labelControlLabel = function () { return B.label().addClass('control-label'); };
B.divControls = function () { return B.div().addClass('controls'); };
B.spanLabel = function () { return B.span().addClass('label'); };
B.spanLabelSuccess = function () { return B.span().addClass('label label-success'); };
B.spanLabelWarning = function () { return B.span().addClass('label label-warning'); };
B.spanLabelImportant = function () { return B.span().addClass('label label-important'); };
B.spanLabelInfo = function () { return B.span().addClass('label label-info'); };
B.spanLabelInverse = function () { return B.span().addClass('label label-inverse'); };

