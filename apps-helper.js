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
function initConceptSearch(tb, hidden) {
    tb.autocomplete({
        minLength: 2,
        source: "/conceptapi/search",
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
        console.log("morpheme.ConceptId");
        return ph.appendConcept(morpheme.ConceptId);
    }
    else if (morpheme.Value)
        return renderLiteral(morpheme, ph);
    else if (morpheme.StatementId) {
        console.log("morpheme.StatementId");
        return renderStatement(morpheme, ph);
    }
    var dtd = $.Deferred();
    dtd.reject();
    return dtd.promise();
};

$.fn.appendConcept = function (cid) {
    var ph = $(this);
    var a = newA().append(loadingImg());

    var cm = new ConceptManager();
    return cm.get(cid).done(function (c) {
        ph.append(a.empty().text(c.FriendlyNames[0]).attr('conceptId', c.ConceptId));
    }).fail(function () { a.empty().text('数据加载失败'); });
};

function renderMorpheme2(morpheme, ph) {
    if (morpheme.ConceptId) {
        console.log("morpheme.ConceptId");
        //return renderConcept4(morpheme.ConceptId, ph);
        return ph.appendConcept(morpheme.ConceptId);
    }
    else if (morpheme.Value)
        return renderLiteral(morpheme, ph);
    else if (morpheme.StatementId) {
        console.log("morpheme.StatementId");
        return renderStatement(morpheme, ph);
    }
    else return "unknown";
}

//function renderConcept4(cid, ph) {
//    var cm = new ConceptManager();
//    return cm.get(cid).done(function (c) {
//        ph.append(newA().text(c.FriendlyNames[0]));
//    });
//}

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
        console.log("hasSaid::::::::::::::::" + hasSaid);
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
        appId: "",//"00000000-0000-0000-0000-000000000000",
        templateUrl: "/Apps/private/dialog/addType.html",
        onlyMeId: 'cbOnlyMe_'+randomInt(),
        autoInit: true,
        onTypeAdded: function (fs) { }
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
    AddTypeDialog.prototype.onTypeAdded = this.opts.onTypeAdded;

    if (this.opts.autoInit) this.init();
};

AddTypeDialog.prototype.setOptions = function(options){
    this.opts = $.extend(this.opts, options);
}

AddTypeDialog.prototype.init = function () {
    var onlyMeId = this.opts.onlyMeId;
    return $.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{cbOnlyMe}/g, onlyMeId);
        $('body').append(html);
    });
};

AddTypeDialog.prototype.toggle = function (subjectId, stype) {
    $('#dlgAddType').attr('subjectId', subjectId);
    $('#dlgAddType').attr('stype', stype);
    $('#dlgAddType').attr('appId', this.opts.appId);

    $('#dlgAddType').modal('toggle');
};

AddTypeDialog.prototype.hide = function () {
    $('#dlgAddType').modal('hide');
}
AddTypeDialog.prototype.onTypeAdded = function (fs) { };





























/******* AddPropertyValueDialog 类 ******************************************************************************************************************/
function AddPropertyValueDialog(options) {
    var defaults = {
        host: "",
        appId: "00000000-0000-0000-0000-000000000000",
        templateUrl: "/Apps/private/dialog/addPropertyValue.html",
        dialogId: "dlgAddPropertyValue",
        fnId: "txtFn_" + randomInt(),
        valueId: "txtValue_" + randomInt(),
        onlyMeId: 'cbOnlyMe_'+randomInt(),
        autoInit: true,
        added: function (fs) { console.log('property value added'); }
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
    // 以下变量声明不能删除,否则异步函数无法取值.
    var dialogId = this.opts.dialogId;
    var txtFnId = this.opts.fnId;
    var txtValueId = this.opts.valueId;
    var onlyMeId = this.opts.onlyMeId;
    return $.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgAddPropertyValue}/g, dialogId);
        html = html.replace(/{txtFn}/g, txtFnId);
        html = html.replace(/{txtValue}/g, txtValueId);
        html = html.replace(/{cbOnlyMe}/g, onlyMeId);
        $('body').append(html);
    });
};

AddPropertyValueDialog.prototype.toggle = function (subjectId, stype, predicateId, options) {
    this.opts = $.extend(this.opts, options);

    var div = $('#' + this.opts.dialogId);
    div.attr('subjectId', subjectId).attr('stype', stype);
    div.attr('predicateId', predicateId).attr('appId', this.opts.appId);
    div.find('h3').text(this.opts.h3);
    div.modal('toggle');
};

AddPropertyValueDialog.prototype.hide = function () {
    $('#' + this.opts.dialogId).modal('hide');
}



























/******* ConceptDetailPanel 类 ***********************************************************************************************************************************/
/* 
参考手册: #3
*/
function ConceptDetailPanel(conceptId, options) {
    this.conceptId = conceptId;
    var defaults = {
        host: "",
        appId: "",//"00000000-0000-0000-0000-000000000000",
        dialogId: "dlgAddPropertyValue",
        fnId: "txtFn",
        valueId: "txtValue",
        clearBefore: true,
        createConceptDialog: undefined
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
}

ConceptDetailPanel.prototype.show = function (placeHolder) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象    
    if (this.opts.clearBefore) placeHolder.empty();


    // 1. 显示基本信息
    this.showDetail();

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
        var ul = newTag('ul', { class: 'nav nav-pills ' });
        ph.append(dd.append(ul));



        // 为每一个名称或描述值生成下拉菜单:
        for (var i = 0; i < values.length; i++) {
            var miSaid = MenuItem.getSaidMI(valueFss[i], {
                //changed: changed === undefined ? function () { } : changed
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

// 返回一个具有"下拉菜单"的renderProperty回调函数
ConceptDetailPanel.getFunction_renderProperty3 = function (addValueDialog) {
    return function (placeHolder, propertyId, subjectId) {

        var cm = new ConceptManager();
        // 显示属性:
        cm.get(propertyId).done(function (p) {
            var miGo = MenuItem.getDirectMI('详细信息', '/apps/public/concept.html?id=' + propertyId);
            var miAddValue = new MenuItem({
                text: '添加属性值',
                click: function () {
                    addValueDialog.toggle(subjectId, Nagu.MType.Concept, p.ConceptId,
                    {
                        h3: '为属性“' + p.FriendlyNames[0] + '”添加属性值'
                    });
                }
            });
            //var li = newTag('li').appendTo(placeHolder);
            placeHolder.conceptMenu([miGo, miAddValue], {
                text: p.FriendlyNames[0]
            });
            //            placeHolder.append(newA().text(p.FriendlyNames[0]).click(function () {
            //                addValueDialog.toggle(subjectId, Nagu.MType.Concept, p.ConceptId,
            //                {
            //                    h3: '为属性“' + p.FriendlyNames[0] + '”添加属性值'
            //                });
            //            }));
        });
    };
};

// 返回一个通用的,显示"富功能"的renderPropertyValues回调函数
ConceptDetailPanel.getFunction_renderRichPropertyValues = function (changed) {
    return function (placeHolder, propertyId, values, subjectId) {
        if (values.length == 0) { placeHolder.text('无属性值'); return; }
        var ul = newTag('ul', { class: 'nav nav-pills' });
        placeHolder.append(ul);
        $.each(values, function (i, v) {

            // 为每一个属性值生产一个下拉菜单:
            var miSaid = MenuItem.getSaidMI(v, {
                changed: changed
            });

            var menu = new Menu([miSaid], {
                appended: function (li, a, ul) {
                    var cm = new ConceptManager();

                    if (v.Object.Value) {
                        a.text(v.Object.Value);
                        if (v.AppId != Nagu.PublicApp) a.prepend(Icon('icon-lock'));
                    } else cm.get(v.Object.ConceptId).done(function (c) {
                        a.text(c.FriendlyNames[0]);
                        if (v.AppId != Nagu.PublicApp) a.prepend(Icon('icon-lock'));
                    });
                    
                }
            });
            menu.appendTo(ul);
        });
    }
};

// 一个通用的renderType方法,使用手风琴方式展示各类型的数据
ConceptDetailPanel.renderType2 = function (conceptId, placeHolder, typeFs, opts) {
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
            }
        });
        // 为非公共数据加上标识
        if (typeFs.AppId != Nagu.PublicApp) {
            div.find('.accordion-heading').find('a').prepend(Icon('icon-lock'));
        }
    });
};

ConceptDetailPanel.renderProperty = function (placeHolder, propertyId, subjectId) {
    var cm = new ConceptManager();
    // 显示属性:
    cm.get(propertyId).done(function (p) {
        placeHolder.append(p.FriendlyNames[0]);
    });
}

ConceptDetailPanel.renderPropertyValues = function (placeHolder, propertyId, values, subjectId) {
    if (values.length == 0) { placeHolder.text('无属性值'); return; }

    var ul = newTag('ul', { class: 'nav nav-pills nav-stacked' }).appendTo(placeHolder);
    $.each(values, function (i, v) {
        var li = newTag('li', { class: 'dropdown', id: 'value_' + randomInt() }).appendTo(ul);
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
        renderType: function (conceptId, placeHolder, typeFs) {
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
        },
        renderPropertyValues: ConceptDetailPanel.renderPropertyValues
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
    var sm = new StatementManager();
    sm.findBySP(conceptId, Nagu.MType.Concept, Nagu.Concepts.RdfType, { appId: opts.appId }).done(function (fss) {
        // 2. 循环显示每一个类型:
        $.each(fss, function (i, fs) {
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
        renderPropertyValues: ConceptDetailPanel.renderPropertyValues
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    if (opts.clearBefore) $(this).empty();

    var div = $(this);

    div.append(newTag('h3', { text: '其他属性 · · · · · ·' }));
    var loading = loadingImg128();
    div.append(loading);

    // 1. 获取全部属性:
    var cm = new ConceptManager();
    cm.getPropertiesAndValues(conceptId).done(function (pvs) {
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
































/******* CreateConceptDialog 类 ******************************************************************************************************************/



function CreateConceptDialog(options) {
    var defaults = {
        host: "",
        appId: "00000000-0000-0000-0000-000000000000",
        templateUrl: "/Apps/private/dialog/createConcept.html",
        dialogId: "dlgCreateConcept",
        fnId: "tbConceptName",
        descId: "tbConceptDesc",
        autoInit: true,
        h3: '创建新Concept',
        onAdded: function (concept) { console.log('CreateConceptDialog created new concept::::::::::' + concept.FriendlyNames[0]); }
        
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
    var txtValueId = this.opts.valueId;
    return $.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgCreateConcept}/g, dialogId);
        html = html.replace(/{txtConceptName}/g, txtFnId);
        html = html.replace(/{txtConceptDesc}/g, txtValueId);
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
    div.modal('toggle');
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
        dialogId: 'dlgSelect'+ randomInt(),
        autoInit: true,
        selected: function (concept, appId) { console.log('concept selected'); }
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
    return $.get(this.opts.templateUrl).done(function (html) {
        html = html.replace(/{dlgSelect}/g, dialogId);
        html = html.replace(/{tbId}/g, tbIdId);
        html = html.replace(/{tbName}/g, tbNameId);
        html = html.replace(/{cbOnlyMe}/g, onlyMeId);
        $('body').append(html);
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