var RESOURCE = 0;
var LITERAL = 1;
var STATEMENT = 2;
var CONCEPT = 1025;
var CONCEPT_DB = 1026;

var MorphemeType = {
    Resource: 0,
    Literal: 1,
    Statement: 2,
    Concept: 1025,
    ConceptDb: 1026
};

var NaguConcepts = {
    RdfType: "4c5b16cd-d526-48cb-948e-250ce21facc8",
    OwlClass: "280ab0ee-7fda-4d29-9a0e-eed7850fe3b2",
    NaguFormatString: "0d83e5fd-eec0-4ea2-951e-38f13d57083f"
};

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









/*******Said操作******************************************************************************************************************/

function SayManager(host) {
    if (host == null || host === undefined) this.host = "";
    else this.host = host;   
}
SayManager.SaidCache = new Array();
SayManager.prototype.say = function (statementId) {
    var dtd = $.Deferred();
    if (SayManager.SaidCache[statementId] === undefined || !SayManager.SaidCache[statementId]) {
        $.post(this.host + "/StatementApi/Say/" + statementId).done(function () {
            SayManager.SaidCache[statementId] = true;
            dtd.resolve();
        });
    } else {
        dtd.resolve();
    }
    return dtd.promise();
};
SayManager.prototype.dontSay = function (statementId) {
    var dtd = $.Deferred();
    if (SayManager.SaidCache[statementId] === undefined || SayManager.SaidCache[statementId]) {
        $.post(this.host + "/StatementApi/DontSay/" + statementId).done(function () {
            SayManager.SaidCache[statementId] = false;
            dtd.resolve();
        });
    } else {
        dtd.resolve();
    }
    return dtd.promise();
};
SayManager.prototype.status = function (statementId) {
    var dtd = $.Deferred();
    if (SayManager.SaidCache[statementId] === undefined) {
        $.post(this.host + "/StatementApi/GetSaidStatus/" + statementId).done(function (data) {
            SayManager.SaidCache[statementId] = data.HasSaid;
            dtd.resolve(statementId, SayManager.SaidCache[statementId]);
        });
    } else {
        dtd.resolve(statementId, SayManager.SaidCache[statementId]);
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
        id: null,
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);


    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象    
    if (opts.id == null) {
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

//function getConcept(id) {
//    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
//    if (Morphemes[id] === undefined) {
//        $.getJSON("/ConceptApi/Get/" + id).done(function (concept) {
//            Morphemes[id] = concept;
//            dtd.resolve(concept);
//        }).fail(function () {
//            alert('getConcept失败');
//            dtd.reject();
//        });
//    }
//    else {
//        dtd.resolve(Morphemes[id]);
//    }
//    return dtd.promise(); // 返回promise对象
//}





function addRdfType(subjectId, stype, typeId, afterAdded) {
    if (afterAdded == null) {
        return $.getJSON("/MorphemeApi/AddRdfType/" + subjectId + "?stype=" + stype + "&typeId=" + typeId);
    }
    $.getJSON("/MorphemeApi/AddRdfType/" + subjectId + "?stype=" + stype + "&typeId=" + typeId, afterAdded);
}

/***Statement操作*****************************************************************************************************************************/
function StatementManager(host) {
    if (host == null || host === undefined) this.host = "";
    else this.host = host;
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
    var cacheKey = 'sub_' + subject + '_pre_' + predicate + '_appId_' + opts.appId; 
    if (Statments[cacheKey] === undefined) {
        $.post(host + "/MorphemeApi/FindBySP/" + subject,
        {
            stype: stype,
            predicateId: predicate,
            appId: opts.appId
        }).done(function (fss) {
            Statments[cacheKey] = fss;
            dtd.resolve(fss);
        }).fail(function () { dtd.reject(); });
    } else {
        dtd.resolve(Statments[cacheKey]);
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
    var cacheKey = 'pre_' + predicateId + '_obj_' + objectId + '_appId_' + opts.appId;
    if (Statments[cacheKey] === undefined) {
        $.getJSON(host + "/MorphemeApi/FindByPO/" + predicateId,
        {
            otype: oType,
            objectId: objectId,
            appId: opts.appId
        }).done(function (fss) {
            Statments[cacheKey] = fss;
            dtd.resolve(fss);
        }).fail(function () { dtd.reject(); });
    } else {
        dtd.resolve(Statments[cacheKey]);
    }
    return dtd.promise();
};
StatementManager.prototype.get = function (id) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    if (Statments[id] === undefined) {
        $.post(this.host + "/StatementApi/Get/" + id).done(function (fs) {
            Statments[id] = fs;
            dtd.resolve(fs);
        }).fail(function () { dtd.reject(); });
    } else {
        dtd.resolve(Statments[id]);
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
    return $.getJSON(host + "/MorphemeApi/GetPropertyValuesFormBaseClass/" + subject,
    {
        mtype: sType,
        rdfType: rdfType
    });
}