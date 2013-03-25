


/****************************************************基础类:Nagu******************************************************************/

function Nagu() { }
Nagu.MType = {
    Resource: 0,
    Literal: 1,
    Statement: 2,
    Concept: 1025,
    ConceptDb: 1026
};
Nagu.Concepts = {
    RdfType: "4c5b16cd-d526-48cb-948e-250ce21facc8",
    OwlClass: "280ab0ee-7fda-4d29-9a0e-eed7850fe3b2",
    NaguFormatString: "0d83e5fd-eec0-4ea2-951e-38f13d57083f",
    PrivateObject: "e4ee4b57-fb68-4762-b99a-668a152d3ac0"
};

/****************************************************本地缓存数据函数******************************************************************/
// 缓存Morpheme数据，
/*
Morphemes[MorphemeId]：Morpheme的JSON对象；
*/
var Morphemes = new Array();


// 用于缓存said状态:
var Saids = new Array();

/* 缓存find结果：
Statements['sub_xxxx_pre_xxxx_obj_xxx']: 分别指定ID查询到的结果。
*/
var Statments = new Array();


// 用于缓存从类型中取得的数据
var PvsFromBaseClass = new Array();





/*******Said操作******************************************************************************************************************/

function SayManager(host) {
    if (host == null || host === undefined) this.host = "";
    else this.host = host;   
}
SayManager.SaidCache = new Array();
SayManager.prototype.say = function (statementId) {
    var dtd = $.Deferred();
    $.post(this.host + "/StatementApi/Say/" + statementId).done(function (data) {
        SayManager.SaidCache[statementId] = data;
        dtd.resolve(data);
    });
    return dtd.promise();
};
SayManager.prototype.dontSay = function (statementId) {
    var dtd = $.Deferred();
    $.post(this.host + "/StatementApi/DontSay/" + statementId).done(function (data) {
        SayManager.SaidCache[statementId] = data;
        dtd.resolve(data);
    });
    return dtd.promise();
};
SayManager.prototype.status = function (statementId) {
    var dtd = $.Deferred();
    if (SayManager.SaidCache[statementId] === undefined) {
        $.post(this.host + "/StatementApi/GetSaidStatus/" + statementId).done(function (data) {
            SayManager.SaidCache[statementId] = data;
            dtd.resolve(data);
        });
    } else {
        dtd.resolve(SayManager.SaidCache[statementId]);
    }
    return dtd.promise();
};



























/***Concept操作*****************************************************************************************************************************/

function ConceptManager(host) {
    if (host == null || host === undefined) this.host = "";
    else this.host = host;
}
ConceptManager.ConceptCache = new Array();
ConceptManager.prototype.get = function (id) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    if (ConceptManager.ConceptCache[id] === undefined) {
        $.getJSON(this.host + "/ConceptApi/Get/" + id).done(function (concept) {
            ConceptManager.ConceptCache[id] = concept;
            dtd.resolve(concept);
        }).fail(function () {
            alert('getConcept失败');
            dtd.reject();
        });
    }
    else {
        dtd.resolve(ConceptManager.ConceptCache[id]);
    }
    return dtd.promise(); // 返回promise对象
}
ConceptManager.prototype.create = function (fn, desc, options) {
    var defaults = {
        id: "",
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);


    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象    
    if (opts.id === undefined || opts.id == null || opts.id == "") {
        $.post(this.host + "/ConceptApi/Create/", { fn: fn, desc: desc, appId: opts.appId }).done(function (c) {
            ConceptManager.ConceptCache[c.ConceptId] = c;
            dtd.resolve(c);
        }).fail(function () { alert('ConceptManager.create失败'); dtd.reject(); });
    } else {
        $.post(this.host + "/ConceptApi/Create/", { id: opts.id, fn: fn, desc: desc, appId: opts.appId }).done(function (c) {
            ConceptManager.ConceptCache[c.ConceptId] = c;
            dtd.resolve(c);
        }).fail(function () { alert('ConceptManager.create失败'); dtd.reject(); });
    }
    return dtd.promise(); // 返回promise对象
};


ConceptManager.prototype.addRdfType = function (conceptId, typeId, options) {
    var defaults = {
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    return $.post(this.host + "/MorphemeApi/AddRdfType/" + conceptId, { stype: Nagu.MType.Concept, typeId: typeId, appId: opts.appId });
};

// 为Concept添加一个类型为Concept的属性值
ConceptManager.prototype.addConceptPropertyValue = function (subject, stype, propertyId, objectFn, objectId, onPropertyValueAdded, options) {
    var defaults = {
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象   
    var sm = new StatementManager();
    if (objectId != "" && objectId != null) {
        return sm.create(subject, stype, propertyId, objectId, Nagu.MType.Concept);
    }
    else if (objectFn != "") {
        if (window.confirm("还未选定一个Concept作为值，您可以返回重新搜索Concept，或创建新的Concept作为值。\r\n您确定要创建名称为“" + objectFn + "”的新的Concept并作为值吗？")) {
            var objectDesc = prompt("请输入关于\"" + objectFn + "\"的描述信息：");
            this.create(objectFn, objectDesc).done(function (newc) {
                sm.create(subject, stype, propertyId, newc.ConceptId, Nagu.MType.Concept).done(function (fs) { dtd.resolve(fs); });
            });
        }
        return dtd.promise();
    }
};


// 为Concept添加一个类型为Concept的属性值
ConceptManager.prototype.addLiteralPropertyValue = function (subject, propertyId, object, options) {
    var defaults = {
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象   
    var sm = new StatementManager();
    sm.create(subject, Nagu.MType.Concept, propertyId, object, Nagu.MType.Literal).done(function (fs) {
        dtd.resolve(fs); 
    });
    return dtd.promise();
};

ConceptManager.prototype.flush = function (conceptId) {
    ConceptManager.ConceptCache[conceptId] = undefined;
}
































/***Statement操作*****************************************************************************************************************************/
function StatementManager(host) {
    if (host == null || host === undefined) this.host = "";
    else this.host = host;
}

StatementManager.StatementsCache = new Array();
StatementManager.generateCacheKey = function (statementId, subjectId, predicateId, objectId, appId) {
    var key = 'sid_' + statementId;
    key += '_sub_' + subjectId;
    key += '_pre_' + predicateId;
    key += '_obj_' + objectId;
    key += '_appId_' + appId;
    return key;
}

StatementManager.prototype.flush = function (statementId, subjectId, predicateId, objectId, appId) {
    if (appId === undefined || appId == "")
        appId = "00000000-0000-0000-0000-000000000000";
    var cacheKey = StatementManager.generateCacheKey(statementId, subjectId, predicateId, objectId, appId);
    StatementManager.StatementsCache[cacheKey] = undefined;
}
StatementManager.prototype.create = function(subjectId, stype, predicateId, object, otype) {
    return $.post("/StatementApi/Create",
    {
        subjectId: subjectId,
        stype: stype,
        predicateId: predicateId,
        object: object,
        otype: otype
    });
};
StatementManager.prototype.findBySP = function (subject, stype, predicate, options) {
    var defaults = {
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var cacheKey = StatementManager.generateCacheKey('', subject, predicate, '', opts.appId);
    if (StatementManager.StatementsCache[cacheKey] === undefined) {
        $.post(host + "/MorphemeApi/FindBySP/" + subject,
        {
            stype: stype,
            predicateId: predicate,
            appId: opts.appId
        }).done(function (fss) {
            Statments[StatementManager.StatementsCache] = fss;
            dtd.resolve(fss);
        }).fail(function () { dtd.reject(); });
    } else {
        dtd.resolve(Statments[StatementManager.StatementsCache]);
    }
    return dtd.promise();
};
StatementManager.prototype.findByPO = function (predicateId, objectId, oType, options) {
    var defaults = {
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var cacheKey = StatementManager.generateCacheKey('', '', predicateId, objectId, opts.appId);
    if (StatementManager.StatementsCache[cacheKey] === undefined) {
        $.getJSON(host + "/MorphemeApi/FindByPO/" + predicateId,
        {
            otype: oType,
            objectId: objectId,
            appId: opts.appId
        }).done(function (fss) {
            StatementManager.StatementsCache[cacheKey] = fss;
            dtd.resolve(fss);
        }).fail(function () { dtd.reject(); });
    } else {
        dtd.resolve(StatementManager.StatementsCache[cacheKey]);
    }
    return dtd.promise();
};

StatementManager.prototype.get = function (id) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var cacheKey = StatementManager.generateCacheKey(id, '', '', '', '');
    if (StatementManager.StatementsCache[cacheKey] === undefined) {
        $.post(this.host + "/StatementApi/Get/" + id).done(function (fs) {
            StatementManager.StatementsCache[cacheKey] = fs;
            dtd.resolve(fs);
        }).fail(function () { dtd.reject(); });
    } else {
        dtd.resolve(StatementManager.StatementsCache[cacheKey]);
    }
    return dtd.promise();
};

















function pagedByPO(predicateId, objectId, otype, start, count) {
    return $.getJSON("/StatementApi/PagedByPO/" + predicateId,
    {
        objectId: objectId,
        oType: otype,
        start: start,
        count: count
    });
}

function searchWithType(fn, type) {
    return $.getJSON("/ConceptApi/SearchWithType/" + fn,
    {
        type: type
    });
}





function findSByPO(predicateId, objectId, oType) {
    return $.getJSON("/MorphemeApi/FindSByPO/" + predicateId,
    {
        objectId: objectId,
        otype: oType
    });
}




function propertyValuesFormBaseClass(subject, sType, rdfType) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var cacheKey = 'subject_' + subject + '_rdfType_' + rdfType;
    if (PvsFromBaseClass[subject] === undefined) PvsFromBaseClass[subject] = new Array();
    if (PvsFromBaseClass[subject][rdfType] === undefined) {
        $.getJSON(host + "/MorphemeApi/GetPropertyValuesFormBaseClass/" + subject,
        {
            mtype: sType,
            rdfType: rdfType
        }).done(function (pvs) {
            PvsFromBaseClass[subject][rdfType] = pvs;
            dtd.resolve(pvs);
        });
    } else {
        dtd.resolve(PvsFromBaseClass[subject][rdfType]);
    }
    return dtd.promise();
}




/*** MemberManager 类*****************************************************************************************************************************/

function MemberManager(host) {
    if (host == null || host === undefined) this.host = "";
    else this.host = host;
}
//MemberManager.Cache = new Array();
MemberManager.prototype.getMe = function () {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    if (MemberManager.me === undefined)
        $.post("/MemberApi/GetMe").done(function (me) {
            MemberManager.me = me;
            dtd.resolve(me);
        });
    else dtd.resolve(MemberManager.me);
    return dtd.promise();
};