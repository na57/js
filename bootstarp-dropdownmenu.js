/******* MenuItem 类 ******************************************************************************************************************/
/*
参考手册: #8
*/ 

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
    //menuA.prepend($('<i></i>').addClass('icon-star'));

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
                    opts.changed();
                }).fail(function () { alert('fail'); a.text('添加星标'); });
            } else {
                sm.dontSay(a.attr('statementId')).done(function (data) {
                    if (data.SaidCount == 0) {
                        $('#' + a.attr('menuId')).remove();
                    } else {
                        a.text('添加星标');
                        a.attr('nagu-said-status', !a.attr('nagu-said-status'));
                    }
                    opts.changed();
                }).fail(function () { alert('fail'); a.text('删除星标'); });
            }
            
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

MenuItem.getDirectMI = function (text, url) {
    return new MenuItem({
        text: text,
        click: function () {
            window.location = url;
        }
    });
};

// 根据Concept的type，返回相应的菜单项
MenuItem.getTypeMIs = function (conceptId, options) {
    var dtd = $.Deferred();
    var mis = new Array();
    if(conceptId === undefined){
        dtd.resolve(mis);
    } else {
        Nagu.CM.get(conceptId).done(function (concept) {
            $.each(concept.TypeFss, function (i, typeFs) {
                var typeId = typeFs.Object.ConceptId;
                if (typeId == Nagu.Concepts.NaguConcept) return;

                if (MenuItem.TypeMIFunctions[typeId] !== undefined) {
                    var mi = MenuItem.TypeMIFunctions[typeId](conceptId, options);
                    mis.push(mi);
                }
            });

            // 若当前Concept无任何特殊显示的类型，则添加默认菜单
            if (mis.length == 0) {
                var miGo = MenuItem.TypeMIFunctions[Nagu.Concepts.NaguConcept](conceptId);
                mis.push(miGo);
            }
            dtd.resolve(mis);
        }).fail(function () { dtd.resolve(mis) });
    }
    return dtd.promise();
};

MenuItem.TypeMIFunctions = new Array();
MenuItem.TypeMIFunctions[Nagu.Concepts.NaguConcept] = function(conceptId){
    var miGo = MenuItem.getDirectMI('详细信息', '/apps/public/concept.html?id=' + conceptId);
    return miGo;
};

MenuItem.TypeMIFunctions[Nagu.Concepts.Article] = function(conceptId, options){
    var defaults = {
        articleShowDialog: new ArticleShowDialog()
    };
    var opts = $.extend(defaults,options);

    return new MenuItem({
        text: '查看内容',
        click: function () {
                opts.articleShowDialog.toggle(conceptId);
        }
    });
};

MenuItem.TypeMIFunctions[Nagu.Concepts.NaguImage] = function (conceptId, options) {
    var defaults = {
        imageShowDialog: new ImageShowDialog()
    };
    var opts = $.extend(defaults, options);

    return new MenuItem({
        text: '查看图片',
        click: function () {
            opts.imageShowDialog.toggle(conceptId);
        }
    });
};

/******* Menu 类 ******************************************************************************************************************/
function Menu(menuItems, options) {
    this.items = menuItems;

    var defaults = {
        text: "菜单名称",
        showCaret: false,
        appended: function (li, a, ul) { },
        renderContainer: function (id) {
            return newTag('li', { id: id }).addClass('dropdown');
        },
        ulItems: newTag('ul').addClass('dropdown-menu')
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};

Menu.prototype.appendTo = function (placeHolder) {
    var menuId = 'menu' + randomInt();
    var menuLi = this.opts.renderContainer(menuId);

    var togglerA = newA().text(this.opts.text).addClass('dropdown-toggle');
    togglerA.attr('href', '#' + menuId).attr('data-toggle', 'dropdown');
    if (this.opts.showCaret) togglerA.append(newTag('b').addClass('caret'));

    var ulItems = this.opts.ulItems

    var ulId = 'ul_' + randomInt();
    $.each(this.items, function (i, item) {
        item.appendTo(ulItems);
    });

    menuLi.append(togglerA).append(ulItems);
    placeHolder.append(menuLi);
    this.opts.appended(menuLi, togglerA, ulItems);
}

Menu.prototype.insert = function (menuItem) {
    menuItem.appendTo(this.opts.ulItems);
};



$.fn.conceptMenu = function (menuItems, options) {
    var defaults = {
        text: "菜单名称",
        showCaret: false,
        showToggler: true,
        rendered: function (ph, toggler, ulItems) { }
    };
    // Extend our default options with those provided.    
    opts = $.extend(defaults, options);

    var ph = $(this).addClass('dropdown');
    if (ph.attr('id') === undefined || ph.attr('id') == "")
        ph.attr('id', 'menuId' + randomInt());
    var menuId = ph.attr('id');

    if (opts.showToggler) {
        var togglerA = newA().text(opts.text).addClass('dropdown-toggle');
        togglerA.attr('href', '#' + menuId).attr('data-toggle', 'dropdown');
        if (opts.title) togglerA.attr('title', opts.title);
        if (opts.showCaret) togglerA.append(newTag('b').addClass('caret'));
        ph.append(togglerA);
    }

    var ulItems = newTag('ul').addClass('dropdown-menu');

    //alert( ph.attr('id'));
    $.each(menuItems, function (i, item) {
        item.appendTo(ulItems);
    });

    ph.append(ulItems);
    $(".dropdown-toggle").dropdown();
    opts.rendered(ph, togglerA, ulItems);
};


$.fn.btnSay = function (statementId, options) {
    var defaults = {
        sayText: '添加星标',
        dontSayText: '删除星标',
        click: function () {
            var a = $(this);
            var statementId = a.attr('statementId');
            var sm = new SayManager();
            if (a.attr('nagu-said-status') == 'true') {
                sm.dontSay(statementId).done(function (data) {
                    a.btnSay(statementId, options);

                    if (data.SaidCount == 0) a.remove();
                    else opts.changed(data);
                }).fail(function () { alert('fail'); });
            } else {
                sm.say(a.attr('statementId')).done(function (data) {
                    a.btnSay(statementId, options);
                    opts.changed(data);
                }).fail(function () { alert('fail'); });
            }
        },
        changed: function (data) { }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var ph = $(this);
    ph.attr('statementId', statementId).addClass('btn');
    ph.unbind('click').click(opts.click);

    var saym = new SayManager();
    saym.status(statementId).done(function (data) {
        ph.attr('nagu-said-status', data.HasSaid);
        if (data.HasSaid) {
            ph.text(opts.dontSayText).prepend(Icon('icon-star-empty'));
            ph.addClass('btn-danger');
        } else {
            ph.text(opts.sayText).prepend(Icon('icon-empty'));
            ph.removeClass('btn-danger');
        }
    });
    return ph;

}