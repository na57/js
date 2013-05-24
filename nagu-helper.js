


/****************************************************基础类:Nagu******************************************************************/

function Nagu() { }
Nagu.MType = {
    Resource:   0,
    Literal:    1,
    Statement:  2,
    Concept:    1025,
    ConceptDb:  1026
};
Nagu.Concepts = {
    RdfType:            "4c5b16cd-d526-48cb-948e-250ce21facc8",
    OwlClass:           "280ab0ee-7fda-4d29-9a0e-eed7850fe3b2",
    NaguFormatString:   "0d83e5fd-eec0-4ea2-951e-38f13d57083f",
    PrivateObject:      "e4ee4b57-fb68-4762-b99a-668a152d3ac0",
    NaguConcept:        "ffb29350-2456-403b-857a-1577b533b8c5",
    NaguImage:          "2b97e831-9578-4b86-876b-eda87bc782c6",
    RdfRange:           '70bd1b5a-d2c0-4887-b483-7744eac5e7cf',
    User:               'a1dc1f11-371e-4e5b-84a9-0cd3cf40f049',
    Article:            'a345d7d6-9db5-4edd-86fe-a1df9dcdeb70',
    articleContent:     '6bef4f02-1d1d-4161-b017-0e9e4879883c',
    Literal:            '26a11dbc-f50a-480e-9ff4-7106f1af3fcb',
    SystemTypeBag: '76b2ba52-0f0c-4a76-b899-65e921092c28',  // “系统预定义类型”包
    App: 'f1933904-6bac-425b-abf8-c5f4032a380f' // 描述“应用”的类
};

Nagu.Article = {
    Content: '6bef4f02-1d1d-4161-b017-0e9e4879883c',
    Url: ''
};

Nagu.Owl = {
    InverseOf:          'a9288b7b-927d-4cdf-b561-2043701a5ba6',
    Class:              '280ab0ee-7fda-4d29-9a0e-eed7850fe3b2'
};
Nagu.Rdf = {
    Bag:                'ada49e35-2c62-404e-b3df-db368149521f',
    Li: '028428d9-3470-47bb-abe1-5712bc047589',
    Type: "4c5b16cd-d526-48cb-948e-250ce21facc8"
};

Nagu.App = {
    Manager: '18567b72-f23a-4845-b40a-fc1886a7277f',
    Public: '00000000-0000-0000-0000-000000000000'
}

Nagu.Image = {
    Url: 'ac6dc594-20b3-4f94-b628-a3a098c49308'
};

Nagu.User = {
    Favorite: '985902bb-34a5-454a-b4be-8771d511635b'
};

Nagu.PublicApp = '00000000-0000-0000-0000-000000000000';
Nagu.init = function (options) {
    var defaults = {
        host: "",
        appId: "",
        useIframe: false,
        iframeId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    // 确保页面上有iframe
    if (opts.useIframe && opts.iframeId == '') {
        opts.iframeId = 'pmIframe' + randomInt();
        var iframe = $('<iframe style="width: 0px; height: 0px; display: none; overflow: hidden;" src="http://nagu.cc/apps/pmproxy.html"></iframe>');
        iframe.attr('id',opts.iframeId).appendTo($('body'));
    }
    // 初始化messenger
    if (opts.useIframe) {
        Nagu.Messenger = Messenger.initInParent(document.getElementById(opts.iframeId));
    }
    Nagu.CM = new ConceptManager(opts);
    Nagu.SM = new StatementManager(opts.host);
    Nagu.MM = new MemberManager(opts.host);
    Nagu.DialogM = new DialogManager();
    Nagu.SayM = new SayManager();
};
Nagu.init();

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

function ConceptManager(options) {
    var defaults = {
        host: "",
        iframeId: '',
        useIframe: false
    };
    // Extend our default options with those provided.    
    this.opts = $.extend(defaults, options);
    this.host = this.opts.host;
    if (this.opts.useIframe && this.opts.iframeId == '') {
        this.opts.iframeId = 'pmIframe' + randomInt();
        var iframe = $('<iframe style="width: 0px; height: 0px; display: none; overflow: hidden;" src="http://nagu.cc/apps/pmproxy.html"></iframe>');
        iframe.attr('id', this.opts.iframeId).appendTo($('body'));
    }

    
}
ConceptManager.ConceptCache = new Array();

ConceptManager.send = function (message, iframeId) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象

    // 初始化messenger
    if (Nagu.Messenger === undefined) {
        Nagu.Messenger = Messenger.initInParent(document.getElementById(iframeId));
    }

    // 接收数据
    var callback = function (message) {
        /*
        message格式：
        message.url: 将被post的地址；
        message.data: 将被post的数据；
        message.result: post返回的数据
        message.done: 执行状态，true：成功，false：失败.
        */
        if (message.done) {
            dtd.resolve(message);
        } else {
            dtd.reject(message);
        }
    };

    if (window.detachEvent) {
        window.detachEvent('onmessage', obj['messagecallback']);
        window['messagecallback'] = null;
    } else
        window.removeEventListener('message', callback, false);
    Nagu.Messenger.onmessage = callback;


    Nagu.Messenger.send(message);

    return dtd.promise();
};
ConceptManager.prototype.get = function (id) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var result = ConceptManager.getCachedConcept(id);
    if (result === undefined || result == null) {
        if (this.opts.useIframe) {
            ConceptManager.send({
                url: "http://nagu.cc/ConceptApi/Get/" + id
            }, this.opts.iframeId).done(function (message) {
                if (message.done) {
                    ConceptManager.setCachedConcept(message.result);
                    dtd.resolve(message.result);
                } else {
                    dtd.reject();
                }
            });
        } else {
            $.getJSON(this.host + "/ConceptApi/Get/" + id).done(function (concept) {
                ConceptManager.setCachedConcept(concept);
                dtd.resolve(concept);
            }).fail(function () {
                dtd.reject();
            });
        }
    }
    else {
        dtd.resolve(ConceptManager.getCachedConcept(id));
    }
    return dtd.promise(); // 返回promise对象
}
ConceptManager.prototype.create = function (fn, desc, options) {
    var defaults = {
        id: '',
        appId: '',//"00000000-0000-0000-0000-000000000000",
        typeId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);


    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象    
    if (opts.id === undefined || opts.id == null || opts.id == "") {
        $.post(this.host + "/ConceptApi/Create/", {
            fn: fn,
            desc: desc,
            appId: opts.appId,
            typeId: opts.typeId
        }).done(function (c) {
            //ConceptManager.ConceptCache[c.ConceptId] = c;
            ConceptManager.setCachedConcept(c);
            dtd.resolve(c);
        }).fail(function () { alert('ConceptManager.create失败'); dtd.reject(); });
    } else {
        $.post(this.host + "/ConceptApi/Create/", { id: opts.id, fn: fn, desc: desc, appId: opts.appId }).done(function (c) {
            //ConceptManager.ConceptCache[c.ConceptId] = c;
            ConceptManager.setCachedConcept(c);
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
ConceptManager.prototype.addConceptPropertyValue = function (subject, stype, propertyId, objectFn, objectId, options) {
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
                sm.create(subject, stype, propertyId, newc.ConceptId, Nagu.MType.Concept, opts.appId).done(function (fs) { dtd.resolve(fs); });
            });
        }
        return dtd.promise();
    }
};

// 为Concept添加一个类型为Concept的属性值，新的。
ConceptManager.prototype.addConceptPropertyValue2 = function (subject, propertyId, objectId, options) {
    var defaults = {
        appId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    return Nagu.SM.create(subject, Nagu.MType.Concept, propertyId, objectId, Nagu.MType.Concept, opts.appId);

};



// 为Concept添加一个类型为Literal的属性值
ConceptManager.prototype.addLiteralPropertyValue = function (subject, propertyId, object, options) {
    var defaults = {
        appId: "00000000-0000-0000-0000-000000000000"
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象   
    var sm = new StatementManager();
    sm.create(subject, Nagu.MType.Concept, propertyId, object, Nagu.MType.Literal, opts.appId).done(function (fs) {
        dtd.resolve(fs); 
    });
    return dtd.promise();
};

ConceptManager.prototype.flush = function (conceptId) {
    ConceptManager.removeCachedConcept(conceptId);
}

ConceptManager.prototype.getPropertiesAndValues = function (conceptId, options) {
    var defaults = {
        appId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

//    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象   
    return $.post(host + '/MorphemeApi/GetPropertiesAndValues', {
        subjectId: conceptId,
        appId: opts.appId
    });
//    return dtd.promise();
};

ConceptManager.prototype.addProperty = function (conceptId, propertyId, options) {
    var defaults = {
        appId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    return $.post('/ConceptApi/AddProperty/' + conceptId, {
        propertyId: propertyId,
        appId: opts.appId
    });
};

ConceptManager.prototype.format = function (conceptId) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    this.isImage(conceptId).done(function (isImage) {
        if (isImage) {
            return '<img src="{ac6dc594-20b3-4f94-b628-a3a098c49308}" />';
        } else {
            $.post('/ConceptApi/GetFormatString/' + conceptId);
        }
    });
};


ConceptManager.prototype.isImage = function (conceptId) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象   
    $.post('/ConceptApi/IsInstanceOf/' + conceptId, {
        typeId: Nagu.Concepts.NaguImage
    }).done(function (data) {
        dtd.resolve(data.isInstanceOf);
    });
    return dtd.promise();
};

ConceptManager.PropertyAndValues = [];
ConceptManager.prototype.getPropertyValues = function (conceptId, propertyId, options) {
    var defaults = {
        appId: '',
        flush: false
    };
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred();

    if (opts.flush) ConceptManager.PropertyAndValues[conceptId + propertyId] = undefined;

    if (ConceptManager.PropertyAndValues[conceptId + propertyId] !== undefined)
        dtd.resolve(ConceptManager.PropertyAndValues[conceptId + propertyId]);
    else {
        $.post('/MorphemeApi/GetPropertyValues/', {
            subjectId: conceptId,
            propertyId: propertyId,
            appId: opts.appId
        }).done(function (fss) {
            ConceptManager.PropertyAndValues[conceptId + propertyId] = fss;
            dtd.resolve(fss);
        });
    }
    return dtd.promise();
    
}

ConceptManager.prototype.search = function (fn, typeId) {
    return $.post('/ConceptApi/Search/', {
        term: fn,
        typeId: typeId
    })
}

ConceptManager.getCachedConcept = function (cid) {
    if ($.jStorage && $.jStorage.storageAvailable()) {
        return $.jStorage.get('concept_' + cid, null);
    } else {
        return ConceptManager.ConceptCache[cid];
    }
};

ConceptManager.setCachedConcept = function (concept) {
    if ($.jStorage && $.jStorage.storageAvailable()) {
        $.jStorage.set('concept_' + concept.ConceptId, concept, {
            // 默认存储时间为3天，为避免同时刷新，增加2个小时之内的随机时间
            TTL: 259200000 + 7200000*Math.random() 
        });
    } else {
        ConceptManager.ConceptCache[concept.ConceptId] = concept;
    }
};

ConceptManager.removeCachedConcept = function (cid) {
    if ($.jStorage && $.jStorage.storageAvailable()) {
        $.jStorage.set('concept_' + cid, undefined);
    } else {
        ConceptManager.ConceptCache[cid] = undefined;
    }
};




/***Morpheme操作*****************************************************************************************************************************/
function MorphemeManager(options){
}

MorphemeManager.Cache = new Array();
MorphemeManager.getCachedConcept = function (mid) {
    if ($.jStorage && $.jStorage.storageAvailable()) {
        return $.jStorage.get('morpheme_' + cid, null);
    } else {
        return MorphemeManager.Cache[cid];
    }
};

MorphemeManager.setCachedConcept = function (morpheme) {
    var mid;
    if (morpheme.ConceptId) mid = morpheme.ConceptId;
    else if (morpheme.StatementId) mid = morpheme.StatementId;
    else alert('setCachedConcept error!');

    if ($.jStorage && $.jStorage.storageAvailable()) {
        $.jStorage.set('morpheme_' + mid, morpheme, {
            // 默认存储时间为3天，为避免同时刷新，增加2个小时之内的随机时间
            TTL: 259200000 + 7200000 * Math.random()
        });
    } else {
        MorphemeManager.Cache[mid] = morpheme;
    }
};

MorphemeManager.removeCachedConcept = function (mid) {
    if ($.jStorage && $.jStorage.storageAvailable()) {
        $.jStorage.set('morpheme_' + mid, undefined);
    } else {
        MorphemeManager.Cache[mid] = undefined;
    }
};


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
StatementManager.prototype.create = function (subjectId, stype, predicateId, object, otype, appId) {
    var params = {
        subjectId: subjectId,
        stype: stype,
        predicateId: predicateId,
        object: object,
        otype: otype,
        appId: appId
    };
    return $.post("/StatementApi/Create", params);
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
        appId: ''
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var cacheKey = StatementManager.generateCacheKey('', '', predicateId, objectId, opts.appId);
    if (StatementManager.StatementsCache[cacheKey] === undefined) {
        $.post(this.host + "/MorphemeApi/FindByPO/" + predicateId,
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

StatementManager.prototype.findBySPO = function (subjectId,  predicateId, objectId, options) {
    var defaults = {
        appId: '',
        stype: Nagu.MType.Concept,
        otype: Nagu.MType.Concept
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var cacheKey = StatementManager.generateCacheKey('', subjectId, predicateId, objectId, opts.appId);
    if (StatementManager.StatementsCache[cacheKey] === undefined) {
        $.post(host + "/MorphemeApi/FindBySPO/" + subjectId,
        {
            stype: opts.stype,
            predicateId: predicateId,
            objectId: objectId,
            otype: opts.otype,
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


StatementManager.prototype.findSByPO = function (predicateId, objectId, oType, options) {
    var defaults = {
        appId: ""
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    var cacheKey = StatementManager.generateCacheKey('', '1025', predicateId, objectId, opts.appId);
    if (StatementManager.StatementsCache[cacheKey] === undefined) {
        $.getJSON(host + "/MorphemeApi/FindSByPO/" + predicateId,
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




function propertyValuesFormBaseClass(subject, sType, rdfType, appId) {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    if (appId === undefined) appId = "";
    var cacheKey = 'subject_' + subject + '_rdfType_' + rdfType;
    if (PvsFromBaseClass[subject] === undefined) PvsFromBaseClass[subject] = new Array();
    if (PvsFromBaseClass[subject][rdfType] === undefined) {
        var params = {
            subject: subject,
            mtype: sType,
            rdfType: rdfType,
            appId: appId
        };
        $.getJSON(host + "/MorphemeApi/GetPropertyValuesFormBaseClass/" + subject, params).done(function (pvs) {
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
MemberManager.Cache = new Array();

MemberManager.prototype.getMe = function () {
    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象
    if (MemberManager.me === undefined)
        $.post("/MemberApi/GetMe").done(function (me) {
            log('getMe()::me.ret = ' + me.ret);

            if (me.ret == 0) {
                MemberManager.me = me;
            } else {
                log('getMe()::me.auth = ' + me.auth);
            }
            dtd.resolve(me);
        }).fail(function () { dtd.reject(); });
    else dtd.resolve(MemberManager.me);
    return dtd.promise();
};

MemberManager.prototype.loginFromNagu = function (username, password) {
    return $.post(this.host + "/MemberApi/Login", {
        username: username,
        password: password
    });
};

// 用于检查用户是否已登录
MemberManager.prototype.check = function () {
    var status = {
        nagu: false,
        qc: false,
        weibo: false
    };

    var dtd = $.Deferred(); //在函数内部，新建一个Deferred对象

    try {
        status.qc = QC.Login.check();
    } catch (e) {
    }

    this.getMe().done(function (me) {
        status.nagu = (me.ret == 0);
        dtd.resolve(status);
    }).fail(function () {
        dtd.resolve(status);
    });

    return dtd.promise();
};


MemberManager.prototype.loginFromQC = function (openId, accessToken) {
    return $.post(this.host + "/MemberApi/QQBack/" + openId, {
        accessToken: accessToken
    });
};

MemberManager.ManageableApps = undefined;

// 获取指定用户可管理的App
MemberManager.prototype.manageableApps = function (userId) {
    var dtd = $.Deferred();
    if (MemberManager.ManageableApps === undefined) {
        Nagu.SM.findByPO(Nagu.App.Manager, userId, Nagu.MType.Concept).done(function (fss) {
            MemberManager.ManageableApps = fss;
            dtd.resolve(fss);
        });
    } else {
        dtd.resolve(MemberManager.ManageableApps);
    }
    return dtd.promise();
}

// 添加对指定Concept的收藏
MemberManager.prototype.favorite = function (conceptId) {
    var dtd = $.Deferred();

    this.getMe().done(function (me) {
        Nagu.SM.create(me.Id, Nagu.MType.Concept, Nagu.User.Favorite, conceptId, Nagu.MType.Concept, me.Id).done(function (fs) {
            dtd.resolve(fs);
        });
    });

    return dtd.promise();
};

MemberManager.prototype.logout = function () {
    return $.post("/MemberApi/Logout").done(function (result) {
        MemberManager.me = undefined;
    })
};







/*** WeiboManager 类*****************************************************************************************************************************/
function WeiboManager(options) {
}

WeiboManager.prototype.shorten = function (url_long) {

};











/*** DialogManager 类*****************************************************************************************************************************/
function DialogManager(options) {
}
DialogManager.Cache = new Array();

DialogManager.prototype.get = function (url) {
    var dtd = $.Deferred();


    if ($.jStorage && $.jStorage.storageAvailable()) {

        // 本地存储可用
        var html = $.jStorage.get('dailog' + url, null);
        if (html == null) {
            $.get(url).done(function (data) {
                $.jStorage.set('dailog' + url, data, {
                    // 默认存储时间为3天，为避免同时刷新，增加2个小时之内的随机时间
                    TTL: 259200000 + 7200000 * Math.random()
                });
                dtd.resolve(data);
            });
        } else {
            dtd.resolve(html);
        }
    } else {
        // 本地存储不可用
        if (DialogManager.Cache[url] === undefined) {
            $.get(url).done(function (data) {
                DialogManager.Cache[url] = data;
                dtd.resolve(data);
            });
        } else {
            dtd.resolve(DialogManager.Cache[url]);
        }
    }

    return dtd.promise();
}




function log(text) {
    $('#txtDebug').val($('#txtDebug').val() + text + '\r\n');
}