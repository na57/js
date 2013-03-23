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

// 返回一个通用的,用于添加或删除星标的MenuItem对象
MenuItem.getSaidMI = function (statement, options) {
    var defaults = {
        changed: function () { }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    return new MenuItem({
        text: '添加/删除星标',
        click: function () {
            var a = $(this);
            var sm = new SayManager();
            if (a.text() == '添加星标') {
                sm.say(a.attr('statementId')).done(function () {
                    a.text('删除星标');
                    a.attr('nagu-said-status', !a.attr('nagu-said-status'));
                }).fail(function () { alert('fail'); a.text('添加星标'); });
            } else {
                sm.dontSay(a.attr('statementId')).done(function (data) {
                    if (data.SaidCount == 0) {
                        $('#' + a.attr('menuId')).remove();
                    } else {
                        a.text('添加星标');
                        a.attr('nagu-said-status', !a.attr('nagu-said-status'));
                    }
                }).fail(function () { alert('fail'); a.text('删除星标'); });
            }
            opts.changed();
        },
        appended: function (li, a) {
            a.attr('statementId', statement.StatementId);
            var saym = new SayManager();
            saym.status(statement.StatementId).done(function (data) {
                if (data.HasSaid) {
                    a.text('删除星标');
                } else {
                    a.text('添加星标');
                }
                a.attr('nagu-said-status', data.HasSaid)
            }).fail(function () { alert('get status failed') });
        }
    });
}










/******* Menu 类 ******************************************************************************************************************/
function Menu(menuItems, options) {
    this.items = menuItems;

    var defaults = {
        text: "菜单名称",
        showCaret: false,
        appended: function (li, a, ul) { },
        renderContainer: function (id) {
            return newTag('li', { class: 'dropdown', id: id });
        }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};

Menu.prototype.appendTo = function (placeHolder) {
    var menuId = 'menu' + randomInt();
    var menuLi = this.opts.renderContainer(menuId);

    var togglerA = newA().text(this.opts.text).addClass('dropdown-toggle');
    togglerA.attr('href', '#' + menuId).attr('data-toggle', 'dropdown');
    if (this.opts.showCaret) togglerA.append(newTag('b', { class: 'caret' }));

    var ulItems = newTag('ul', { class: 'dropdown-menu' });

    var ulId = 'ul_' + randomInt();
    $.each(this.items, function (i, item) {
        item.appendTo(ulItems);
    });

    menuLi.append(togglerA).append(ulItems);
    placeHolder.append(menuLi);
    this.opts.appended(menuLi, togglerA, ulItems);
}




$.fn.conceptMenu = function (menuItems, options) {
    var defaults = {
        text: "菜单名称",
        showCaret: false,
        showToggler: true,
        rendered: function (ph, toggler, ulItems) { }
    };
    // Extend our default options with those provided.    
    opts = $.extend(defaults, options);

    var ph = $(this);
    var menuId = ph.attr('id');
    if (opts.showToggler) {
        var togglerA = newA().text(opts.text).addClass('dropdown-toggle');
        togglerA.attr('href', '#' + menuId).attr('data-toggle', 'dropdown');
        if (opts.showCaret) togglerA.append(newTag('b', { class: 'caret' }));
        ph.append(togglerA);
    }

    var ulItems = newTag('ul', { class: 'dropdown-menu' });

    //alert( ph.attr('id'));
    $.each(menuItems, function (i, item) {
        item.appendTo(ulItems);
    });

    ph.append(ulItems);
    $(".dropdown-toggle").dropdown();
    opts.rendered(ph, togglerA, ulItems);
};