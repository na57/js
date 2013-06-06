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
