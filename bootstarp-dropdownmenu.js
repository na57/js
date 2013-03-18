/******* MenuItem 类 ******************************************************************************************************************/
function MenuItem(options) {
    var defaults = {
        text: "菜单项名称",
        click: function () { },
        rendered: function (li, a) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};

MenuItem.prototype.render = function (options) {
    var menuA = newA().text(this.opts.text);
    menuA.click = this.opts.click;

    var menuLi = newLi();
    menuLi.append(menuA);

    this.opts.rendered(menuLi, menuA);
    return menuLi;
}













/******* Menu 类 ******************************************************************************************************************/
function Menu(menuItems, options) {
    this.items = menuItems;
    
    var defaults = {
        text: "菜单名称",
        showCaret: false,
        rendered: function (li, a) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};

Menu.prototype.render = function (options) {
    var menuId = 'menu' + randomInt();
    var menuLi = newTag('li', { class: 'dropdown', id: menuId });

    var togglerA = newA().text(this.opts.text).addClass('dropdown-toggle');
    togglerA.attr('href', '#' + menuId).attr('data-toggle', 'dropdown');
    if (this.opts.showCaret) togglerA.append(newTag('b', { class: 'caret' }));

    menuLi.append(togglerA);

    var ulItems = newTag('ul', { class: 'dropdown-menu' });
    $.each(this.items, function (i, item) {
        ulItems.append(item.render());
    });

    menuLi.append(ulItems);
}