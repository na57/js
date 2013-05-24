/*
预先定义的selector:
.logged                     只能在用户已登录的情况下显示的内容

.nagu-said-status           显示Concept的said状态
                            DOM结构为：<i StatementId />

.nagu-said-status-toogler   用于转换Concept星标状态的button或a
                            DOM结构为：<button StatementId />
*/

 

/*
以“dl”的形式显示属性及值

输入参数：
dl: 作为容器的“dl”的jquery对象
property: 属性的ID
values： 属性值语句的JSON数据
*/
function onShowPropertyValue(dl, property, values) {
    if (values.length) {
        var dt = newDt("dt_" + property);
        dl.append(dt);
        getConcept(property).done(function (p) {
            //dt.text(p.FriendlyNames[0]);
            dt.append(newA().text(p.FriendlyNames[0]));
        });
        $.each(values, function (i, v) {
            // 判断person是否位于客体位置：
            if (v.Object.ConceptId == property) {
                getConcept(v.Subject.ConceptId).done(function (vc) {
                    $('#dt_' + property).after(newDd().append(newA().text(vc.FriendlyNames[0])));
                });
            }
            else {
                if (v.Object.ConceptId === undefined) $('#dt_' + property).after(newDd().text(v.Object.Value));
                getConcept(v.Object.ConceptId).done(function (vc) {
                    $('#dt_' + property).after(newDd().append(newA().text(vc.FriendlyNames[0])));
                });
            }
        });
    }
}

/*
将属性及至格式化为语句，以dl的方式显示。

输入参数：
dl: 作为容器的“dl”的jquery对象
property: 属性的ID
values： 属性值语句的JSON数据
*/
function onShowValueAsStatement(dl, property, values) {
    //if (values.length == 0) return;

    var dt = newDt("dt_" + property);
    dl.append(dt);
    var cm = new ConceptManager();
    cm.get(property).done(function (p) {
        dt.append(newA().text(p.FriendlyNames[0]).click(function () {
            $('#dlgAddPropertyValue').attr('propertyId', p.ConceptId);
            $('#dlgAddPropertyValue').find('h3').text('为属性“' + p.FriendlyNames[0] + '”添加属性值');
            $("#dlgAddPropertyValue .alert-error").hide();
            $('#dlgAddPropertyValue').modal('toggle');
        }));
    });
    if (values.length == 0) {
        dl.append(newDd().text('无属性值'));
        return;
    }

    // 显示Value
    $.each(values, function (i, v) {
        findBySP(property, MorphemeType.Concept, NaguConcepts.NaguFormatString).done(function (fs) {
            var dd = newDd();
            $('#dt_' + property).after(dd);
            
            var phSubid = 'c_' + Math.round(Math.random() * 10000000000000);
            var phPreId = 'c_' + Math.round(Math.random() * 10000000000000);
            var phObjId = 'c_' + Math.round(Math.random() * 10000000000000);
            if (fs.length) {

                var t = fs[0].Object.Value.replace(/{subject}/g, '<span id="' + phSubid + '" />');
                var t = t.replace(/{predicate}/g, '<span id="' + phPreId + '" />');
                var t = t.replace(/{object}/g, '<span id="' + phObjId + '" />');
                dd.append(t);

                renderMorpheme2(v.Subject, $('#' + phSubid));
                renderMorpheme2(v.Predicate, $('#' + phPreId));
                renderMorpheme2(v.Object, $('#' + phObjId));

            }
            else {
                var span = newDiv().addClass("well");
                span.append('{ ');
                span.append(newSpan(phSubid));
                span.append(', ');
                span.append(newSpan(phPreId));
                span.append(', ');
                span.append(newSpan(phObjId));
                span.append(' }');
                dd.append(span);

                renderMorpheme2(v.Subject, $('#' + phSubid));
                renderMorpheme2(v.Predicate, $('#' + phPreId));
                renderMorpheme2(v.Object, $('#' + phObjId));
            }
            dd.append(newA().text('»'));

        });
    });
}

/*
显示主体关于指定类型的所有属性和值

输入参数：
ph: 作为容器的jquery对象
subject: 主体ID
sType: 主体的类型
type: 指定类型的ID
show: 指定用于显示属性和值得函数，不指定则默认以“dl”的方式显示。
*/
function renderPropertyValues(ph, subject, sType, type, show) {
    // 显示属性及值：
    propertyValuesFormBaseClass(subject, sType, type).done(function (pvs) {
        ph.empty();
        $.each(pvs, function (i, pv) {
            if (show === undefined) onShowPropertyValue(ph, pv.Key, pv.Value);
            else show(ph, pv.Key, pv.Value);
        });
    }).fail(function () { alert("renderPropertyValues出错啦！"); });
}

/*
初始化搜索Concept的AutoComplete组件
输入参数：
tb: 用于输入的文本框
hidden: 用于存储选择结果的hidden
*/
function initConceptSearch(tb, hidden, source) {
    try {
        tb.autocomplete({
            minLength: 2,
            source: source === undefined ? "/conceptapi/search" : source,
            focus: function (event, ui) {
                tb.val(ui.item.FriendlyNames[0]);
                return false;
            },
            select: function (event, ui) {
                tb.val(ui.item.FriendlyNames[0]);
                hidden.val(ui.item.ConceptId);
                return false;
            }
        }).data("autocomplete")._renderItem = function (ul, item) {
            var fn = item.FriendlyNames[0];
            var desc = item.Descriptions[0] == "" ? "没有描述" : item.Descriptions[0];
            return $("<li></li>")
                    .data("item.autocomplete", item)
                    .append("<a><b>" + fn + "</b>（<em>" + desc + "</em>）</a>")
                    .appendTo(ul);
        };
    } catch (e) {

    }
    
}



/*
添加Concept属性值
输入参数：
subject:
stype:
property:
objectFn:
objectId:
onPropertyValueAdded: 完成属性值添加之后调用的函数，包含一个参数fs，fs为描述被添加的属性值的语句的JSON对象。
*/
function addConceptPropertyValue(subject, stype, propertyId, objectFn, objectId, onPropertyValueAdded) {

    // 如果用户未输入任何字符则返回：
    if (objectId == "" && objectFn == "") {
        return false;
    }

    if (objectId != "" && objectId != null) {
        createStatement(subject, stype, propertyId, objectId, MorphemeType.Concept).done(onPropertyValueAdded);
    }
    else if (objectFn != "") {
        if (window.confirm("还未选定一个Concept作为值，您可以返回重新搜索Concept，或创建新的Concept作为值。\r\n您确定要创建名称为“" + objectFn + "”的新的Concept并作为值吗？")) {
            var objectDesc = prompt("请输入关于\"" + objectFn + "\"的描述信息：");
            createConcept(objectFn, objectDesc).done(function (newc) {
                createStatement(subject, stype, propertyId, newc.ConceptId, MorphemeType.Concept).done(onPropertyValueAdded);
            });
        }
    }
}


/***********************************************************************************************************************************************************/
$.fn.appendMorpheme = function (morpheme) {
    var ph = $(this);
    if (morpheme.ConceptId) {
        return ph.appendConcept(morpheme.ConceptId);
    }
    else if (morpheme.Value)
        return renderLiteral(morpheme, ph);
    else if (morpheme.StatementId) {
        return renderStatement(morpheme, ph);
    }
    var dtd = $.Deferred();
    dtd.reject();
    return dtd.promise();
};

$.fn.appendConcept = function (cid) {
    var ph = $(this);
    var a = newA().append(loadingImg()).appendTo(ph);


    return Nagu.CM.get(cid).done(function (c) {
        a.empty().text(c.FriendlyNames[0]).attr('conceptId', c.ConceptId);
        a.attr('title', c.Descriptions[0]);
    }).fail(function () { a.empty().text('数据加载失败'); });
};

function renderMorpheme2(morpheme, ph) {
    if (morpheme.ConceptId) {
        return ph.appendConcept(morpheme.ConceptId);
    }
    else if (morpheme.Value)
        return renderLiteral(morpheme, ph);
    else if (morpheme.StatementId) {
        return renderStatement(morpheme, ph);
    }
    else return "unknown";
}


function renderLiteral(literal, ph) {
    ph.append(literal.Value);
}


function renderStatement(statement, ph) {
    var sm = new StatementManager();
    return sm.findBySP(statement.Predicate.ConceptId, Nagu.MType.Concept, Nagu.Concepts.NaguFormatString).done(function (fs) {
        var phSubid = 'sub_' + randomInt();
        var phPreId = 'pre_' + randomInt();
        var phObjId = 'obj_' + randomInt();
        if (fs.length) {

            var t = fs[0].Object.Value.replace(/{subject}/g, '<span id="' + phSubid + '" />');
            var t = t.replace(/{predicate}/g, '<span id="' + phPreId + '" />');
            var t = t.replace(/{object}/g, '<span id="' + phObjId + '" />');
            ph.append(t);

            renderMorpheme2(statement.Subject, $('#' + phSubid));
            renderMorpheme2(statement.Predicate, $('#' + phPreId));
            renderMorpheme2(statement.Object, $('#' + phObjId));

        }
        else {
            ph.append('{ ');
            ph.append(newSpan(phSubid));
            ph.append(', ');
            ph.append(newSpan(phPreId));
            ph.append(', ');
            ph.append(newSpan(phObjId));
            ph.append(' }');

            renderMorpheme2(statement.Subject, $('#' + phSubid));
            renderMorpheme2(statement.Predicate, $('#' + phPreId));
            renderMorpheme2(statement.Object, $('#' + phObjId));
        }

    });
}


$.fn.appendStatement = function(statementId){
    var dtd = $.Deferred();

    var ph = $(this);
    var a = newA().append(loadingImg()).appendTo(ph);

    Nagu.SM.get(statementId).done(function (statement) {
        Nagu.SM.findBySP(statement.Predicate.ConceptId, Nagu.MType.Concept, Nagu.Concepts.NaguFormatString).done(function (fs) {
            a.remove();
            var phSubid = 'sub_' + randomInt();
            var phPreId = 'pre_' + randomInt();
            var phObjId = 'obj_' + randomInt();
            if (fs.length) {

                var t = fs[0].Object.Value.replace(/{subject}/g, '<span id="' + phSubid + '" />');
                var t = t.replace(/{predicate}/g, '<span id="' + phPreId + '" />');
                var t = t.replace(/{object}/g, '<span id="' + phObjId + '" />');
                ph.append(t);

                renderMorpheme2(statement.Subject, $('#' + phSubid));
                renderMorpheme2(statement.Predicate, $('#' + phPreId));
                renderMorpheme2(statement.Object, $('#' + phObjId));

            }
            else {
                ph.append('{ ');
                ph.append(newSpan(phSubid));
                ph.append(', ');
                ph.append(newSpan(phPreId));
                ph.append(', ');
                ph.append(newSpan(phObjId));
                ph.append(' }');

                renderMorpheme2(statement.Subject, $('#' + phSubid));
                renderMorpheme2(statement.Predicate, $('#' + phPreId));
                renderMorpheme2(statement.Object, $('#' + phObjId));
            }

            dtd.resolve(ph);

        });
    });
    

    return dtd.promise();
};










$.fn.showStatement = function (statement) {
    var ph = $(this);
    var sm = new StatementManager();
    return sm.findBySP(statement.Predicate.ConceptId, Nagu.MType.Concept, Nagu.Concepts.NaguFormatString).done(function (fs) {
        var phSubid = 'sub_' + randomInt();
        var phPreId = 'pre_' + randomInt();
        var phObjId = 'obj_' + randomInt();
        if (fs.length) {

            var t = fs[0].Object.Value.replace(/{subject}/g, '<span id="' + phSubid + '" />');
            var t = t.replace(/{predicate}/g, '<span id="' + phPreId + '" />');
            var t = t.replace(/{object}/g, '<span id="' + phObjId + '" />');
            ph.append(t);

            renderMorpheme2(statement.Subject, $('#' + phSubid));
            renderMorpheme2(statement.Predicate, $('#' + phPreId));
            renderMorpheme2(statement.Object, $('#' + phObjId));

        }
        else {
            ph.append('{ ');
            ph.append(newSpan(phSubid));
            ph.append(', ');
            ph.append(newSpan(phPreId));
            ph.append(', ');
            ph.append(newSpan(phObjId));
            ph.append(' }');

            renderMorpheme2(statement.Subject, $('#' + phSubid));
            renderMorpheme2(statement.Predicate, $('#' + phPreId));
            renderMorpheme2(statement.Object, $('#' + phObjId));
        }
    });
}



/************* Said状态组件 ******************************************************************************************************************************/
function SaidStatus(sid) {
    this.sid = sid;
}
SaidStatus.prototype.getSpan = function () {
    var icon = StarEmptyIcon().addClass('nagu-said-status').attr('StatementId', this.sid);
    var span = newSpan().addClass('logged hide').append(icon)
    return span;
};
SaidStatus.prototype.initSpan = function () {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象    
    var sm = new SayManager();
    sm.status(this.sid).done(function (fsId, hasSaid) {
        var icon = $('.nagu-said-status[StatementId="' + fsId + '"]');
        if (hasSaid) icon.removeClass('icon-star-empty').addClass('icon-star');
        else icon.removeClass('icon-star').addClass('icon-star-empty');
        dtd.resolve(fsId, hasSaid);
    });
    return dtd.promise();
};

SaidStatus.prototype.initAllSpan = function () {
    $('.nagu-said-status').each(function (i, s) {
        var ss = new SaidStatus($(s).attr('statementid'));
        ss.initSpan();
    });
};

// 初始化said状态
function initSaidStatus(sid, said) {
    var icon = $('.nagu-said-status[StatementId="' + sid + '"]');
    if (said) icon.removeClass('icon-star-empty').addClass('icon-star');
    else icon.addClass('icon-star-empty').removeClass('icon-star');
}






/*
将属性及至格式化为语句，以dl的方式显示。

输入参数：
dl: 作为容器的“dl”的jquery对象
property: 属性的ID
values： 属性值语句的JSON数据
*/
function onShowValueAsStatement2(dl, property, values) {
    if (values.length == 0) return;

    var dt = newDt("dt_" + property);
    dl.append(dt);
    getConcept(property).done(function (p) { dt.append(newA().text(p.FriendlyNames[0])); });

    // 显示Value
    $.each(values, function (i, v) {
        var dd = newDd();
        $('#dt_' + property).after(dd);
        renderMorpheme2(v, dd);
    });
}






/*******用于操作Said状态的Button******************************************************************************************************************/

function SaidStatusButton(sid, onChanged) {
    this.sid = sid;
    this.onchanged = onChanged;

    // 初始化said状态
    var sm = new SayManager();
    sm.status(this.sid).done(function (fsId, hasSaid) {
        var btn = $('.nagu-said-status-toggler');
        if (hasSaid) btn.text('取消星标').one('click', function () { toggleBtnSaidStatus(this.onchanged); });
        else btn.text('加注星标').one('click', function () { toggleBtnSaidStatus(this.onchanged); });
    });
}

// 初始化用于改变said状态的按钮
function initBtnSaidStatus(onChanged) {
    var btn = $('.nagu-said-status-toggler');
    var sid = btn.attr('StatementId');
    var sm = new SayManager();
    btn.unbind('click');
    sm.status(sid).done(function (hasSaid) {
        if (hasSaid) btn.text('取消星标').one('click', function () { toggleBtnSaidStatus(onChanged); });
        else btn.text('加注星标').one('click', function () { toggleBtnSaidStatus(onChanged); });
    });
}

// 改变said状态
function toggleBtnSaidStatus(onChanged) {
    var btn = $('.nagu-said-status-toggler');
    var sid = btn.attr('StatementId');
    var sm = new SayManager();

    btn.unbind('click');
    sm.status(sid).done(function (hasSaid) {
        if (hasSaid) sm.dontSay(sid).done(function () {
            btn.text('加注星标').one('click', function () { toggleBtnSaidStatus(onChanged); });

        });
        else sm.say(sid).done(function () {
            btn.text('取消星标').one('click', function () { toggleBtnSaidStatus(onChanged); });
        });
        initSaidStatus(sid, hasSaid);
        if (onChanged != null) onChanged();
    });
}




























/*******用于显示Statement的列表******************************************************************************************************************/

/*
显示语句列表
注意:只在"li"标签中进行显示.
*/
$.fn.statementList = function (statements, options) {
    var defaults = {
        clearBefore: false,
        createItemContainer: function (statement) {
            return newLi().attr("statementId", statement.StatementId);
        },
        renderItem: function (statement, li) {
            return renderMorpheme2(statement, li).done(function (c) {
                //var ss = new SaidStatus(li.attr('statementId'));
                //li.find('a').prepend(ss.getSpan());
            });
        },
        pageSize: 999999999999,
        startIndex: 0,
        createBtnMore: function (btn, left) {
            if (btn === undefined)
                return newBtn('更多(剩余:' + left + ')>>').addClass('nagu-btn-more');
            else
                return btn.text('更多(剩余:' + left + ')>>');
        }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    var ul = $(this).addClass('nagu-statement-list');

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象  
    var resolvedDeferred = opts.startIndex;

    if (opts.clearBefore) ul.empty();

    // 加入btnMore按钮


    if (opts.btnMore === undefined) {
        if ($(this).find('.nagu-btn-more').size()) {
            opts.btnMore = $(this).find('.nagu-btn-more');
        } else {
            opts.btnMore = opts.createBtnMore().hide();
            ul.append(opts.btnMore);
        }
    }

    // 计算目前剩余多少个statement未显示:
    var left = statements.length - opts.startIndex - opts.pageSize;
    // 更新按钮文本:
    opts.createBtnMore(opts.btnMore, left);


    // 在左侧显示所有语句
    var limit = Math.min(opts.startIndex + opts.pageSize, statements.length);
    for (var i = opts.startIndex; i < limit; i++, opts.startIndex++) {
        // 生成显示框架：li
        var li = opts.createItemContainer(statements[i]);
        
        opts.btnMore.before(li);

        $.when(opts.renderItem(statements[i], li)).then(function () {
            if (++resolvedDeferred == limit) dtd.resolve(statements);
        });
    }

    if (opts.startIndex < statements.length) {
        opts.btnMore.unbind().click(function () {
            opts.clearBefore = false;
            ul.statementList(statements, opts);
        });
        opts.btnMore.show();
    } else { opts.btnMore.hide(); }
    return dtd.promise();
};


















/******* AddTypeDialog 类 ******************************************************************************************************************/
function AddTypeDialog(options) {
    var defaults = {
        host: "",
        appId: "",
        templateUrl: "/Apps/private/dialog/addType.html",
        dialogId: 'dlgAddType',
        collapseConceptId: 'collapseConcept'+randomInt(),
        collapseSystemId: 'collapseSystem' + randomInt(),
        listAppsId: 'listAppsId' + randomInt(),
        autoInit: true,
        onTypeAdded: function (fs) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
    AddTypeDialog.onTypeAdded = this.opts.onTypeAdded;

    if (this.opts.autoInit) this.init();
};

AddTypeDialog.prototype.setOptions = function(options){
    this.opts = $.extend(this.opts, options);
}

AddTypeDialog.prototype.init = function () {
    var collapseConcept = this.opts.collapseConceptId;
    var collapseSystem = this.opts.collapseSystemId;
    var listAppsId = this.opts.listAppsId;
    Nagu.DialogM.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{collapseConcept}/g, collapseConcept);
        html = html.replace(/{collapseSystem}/g, collapseSystem);
        html = html.replace(/{listApps}/g, listAppsId);

        $('body').append(html);
    });
};

AddTypeDialog.prototype.toggle = function (subjectId, stype) {

    var dialog = $('#' + this.opts.dialogId);
    dialog.attr('subjectId', subjectId);
    dialog.attr('stype', stype);
    dialog.attr('appId', this.opts.appId);

    dialog.modal('toggle');
};

AddTypeDialog.prototype.hide = function () {
    $('#dlgAddType').modal('hide');
}
AddTypeDialog.onTypeAdded = function (fs) { };

AddTypeDialog.AddType = function(subjectId, typeId, options){
    var defaults = {
        appId: "",
        stype: Nagu.MType.CONCEPT
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    //2. 完成类型添加
    return Nagu.CM.addRdfType(subjectId, typeId, {
            appId: opts.appId 
        }).done(function (fs) {
            AddTypeDialog.onTypeAdded(fs);
        });
};



/******* AddPropertyValueDialog 类 ******************************************************************************************************************/
function AddPropertyValueDialog(options) {
    var defaults = {
        host: "",
        appId: "",
        templateUrl: "/Apps/private/dialog/addPropertyValue.html",
        dialogId: "dlgAddPropertyValue", //+ randomInt(),
        fnId: "txtFn_" + randomInt(),
        valueId: "txtValue_" + randomInt(),
        onlyMeId: 'cbOnlyMe_' + randomInt(),
        titleId: 'tbTitle_' + randomInt(),
        contentId: 'txtContent_'+randomInt(),
        accordionConceptId: 'accordionConcept' + randomInt(),
        btnNewId: 'btnNew' + randomInt(),
        listAppsId: 'listAppsId' + randomInt(),
        autoInit: true,
        added: function (fs) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);

    if (this.opts.autoInit) this.init();
    AddPropertyValueDialog.added = this.opts.added;
};

AddPropertyValueDialog.prototype.setOptions = function (options) {
    this.opts = $.extend(this.opts, options);
};

AddPropertyValueDialog.prototype.init = function () {
    if ($('body #' + this.opts.dialogId).length > 0) return;
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    var txtFnId = this.opts.fnId;
    var txtValueId = this.opts.valueId;
    var onlyMeId = this.opts.onlyMeId;
    var titleId = this.opts.titleId;
    var contentId = this.opts.contentId;
    var accordionConceptId = this.opts.accordionConceptId;
    var btnNewId = this.opts.btnNewId;
    var listAppsId = this.opts.listApps;

    Nagu.DialogM.get(this.opts.templateUrl).done(function(html){
        html = html.replace(/{dlgAddPropertyValue}/g, dialogId);
        html = html.replace(/{txtFn}/g, txtFnId);
        html = html.replace(/{txtValue}/g, txtValueId);
        html = html.replace(/{cbOnlyMe}/g, onlyMeId);
        html = html.replace(/{tbTitle}/g, titleId);
        html = html.replace(/{txtContent}/g, contentId);
        html = html.replace(/{accordionConcept}/g, accordionConceptId);
        html = html.replace(/{btnNew}/g, btnNewId);
        html = html.replace(/{listApps}/g, listAppsId);

        $('body').append(html);
    });
};

AddPropertyValueDialog.prototype.toggle = function (subjectId, stype, predicateId, options) {
    this.opts = $.extend(this.opts, options);
    AddPropertyValueDialog.added = this.opts.added;

    var div = $('#' + this.opts.dialogId);
    div.attr('subjectId', subjectId).attr('stype', stype);
    div.attr('predicateId', predicateId).attr('appId', this.opts.appId);
    div.find('h3').text(this.opts.h3);
    div.modal('toggle');
};

AddPropertyValueDialog.prototype.hide = function () {
    $('#' + this.opts.dialogId).modal('hide');
}

AddPropertyValueDialog.AddConceptValue = function (subjectId, predicateId, conceptId, options) {
    var defaults = {
        appId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    return Nagu.CM.addConceptPropertyValue2(subjectId, predicateId, conceptId, {
        appId: opts.appId 
    }).done(function (fs) {
        AddPropertyValueDialog.added(fs);
    });
};

AddPropertyValueDialog.AddLiteralValue = function (options) {
    var defaults = {
        appId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var val = opts.tbValue.val();
    if (val == "") {
        opts.dialog.find('ul.error-list').append(newLi().append("请输入属性值"));
        opts.dialog.find('.alert-error').show();
        return;
    }
    Nagu.CM.addLiteralPropertyValue(opts.subjectId, opts.predicateId, val, { appId: opts.appId }).done(function (fs) {
        opts.tbValue.val('');
        opts.dialog.modal('hide');
        AddPropertyValueDialog.added(fs);
    });

}

AddPropertyValueDialog.AddTextValue = function (options) {
    var defaults = {
        appId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);


    var title = opts.tbTitle.val();
    var content = opts.txtContent.val();

    var hasError = false;
    opts.dialog.find('ul.error-list').empty();
    opts.dialog.find('.alert-error').hide();
    if (title == "") {
        opts.dialog.find('ul.error-list').append(newLi().append("请输入标题"));
        hasError = true;
    }
    if (content == "") {
        opts.dialog.find('ul.error-list').append(newLi().append("请输入内容"));
        hasError = true;
    }
    if (hasError) {
        opts.dialog.find('.alert-error').show();
        return;
    }

    //var dtd = $.Defrred();
    var resolved = 0;

    Nagu.CM.create(title, '文章：' + title, {
        appId: opts.appId,
        typeId: Nagu.Concepts.Article
    }).done(function (newc) {
        // 添加语句：{subjectId, predicateId, newc}
        Nagu.CM.addConceptPropertyValue(opts.subjectId, Nagu.MType.Concept, opts.predicateId, '', newc.ConceptId, { appId: opts.appId }).done(function (fs) {
            
            // 添加语句：{newc, article:Content, content}
            Nagu.CM.addLiteralPropertyValue(newc.ConceptId, Nagu.Concepts.articleContent, content, {
                appId: opts.appId
            }).done(function (fs) {
                opts.tbTitle.val('');
                opts.txtContent.val('');
                opts.dialog.modal('hide');
                AddPropertyValueDialog.added(fs);
            });
        });
    });
}

AddPropertyValueDialog.AddImageValue = function (options) {
    var defaults = {
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var fileInput = opts.dialog.find('#fileImage');

    // 初始化上传控件
    fileInput.fileupload({
        dataType: 'json',
        url: 'https://graph.qq.com/t/add_pic_t ',
        done: function (e, data) {
            $.each(data.files, function (index, file) {
                $('<p/>').text(file.name).appendTo(document.body);
            });
        }
    });
    Nagu.MM.getMe().done(function (me) {

        // 上传图片：
        fileInput.fileupload('add', {
            fileInput: fileInput,
            formData: {
                oauth_consumer_key: '100321920',
                access_token: me.QcAccessToken,
                openid: me.QcOpenId,
                format: 'json',
                content: '上传图片test1365686697274'
            },
            forceIframeTransport: true
        });
    });
};










/******* ArticleShowDialog 类 ***********************************************************************************************************************************/
function ArticleShowDialog(options) {
    var defaults = {
        host: "",
        appId: "",
        templateUrl: "/Apps/private/dialog/articleShow.html",
        dialogId: "dlgArticleShow" + randomInt(),
        autoInit: true,
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);

    if (this.opts.autoInit) this.init();
};

ArticleShowDialog.prototype.init = function () {
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    return Nagu.DialogM.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgArticleShow}/g, dialogId);

        $('body').append(html);
    });
};

ArticleShowDialog.prototype.toggle = function (conceptId, options) {
    this.opts = $.extend(this.opts, options);

    var div = $('#' + this.opts.dialogId);
    Nagu.CM.get(conceptId).done(function(concept){
        div.find('h3').text(concept.FriendlyNames[0]);
    });
    Nagu.CM.getPropertyValues(conceptId,Nagu.Concepts.articleContent).done(function(fss){
        $.each(fss, function(i, fs){
            if(fs.Object.Value){
                div.find('.nagu-article-content').text(fs.Object.Value);
            }
        });
    });
    div.find('.article-show-go-btn').attr('href', '/apps/public/concept.html?id=' + conceptId);

    div.modal('toggle');
};


/******* ImageShowDialog 类 ***********************************************************************************************************************************/
function ImageShowDialog(options) {
    var defaults = {
        host: "",
        appId: "",
        templateUrl: "/Apps/private/dialog/imageShow.html",
        dialogId: "dlgImageShow" + randomInt(),
        autoInit: true,
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);

    if (this.opts.autoInit) this.init();
};

ImageShowDialog.prototype.init = function () {
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    return Nagu.DialogM.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgImageShow}/g, dialogId);

        $('body').append(html);
    });
};

ImageShowDialog.prototype.toggle = function (conceptId, options) {
    this.opts = $.extend(this.opts, options);

    var div = $('#' + this.opts.dialogId);
    div.find('.nagu-image-content').empty();

    Nagu.CM.get(conceptId).done(function (concept) {
        div.find('h3').text(concept.FriendlyNames[0]);
    });
    Nagu.CM.getPropertyValues(conceptId, Nagu.Image.Url).done(function (fss) {
        $.each(fss, function (i, fs) {
            if (fs.Object.Value) {
                var img = $('<img />').attr('src', fs.Object.Value);
                div.find('.nagu-image-content').append(img);
            }
        });
    });
    div.find('.image-show-go-btn').attr('href', '/apps/public/concept.html?id=' + conceptId);

    div.modal('toggle');
};


/******* BagShowDialog 类 ***********************************************************************************************************************************/
function BagShowDialog(options) {
    var defaults = {
        host: "",
        appId: "",
        templateUrl: "/Apps/private/dialog/bagShow.html",
        dialogId: "dlgBagShow" + randomInt(),
        autoInit: true,
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);

    if (this.opts.autoInit) this.init();
};

BagShowDialog.prototype.init = function () {
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    return Nagu.DialogM.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgBagShow}/g, dialogId);
        $('body').append(html);
    });
};

BagShowDialog.prototype.toggle = function (conceptId, options) {
    this.opts = $.extend(this.opts, options);

    var div = $('#' + this.opts.dialogId);
    div.find('.nagu-bag-content').empty();

    Nagu.CM.get(conceptId).done(function (concept) {
        div.find('h3').text(concept.FriendlyNames[0]);
    });
    Nagu.CM.getPropertyValues(conceptId, Nagu.Rdf.Li).done(function (fss) {
        div.find('.nagu-bag-content').conceptList(fss);
    });
    div.find('.bag-show-go-btn').attr('href', '/apps/public/concept.html?id=' + conceptId);

    div.modal('toggle');
};





/******* BagShowDialog 类 ***********************************************************************************************************************************/
function LoginDialog(options) {
    var defaults = {
        host: "",
        appId: "",
        templateUrl: "/Apps/private/dialog/login.html",
        dialogId: "dlgLogin" + randomInt(),
        autoInit: true,
        success: function (me) { },
        fail: function () { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);

    LoginDialog.Success = this.opts.success;
    LoginDialog.Fail = this.opts.fail;

    if (this.opts.autoInit) this.init();
};

LoginDialog.prototype.init = function () {
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    return Nagu.DialogM.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgLogin}/g, dialogId);
        $('body').append(html);
    });
};

LoginDialog.prototype.toggle = function (options) {
    this.opts = $.extend(this.opts, options);

    var div = $('#' + this.opts.dialogId);

    div.modal('toggle');
};





/******* ConceptDetailPanel 类 ***********************************************************************************************************************************/
/* 
参考手册: #3
*/
function ConceptDetailPanel(conceptId, options) {
    this.conceptId = conceptId;
    var defaults = {
        host: "",
        appId: "",
        dialogId: "dlgAddPropertyValue",
        fnId: "txtFn",
        valueId: "txtValue",
        clearBefore: true,
        showDetail: true
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
}

ConceptDetailPanel.prototype.show = function (placeHolder) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象    
    if (this.opts.clearBefore) placeHolder.empty();


    // 1. 显示基本信息
    if(this.opts.showDetail) this.showDetail();

    // 2. 依次显示每个类型的信息
    this.showFromTypes();

    // 3. 显示其他属性
    this.showProperties();

    placeHolder.append(this.divDetail).append(this.divFromTypes).append(this.divProperties);
};

ConceptDetailPanel.prototype.showDetail = function(){
    if(this.divDetail === undefined)
        this.divDetail = newDiv().addClass('nagu-concept-detail');
    // 1. 显示基本信息
    this.divDetail.conceptShow(this.conceptId,
    {
        renderTitle: this.opts.renderTitle,
        renderValues: this.opts.renderValues
    });
};

ConceptDetailPanel.prototype.showFromTypes = function () {
    if(this.divFromTypes === undefined)
        this.divFromTypes = newDiv().addClass('nagu-concept-infoFromTypes');
    this.divFromTypes.conceptInfoFromTypes(this.conceptId, this.opts);

};

ConceptDetailPanel.prototype.showProperties = function () {
    if (this.divProperties === undefined)
        this.divProperties = newDiv().addClass('nagu-concept-properties');
    this.divProperties.conceptProperties(this.conceptId, this.opts);
}

// 返回一个通用的,显示"富功能"的renderTitle回调函数
ConceptDetailPanel.getFunction_RenderRichTitle = function (createConceptDialog) {
    return function (ph, title, concept) {
        var btn = newA().text(title).click(function () {
            createConceptDialog.toggle(concept.ConceptId, { h3: '为"' + concept.FriendlyNames[0] + '"添加新的名称或简介' });
        });
        ph.append(btn);
    };
};

// 返回一个通用的,显示"富功能"的renderValues回调函数
ConceptDetailPanel.getFunction_renderRichValues = function (changed) {
    return function (ph, values, valueFss) {
        var dd = newDd();
        var ul = newTag('ul').addClass('nav nav-pills');
        ph.append(dd.append(ul));



        // 为每一个名称或描述值生成下拉菜单:
        for (var i = 0; i < values.length; i++) {
            var miSaid = MenuItem.getSaidMI(valueFss[i], {
                changed: changed
            });

            var menu = new Menu([miSaid], {
                text: values[i]
            });
            menu.appendTo(ul);
        }
        $('.dropdown-toggle').dropdown();
    }
};

ConceptDetailPanel.renderProperty = function (placeHolder, propertyId, subjectId) {
    var cm = new ConceptManager();
    // 显示属性:
    cm.get(propertyId).done(function (p) {
        placeHolder.append(p.FriendlyNames[0]);
    });
}

// 返回一个通用的,显示"富功能"的renderProperty回调函数
ConceptDetailPanel.getFunction_renderRichProperty = function (addValueDialog) {
    return function (placeHolder, propertyId, subjectId) {
        var cm = new ConceptManager();
        // 显示属性:
        cm.get(propertyId).done(function (p) {
            placeHolder.append(newA().text(p.FriendlyNames[0]).click(function () {
                addValueDialog.toggle(subjectId, Nagu.MType.Concept, p.ConceptId,
                {
                    h3: '为属性“' + p.FriendlyNames[0] + '”添加属性值'
                });
            }));
        });
    };
};

// #9 返回一个具有"下拉菜单"的renderProperty回调函数
ConceptDetailPanel.get_renderProperty3 = function (options) {
    var defaults = {
        dlgAddPropertyValue: new AddPropertyValueDialog(),
        valueAdded: function (fs) { }
    };
    var opts = $.extend(defaults, options);
    log('get_renderProperty3');

    return function (placeHolder, propertyId, subjectId, options2) {
        var opts2 = $.extend(options, options2);
        // 显示属性:
        Nagu.CM.get(propertyId).done(function (p) {
            var miGo = MenuItem.getDirectMI('详细信息', '/apps/public/concept.html?id=' + propertyId);
            var miAddValue = new MenuItem({
                text: '添加属性值',
                click: function () {
                    opts2.dlgAddPropertyValue.toggle(subjectId, Nagu.MType.Concept, p.ConceptId,
                    {
                        h3: '为属性“' + p.FriendlyNames[0] + '”添加属性值',
                        added: opts2.valueAdded
                    });
                }
            });
            // 为每一个属性生产一个下拉菜单:
            placeHolder.conceptMenu([miAddValue, miGo], {
                text: p.FriendlyNames[0]
            });
        });
    };
};

// 具有"超链接"的renderProperty回调函数
ConceptDetailPanel.renderProperty4 = function (placeHolder, propertyId, subjectId) {
    var cm = new ConceptManager();
    // 显示属性:
    cm.get(propertyId).done(function (p) {
        var a = newA().attr('href', '/apps/public/concept.html?id=' + propertyId);
        a.text(p.FriendlyNames[0]).appendTo(placeHolder);
    });
};

// 返回一个通用的,显示"富功能"的renderPropertyValues回调函数
ConceptDetailPanel.getFunction_renderRichPropertyValues = function (changed) {
    return function (placeHolder, propertyId, values, subjectId) {
        if (values.length == 0) { placeHolder.text('无属性值'); return; }
        var ul = newTag('ul').addClass('nav nav-pills');
        placeHolder.append(ul);
        $.each(values, function (i, v) {
            /* 待显示的Concept，
            * 可能在Subject的位置上，也可能在Object的位置上。
            * 根据属性的元数据可以推断得出。
            * 例如，当属性的owl:inverseOf属性有值，且值与v的Predicate相等，
            * 此时属性值就应当取Subject位置上的Concept。
            */
            var valueConcept = v.Object;

            // 当两者不同时，有可能出现属性值在Subject位置的情况。
            if (v.Predicate.ConceptId != propertyId) {
                
            }
            var mis = new Array();

            // 为每一个属性值生产一个下拉菜单:
            var miSaid = MenuItem.getSaidMI(v, {
                changed: changed
            });
            mis.push(miSaid);

            if (valueConcept.ConceptId) {
                var miGo = MenuItem.getDirectMI('详细信息', '/apps/public/concept.html?id=' + valueConcept.ConceptId);
                mis.push(miGo);
            }

            

            var menu = new Menu(mis, {
                appended: function (li, a, ul) {
                    var cm = new ConceptManager();

                    if (valueConcept.Value) {
                        a.text(valueConcept.Value);
                        if (v.AppId != Nagu.PublicApp) a.prepend(Icon('icon-lock'));
                    } else cm.get(valueConcept.ConceptId).done(function (c) {
                        a.text(c.FriendlyNames[0]);
                        if (v.AppId != Nagu.PublicApp) a.prepend(Icon('icon-lock'));
                    });

                }
            });
            menu.appendTo(ul);
        });
    }
};

// 返回一个通用的,显示"富功能"的renderPropertyValues回调函数
ConceptDetailPanel.get_renderPropertyValues2 = function (options) {
    var defaults = {
        changed: function(){},
        articleShowDialog: new ArticleShowDialog()
    };
    var opts = $.extend(defaults, options);

    var rpv2 = function (placeHolder, propertyId, values, subjectId) {
        placeHolder.empty();
        if (values.length == 0) { placeHolder.text('无属性值'); return; }
        var ul = newTag('ul').addClass('nav nav-pills').appendTo(placeHolder);
        $.each(values, function (i, v) {
            /* 待显示的Concept，
            * 可能在Subject的位置上，也可能在Object的位置上。
            * 根据属性的元数据可以推断得出。
            * 例如，当属性的owl:inverseOf属性有值，且值与v的Predicate相等，
            * 此时属性值就应当取Subject位置上的Concept。
            */
            var valueConcept = v.Object;

            // 当两者不同时，有可能出现属性值在Subject位置的情况。
            if (v.Predicate.ConceptId != propertyId) {
                if (v.Object.ConceptId == subjectId) {
                    valueConcept = v.Subject;
                } else {
                    valueConcept = v.Object;
                }
            }
            var menu;
            var mis = new Array();

            $.when(
                Nagu.MM.check().done(function (status) {
                    if (status.nagu) {
                        // 为每一个属性值生产一个下拉菜单:
                        var miSaid = MenuItem.getSaidMI(v, {
                            //changed: opts.changed
                            changed: function () {
                                Nagu.CM.getPropertyValues(subjectId, propertyId, {
                                    flush: true
                                }).done(function (fss) {
                                    rpv2(placeHolder, propertyId, fss, subjectId);
                                });
                            }
                        });
                        mis.push(miSaid);
                    }
                }),
                // 考察属性值的类型，根据不同类型插入不同的菜单
                MenuItem.getTypeMIs(valueConcept.ConceptId, opts)
            ).done(function (a1, typeMIs) {
                mis = mis.concat(typeMIs);
                mis.push(MenuItem.getDirectMI('查看语句',
                '/apps/public/statement.html?id=' + v.StatementId));
                menu = new Menu(mis, {
                    appended: function (li, a, ul) {
                        var cm = new ConceptManager();

                        if (valueConcept.Value) {
                            a.text(valueConcept.Value);
                            if (v.AppId != Nagu.PublicApp) a.prepend(Icon('icon-lock'));
                        } else cm.get(valueConcept.ConceptId).done(function (c) {
                            a.text(c.FriendlyNames[0]);
                            if (v.AppId != Nagu.PublicApp) a.prepend(Icon('icon-lock'));
                        });

                    }
                });
                menu.appendTo(ul);
            });
        });
    };
    return rpv2;
};

// 一个通用的renderType方法,使用手风琴方式展示各类型的数据
ConceptDetailPanel.renderType2 = function (conceptId, placeHolder, typeFs, opts) {
    // 如果是“Concept基本信息”，则不显示
    if (typeFs.Object.ConceptId == Nagu.Concepts.NaguConcept) return;

    var accordionId = placeHolder.attr('id')
    if (accordionId == "") {
        accordionId = 'accordion_' + randomInt();
        placeHolder.attr('id', accordionId);
    }
    placeHolder.addClass('accordion');

    var div = newDiv().appendTo(placeHolder);

    // 3. 显示类型标题:
    var cm = new ConceptManager();
    cm.get(typeFs.Object.ConceptId).done(function (type) {
        div.naguAccordionGroup(type.FriendlyNames[0], {
            renderBody: function (ph) {
                // 4. 循环显示每个类型的属性
                var dl = newTag("dl").addClass('dl-horizontal').appendTo(ph);
                propertyValuesFormBaseClass(conceptId, Nagu.MType.Concept, typeFs.Object.ConceptId, opts.appId).done(function (pvs) {
                    $.each(pvs, function (i, pv) {
                        var dt = newDt("dt_" + pv.Key).appendTo(dl);

                        // 显示属性:
                        opts.renderProperty(dt, pv.Key, conceptId);
                        // 显示Value
                        var dd = newDd().appendTo(dl);
                        opts.renderPropertyValues(dd, pv.Key, pv.Value, conceptId);
                    });
                });

                // 5. 显示"星标"按钮
                ph.append(newBtn().btnSay(typeFs.StatementId, {
                    changed: function (data) {
                        if (data.SaidCount) $(this).remove();
                    }
                }));

                ph.append(newBtn().text('详细信息').click(function () {
                    window.location = '/apps/public/concept.html?id=' + type.ConceptId;
                }));
            }
        });
        // 为非公共数据加上标识
        if (typeFs.AppId != Nagu.PublicApp) {
            div.find('.accordion-heading').find('a').prepend(Icon('icon-lock'));
        }
    });
};

// 一个通用的renderType方法,使用手风琴方式展示各类型的数据，适用于不登录的情况
ConceptDetailPanel.renderType3 = function (conceptId, placeHolder, typeFs, opts) {
    // 保证Object是Concept，不是则跳出：
    if (typeFs.Object.ConceptId === undefined) return;
    if (typeFs.Object.ConceptId == Nagu.Concepts.NaguConcept) return;

    var accordionId = placeHolder.attr('id')
    if (accordionId == "") {
        accordionId = 'accordion_' + randomInt();
        placeHolder.attr('id', accordionId);
    }
    placeHolder.addClass('accordion');

    var div = newDiv().appendTo(placeHolder);

    // 3. 显示类型标题:
    Nagu.CM.get(typeFs.Object.ConceptId).done(function (type) {
        div.naguAccordionGroup(type.FriendlyNames[0], {
            renderBody: function (ph) {
                // 4. 循环显示每个类型的属性
                var dl = newTag("dl").addClass('dl-horizontal').appendTo(ph);
                propertyValuesFormBaseClass(conceptId, Nagu.MType.Concept, typeFs.Object.ConceptId, opts.appId).done(function (pvs) {
                    $.each(pvs, function (i, pv) {
                        // 构建容器。dt: 属性, dd: 属性值
                        var dt = newDt().appendTo(dl);
                        var dd = newDd().attr('pvsFor',pv.Key).appendTo(dl);

                        // 显示属性:
                        opts.renderProperty(dt, pv.Key, conceptId, {
                            valueAdded: function (fs) {
                                var propertyId = fs.Predicate.ConceptId;
                                Nagu.CM.getPropertyValues(conceptId, propertyId, {
                                    flush: true
                                }).done(function (fss) {
                                    var pvdd = $('dd[pvsFor="' + pv.Key + '"]');
                                    opts.renderPropertyValues(pvdd, propertyId, fss, conceptId);
                                });
                            }
                        });
                        
                        opts.renderPropertyValues(dd, pv.Key, pv.Value, conceptId);
                    });
                });

                ph.append(newBtn().text('详细信息').click(function () {
                    window.location = '/apps/public/concept.html?id=' + type.ConceptId;
                }));
            }
        });
    });
};

// 默认显示属性值的方法
ConceptDetailPanel.renderPropertyValues = function (placeHolder, propertyId, values, subjectId) {
    if (values.length == 0) { placeHolder.text('无属性值'); return; }

    var ul = newTag('ul').addClass('nav nav-pills nav-stacked').appendTo(placeHolder);
    $.each(values, function (i, v) {
        var li = newTag('li', { id: 'value_' + randomInt() }).addClass('dropdown').appendTo(ul);
        li.showStatement(v);
    });
};

ConceptDetailPanel.renderPropertyAndValues = function (placeHolder, propertyId, values, subjectId, opts) {
    var dt = newDt("dt_" + propertyId).appendTo(placeHolder);

    // 显示属性:
    opts.renderProperty(dt, propertyId, subjectId);
    // 显示Value
    var dd = newDd().appendTo(placeHolder);
    opts.renderPropertyValues(dd, propertyId, values, subjectId);
};

// 类型列表默认现实
ConceptDetailPanel.renderType1 = function (conceptId, placeHolder, typeFs) {
    if (typeFs.Object.ConceptId == Nagu.Concepts.NaguConcept) return;
    var div = newDiv().appendTo(placeHolder);

    // 3. 显示类型标题:
    var loading = loadingImg();
    var h3 = newTag("h3").append(loading).appendTo(div);

    var cm = new ConceptManager();
    cm.get(typeFs.Object.ConceptId).done(function (type) {
        h3.text(type.FriendlyNames[0] + '· · · · · ·');
        loading.remove();


        // 4. 循环显示每个类型的属性
        var dl = newTag("dl").addClass("dl-horizontal").appendTo(div);
        propertyValuesFormBaseClass(conceptId, Nagu.MType.Concept, typeFs.Object.ConceptId, opts.appId).done(function (pvs) {
            $.each(pvs, function (i, pv) {
                opts.renderPropertyAndValues(dl, pv.Key, pv.Value, conceptId, opts);
            });
        });
    });
}

// #4
$.fn.conceptShow = function (conceptId, options) {
    var defaults = {
        clearBefore: true,
        renderTitle: function (placeHolder, title, concept) {
            placeHolder.text(title);
        },
        renderValues: function (placeHolder, values, valueFss) {
            for (var i = 0; i < values.length; i++) { //此处无法使用$.each,why?
                placeHolder.append(newDd().text(values[i]));
            }
        }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    var div = $(this);

    if (opts.clearBefore) div.empty();
    div.append(loadingImg128());

    var dl = newTag("dl").addClass("dl-horizontal");
    div.append(newTag("h3", { text: '基本信息 · · · · · ·' })).append(dl);
    var cm = new ConceptManager();

    return cm.get(conceptId).done(function (concept) {
        // 显示所有FriendlyName:
        if (concept.FriendlyNames.length > 0) {
            var dt = newDt();
            dl.append(dt);
            opts.renderTitle(dt, '名称', concept);
            opts.renderValues(dl, concept.FriendlyNames, concept.FriendlyNameFss);
        }

        // 显示所有Description:
        if (concept.Descriptions.length > 0) {
            var dt = newDt();
            dl.append(dt);
            opts.renderTitle(dt, '简介', concept);
            opts.renderValues(dl, concept.Descriptions, concept.DescriptionFss);
        }
        div.find('.nagu-loading-img-128').remove();

    });
};

// #5
$.fn.conceptInfoFromTypes = function (conceptId, options) {
    var defaults = {
        clearBefore: true,
        appId: "",
        renderPropertyAndValues: ConceptDetailPanel.renderPropertyAndValues,
        renderProperty: ConceptDetailPanel.renderProperty,
        renderType: ConceptDetailPanel.renderType3,
        renderPropertyValues: ConceptDetailPanel.get_renderPropertyValues2()
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var div = $(this);

    if (opts.clearBefore) $(this).empty();

    div.append(newTag('h3', { text: '类型 · · · · · ·' }));
    var loading = loadingImg128();
    div.append(loading);

    var typeDiv = newDiv().appendTo(div);
    // 1. 获取全部类型:
    Nagu.SM.findBySP(conceptId, Nagu.MType.Concept, Nagu.Concepts.RdfType, { appId: opts.appId }).done(function (fss) {
        // 2. 循环显示每一个类型:
        $.each(fss, function (i, fs) {
            opts.subjectId = conceptId;
            opts.typeDiv = typeDiv;
            opts.typeFs = fs;
            opts.renderType(conceptId, typeDiv, fs, opts);
        });
        loading.remove();
    });
    return div;
};

// #6
$.fn.conceptProperties = function (conceptId, options) {
    var defaults = {
        clearBefore: true,
        appId: "",
        renderPropertyAndValues: ConceptDetailPanel.renderPropertyAndValues,
        renderProperty: ConceptDetailPanel.renderProperty,
        //renderPropertyValues: ConceptDetailPanel.renderPropertyValues
        renderPropertyValues: ConceptDetailPanel.get_renderPropertyValues2()
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    if (opts.clearBefore) $(this).empty();

    var div = $(this);

    div.append(newTag('h3', { text: '其他属性 · · · · · ·' }));
    var loading = loadingImg128();
    div.append(loading);

    // 1. 获取全部属性:
    Nagu.CM.getPropertiesAndValues(conceptId).done(function (pvs) {
        // 如果pvs为空，则清空div:
        if (pvs.length == 0) {
            return div.empty();
        }
        // 2. 循环显示每个属性
        var dl = newTag("dl").addClass("dl-horizontal").appendTo(div);
        $.each(pvs, function (i, pv) {
            var dt = newDt("dt_" + pv.Key).appendTo(dl);

            // 显示属性:
            opts.renderProperty(dt, pv.Key, conceptId);

            // 显示Value
            var dd = newDd().appendTo(dl);
            opts.renderPropertyValues(dd, pv.Key, pv.Value, conceptId, opts);
        });

        loading.remove();
    });
    return div;
};






/******* MorphemeDetailPanel 类 ***********************************************************************************************************************************/


$.fn.statementProperties = function (morphemeId, options) {
    var defaults = {
        clearBefore: true,
        appId: "",
        renderPropertyAndValues: ConceptDetailPanel.renderPropertyAndValues,
        renderProperty: ConceptDetailPanel.renderProperty,
        renderPropertyValues: ConceptDetailPanel.get_renderPropertyValues2()
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    if (opts.clearBefore) $(this).empty();

    var ph = $(this);

    ph.append(newTag('h3', { text: '属性 · · · · · ·' }));
    var loading = loadingImg128();
    ph.append(loading);

    // 1. 获取全部属性:
    Nagu.CM.getPropertiesAndValues(conceptId).done(function (pvs) {
        // 如果pvs为空，则清空div:
        if (pvs.length == 0) {
            return div.empty();
        }
        // 2. 循环显示每个属性
        var dl = newTag("dl").addClass("dl-horizontal").appendTo(div);
        $.each(pvs, function (i, pv) {
            var dt = newDt("dt_" + pv.Key).appendTo(dl);

            // 显示属性:
            opts.renderProperty(dt, pv.Key, conceptId);

            // 显示Value
            var dd = newDd().appendTo(dl);
            opts.renderPropertyValues(dd, pv.Key, pv.Value, conceptId, opts);
        });

        loading.remove();
    });
    return div;
};


















/******* Dialog 类 ******************************************************************************************************************/
function Dialog(options) {
    var defaults = {
        host: "",
        appId: "00000000-0000-0000-0000-000000000000",
        templateUrl: "/Apps/private/dialog/addPropertyValue.html",
        dialogId: "dlgAddPropertyValue",
        fnId: "txtFn",
        valueId: "txtValue"
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
};
Dialog.prototype.setOptions = function (options) {
    this.opts = $.extend(this.opts, options);
};

// 初始化对话框中的“可见范围”列表。
Dialog.InitAppList = function (listApps) {
    var dtd = $.Deferred();

    // 初始化“私有选项”。
    Nagu.MM.getMe().done(function (me) {
        var option = $('<option/>').attr('value', me.Id);
        option.text('私有').appendTo(listApps);

        // 将当前用户具有“app:Manager”权限的App列入列表中
        Nagu.MM.manageableApps(me.Id).done(function(fss){
            $.each(fss, function (i, fs) {
                var opt = $('<option/>').attr('value', fs.Subject.ConceptId).appendTo(listApps);
                Nagu.CM.get(fs.Subject.ConceptId).done(function (app) {
                    opt.text(app.FriendlyNames[0]);
                });
            });
            dtd.resolve();
        });
    });
    return dtd.promise(); 
};































/******* CreateConceptDialog 类 ******************************************************************************************************************/



function CreateConceptDialog(options) {
    var defaults = {
        host: "",
        appId: "00000000-0000-0000-0000-000000000000",
        templateUrl: "/Apps/private/dialog/createConcept.html",
        dialogId: "dlgCreateConcept" + randomInt(),
        fnId: "tbConceptName" + randomInt(),
        descId: "tbConceptDesc" + randomInt(),
        autoInit: true,
        h3: '创建新Concept',
        onAdded: function (concept) {
            console.log('CreateConceptDialog created new concept::::::::::' + concept.FriendlyNames[0]);
            window.location = '/apps/public/concept.html?id=' + concept.ConceptId;
        }

    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
    CreateConceptDialog.prototype.OnAdded = this.opts.onAdded;
    if (this.opts.autoInit) this.init();
};
CreateConceptDialog.prototype.OnAdded = function (concept) {};


CreateConceptDialog.prototype.init = function () {
    var dialogId = this.opts.dialogId;
    var txtFnId = this.opts.fnId;
    var txtDescId = this.opts.descId;
    return $.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgCreateConcept}/g, dialogId);
        html = html.replace(/{txtConceptName}/g, txtFnId);
        html = html.replace(/{txtConceptDesc}/g, txtDescId);
        $('body').append(html);
    });
};

CreateConceptDialog.prototype.toggle = function (conceptId, options) {
    // Extend our default options with those provided.
    this.opts = $.extend(this.opts, options);

    CreateConceptDialog.prototype.OnAdded = this.opts.onAdded;

    var div = $('#' + this.opts.dialogId);
    div.find('.alert').hide();
    div.attr('conceptId', conceptId);
    div.attr('appId', this.opts.appId);
    div.find('h3').text(this.opts.h3);
    div.modal('show');
};

CreateConceptDialog.prototype.hide = function () {
    $('#' + this.opts.dialogId).modal('hide');
}






/******* SelectConceptDialog 类 ******************************************************************************************************************/
function SelectConceptDialog(options) {
    var defaults = {
        host: "",
        appId: "",
        templateUrl: "/Apps/private/dialog/selectConcept.html",
        tbIdId: "tbId_" + randomInt(),
        tbNameId: "tbName_" + randomInt(),
        onlyMeId: 'cbOnlyMe_' + randomInt(),
        dialogId: 'dlgSelect' + randomInt(),
        resultId: 'result' + randomInt(),
        typeId: '',
        autoInit: true,
        selected: function (concept, appId) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);

    if (this.opts.autoInit) this.init();
    SelectConceptDialog.selected = this.opts.selected;
};

SelectConceptDialog.prototype.setOptions = function (options) {
    this.opts = $.extend(this.opts, options);
};

SelectConceptDialog.prototype.init = function () {
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    var tbIdId = this.opts.tbIdId;
    var tbNameId = this.opts.tbNameId;
    var onlyMeId = this.opts.onlyMeId;
    var typeId = this.opts.typeId;
    var resultId = this.opts.resultId;
    return $.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgSelect}/g, dialogId);
        html = html.replace(/{tbId}/g, tbIdId);
        html = html.replace(/{tbName}/g, tbNameId);
        html = html.replace(/{cbOnlyMe}/g, onlyMeId);
        html = html.replace(/{result}/g, resultId);

        $('body').append(html);
        //initConceptSearch($('#' + tbNameId), $('#' + tbIdId), '/conceptapi/search?typeId=' + typeId);
    });
};

SelectConceptDialog.prototype.toggle = function (options) {
    this.opts = $.extend(this.opts, options);
    SelectConceptDialog.selected = this.opts.selected;
    
    var div = $('#' + this.opts.dialogId);
    div.find('h3').text(this.opts.h3);
    div.modal('toggle');
};

SelectConceptDialog.prototype.hide = function () {
    $('#' + this.opts.dialogId).modal('hide');
}













/******* SearchConceptDialog 类 ******************************************************************************************************************/
function SearchConceptDialog(options) {
    var defaults = {
        appId: "",
        templateUrl: "/Apps/private/dialog/searchConcept.html",
        tbNameId: "tbName_" + randomInt(),
        onlyMeId: 'cbOnlyMe_' + randomInt(),
        dialogId: 'dlgSearch' + randomInt(),
        typeId: '',
        autoInit: true,
        selected: function (concept, appId) {  }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);

    if (this.opts.autoInit) this.init();
    SearchConceptDialog.selected = this.opts.selected;
};

SearchConceptDialog.prototype.setOptions = function (options) {
    this.opts = $.extend(this.opts, options);
};

SearchConceptDialog.prototype.init = function () {
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    var tbNameId = this.opts.tbNameId;
    var onlyMeId = this.opts.onlyMeId;
    var typeId = this.opts.typeId;
    return $.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgSelect}/g, dialogId);
        html = html.replace(/{tbName}/g, tbNameId);
        html = html.replace(/{cbOnlyMe}/g, onlyMeId);
        html = html.replace(/{typeId}/g, typeId);
        $('body').append(html);
    });
};

SearchConceptDialog.prototype.toggle = function (options) {
    this.opts = $.extend(this.opts, options);
    SearchConceptDialog.selected = this.opts.selected;

    var div = $('#' + this.opts.dialogId);
    div.find('h3').text(this.opts.h3);
    div.modal('toggle');
};

SearchConceptDialog.prototype.hide = function () {
    $('#' + this.opts.dialogId).modal('hide');
}









/*******用于显示Concept的列表******************************************************************************************************************/

/*
显示语句列表
注意:只在"li"标签中进行显示.
*/
$.fn.conceptList = function (concepts, options) {
    var defaults = {
        clearBefore: false,
        createItemContainer: function (concept) {
            return newLi().attr("conceptId", concept.ConceptId);
        },
        renderItem: function (concept, li) {
            return li.appendMorpheme(concept);
        },
        pageSize: 999999999999,
        startIndex: 0,
        createBtnMore: function (btn, left) {
            if (btn === undefined)
                return newBtn('更多(剩余:' + left + ')>>').addClass('nagu-btn-more');
            else
                return btn.text('更多(剩余:' + left + ')>>');
        }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    var ul = $(this).addClass('nagu-concept-list');

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象  
    var resolvedDeferred = opts.startIndex;

    if (opts.clearBefore) ul.empty();

    // 加入btnMore按钮


    if (opts.btnMore === undefined) {
        if ($(this).find('.nagu-btn-more').size()) {
            opts.btnMore = $(this).find('.nagu-btn-more');
        } else {
            opts.btnMore = opts.createBtnMore().hide();
            ul.append(opts.btnMore);
        }
    }

    // 计算目前剩余多少个statement未显示:
    var left = concepts.length - opts.startIndex - opts.pageSize;
    // 更新按钮文本:
    opts.createBtnMore(opts.btnMore, left);


    // 在左侧显示所有语句
    var limit = Math.min(opts.startIndex + opts.pageSize, concepts.length);
    for (var i = opts.startIndex; i < limit; i++, opts.startIndex++) {
        // 生成显示框架：li
        var li = opts.createItemContainer(concepts[i]);

        opts.btnMore.before(li);

        $.when(opts.renderItem(concepts[i], li)).then(function () {
            if (++resolvedDeferred == limit) dtd.resolve(concepts);
        });
    }

    if (opts.startIndex < concepts.length) {
        opts.btnMore.unbind().click(function () {
            opts.clearBefore = false;
            ul.conceptList(concepts, opts);
        });
        opts.btnMore.show();
    } else { opts.btnMore.hide(); }
    return dtd.promise();
};



$.fn.btnFavorite = function (conceptId, options) {
    var defaults = {
        sayText: '添加收藏',
        dontSayText: '删除收藏',
        click: function () {
            var a = $(this);
            
            var statementId = a.attr('statementId');
            if (a.attr('statementId') != '') {
                // 删除收藏
            } else {
                // 添加收藏
                Nagu.MM.favorite(conceptId).done(function (fs) {
                    a.text(opts.dontSayText).prepend(Icon('icon-star-empty'));
                    a.addClass('btn-danger');
                    a.attr('statementId', fs.StatementId);
                    opts.changed(fs);
                });
            }
        },
        changed: function (data) { }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var ph = $(this).attr('statementId','');
    ph.attr('conceptId', conceptId).addClass('btn btn-primary');
    ph.unbind('click').click(opts.click);
    Nagu.MM.getMe().done(function (me) {
        Nagu.SM.findBySPO(me.Id, Nagu.User.Favorite, conceptId, {
            appId: me.Id
        }).done(function (fss) {
            if (fss.length > 0 && fss[0] != null) {
                ph.text(opts.dontSayText).prepend(Icon('icon-star-empty'));
                ph.addClass('btn-danger');
                ph.attr('statementId', fss[0].StatementId);
            } else {
                ph.text(opts.sayText).prepend(Icon('icon-empty'));
                ph.removeClass('btn-danger');
            }
        });
    });
    return ph;
}