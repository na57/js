/******* MenuItem 类 ******************************************************************************************************************/
function MenuItem(options) {
    var defaults = {
        text: "菜单项名称",
        click: function () { },
        appended: function (li, a) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};

MenuItem.prototype.appendTo = function (placeHolder) {
    var menuA = newA().text(this.opts.text);
    menuA.click(this.opts.click);

    var menuLi = newLi();
    menuLi.append(menuA);
    placeHolder.append(menuLi);

    this.opts.appended(menuLi, menuA);
}











/******* Menu 类 ******************************************************************************************************************/
function Menu(menuItems, options) {
    this.items = menuItems;
    
    var defaults = {
        text: "菜单名称",
        showCaret: false,
        appended: function (li, a, ul) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};

Menu.prototype.appendTo = function (placeHolder) {
    var menuId = 'menu' + randomInt();
    var menuLi = newTag('li', { class: 'dropdown', id: menuId });

    var togglerA = newA().text(this.opts.text).addClass('dropdown-toggle');
    togglerA.attr('href', '#' + menuId).attr('data-toggle', 'dropdown');
    if (this.opts.showCaret) togglerA.append(newTag('b', { class: 'caret' }));

    var ulItems = newTag('ul', { class: 'dropdown-menu' });
    $.each(this.items, function (i, item) {
        item.appendTo(ulItems);
    });

    menuLi.append(togglerA).append(ulItems);
    placeHolder.append(menuLi);
    this.opts.appended(menuLi, togglerA, ulItems);
}