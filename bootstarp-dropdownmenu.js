/******* MenuItem 类 ******************************************************************************************************************/
/*
参考手册: #8: https://github.com/na57/js/issues/8
*/ 

function MenuItem(options) {
    var defaults = {
        text: "菜单项名称",
        click: function () { }, // 菜单项的单击事件
        appended: function (li, a) { } // 菜单项被添加到菜单后发生。
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
        text: '添加/删除星标',
        changed: function () { }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    return new MenuItem({
        text: opts.text,
        click: function () {
            var a = $(this);
            if (a.attr('nagu-said-status') == 'false') {
                Nagu.SayM.say(a.attr('statementId')).done(function (data) {
                    a.text('删除星标');
                    a.attr('nagu-said-status', !a.attr('nagu-said-status'));
                    opts.changed(data);
                }).fail(function () { alert('fail'); a.text('添加星标'); });
            } else {
                Nagu.SayM.dontSay(a.attr('statementId')).done(function (data) {
                    if (data.SaidCount == 0) {
                        $('#' + a.attr('menuId')).remove();
                    } else {
                        a.text('添加星标');
                        a.attr('nagu-said-status', !a.attr('nagu-said-status'));
                    }
                    opts.changed(data);
                }).fail(function () { alert('fail'); a.text('删除星标'); });
            }
            
        },
        appended: function (li, a) {
            a.attr('statementId', statement.StatementId);
            Nagu.SayM.status(statement.StatementId).done(function (data) {
                if (data.HasSaid) {
                    a.text('删除星标').prepend($('<i></i>').addClass('icon-star-empty'));
                } else {
                    a.text('添加星标').prepend($('<i></i>').addClass('icon-star'));
                }
                a.attr('nagu-said-status', data.HasSaid)
            }).fail(function () { alert('get status failed') });
        }
    });
}


MenuItem.getDirectMI = function (text, url) {
    return new MenuItem({
        text: text,
        //click: function () {
        //    window.location = url;
        //}
        appended: function (li, a) {
            a.attr('href', url);
            a.unbind('click');
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

MenuItem.TypeMIFunctions[Nagu.Rdf.Bag] = function (conceptId, options) {
    var defaults = {
        bagShowDialog: new BagShowDialog()
    };
    var opts = $.extend(defaults, options);

    return new MenuItem({
        text: '查看集合项目',
        click: function () {
            opts.bagShowDialog.toggle(conceptId);
        }
    });
};



/******* Menu 类 ******************************************************************************************************************/

/*
 * 参考手册： #11: https://github.com/na57/js/issues/11
 */

function Menu(menuItems, options) {
    this.items = menuItems;

    var defaults = {
        text: "菜单名称",
        showCaret: false,
        appended: function (li, a, ul) { },
        rendered: function (li, a, ul) { },
        renderContainer: function (id) {
            return newTag('li', { id: id }).addClass('dropdown');
        },
        ulItems: newTag('ul').addClass('dropdown-menu')
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};

Menu.prototype.render = function () {
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
    togglerA.dropdown();
    this.opts.rendered(menuLi, togglerA, ulItems);
    return menuLi;
};

Menu.prototype.appendTo = function (placeHolder) {
    var li = this.render().appendTo(placeHolder);
    this.opts.appended(li, li.children('a'), li.children('ul'));
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
            if (a.attr('nagu-said-status') == 'true') {
                Nagu.SayM.dontSay(statementId).done(function (data) {
                    a.btnSay(statementId, options);

                    if (data.SaidCount == 0) {
                        //a.remove();
                        opts.changed(ph, data, opts);
                    }
                }).fail(function () { alert('fail'); });
            } else {
                Nagu.SayM.say(a.attr('statementId')).done(function (data) {
                    a.btnSay(statementId, options);
                }).fail(function () { alert('fail'); });
            }
        },
        changed: function (ph, data, options) {
            ph.addClass('btn')
            if (data.HasSaid) {
                ph.text(options.dontSayText).prepend(Icon('icon-star-empty'));
                ph.addClass('btn-danger');
            } else {
                ph.text(options.sayText).prepend(Icon('icon-empty'));
                ph.removeClass('btn-danger');
            }
        }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var ph = $(this);
    ph.attr('statementId', statementId);
    ph.unbind('click').click(opts.click);

    var saym = new SayManager();
    saym.status(statementId).done(function (data) {
        ph.attr('nagu-said-status', data.HasSaid);
        opts.changed(ph, data, opts);
    });
    return ph;

}