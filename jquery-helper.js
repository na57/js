function newLi(id) {
    if (id == null) {
        return $("<li></li>");
    }
    return $("<li></li>").attr("id", id);
}

function newA(href) {
    if (href == null) {
        return $("<a></a>").attr("href", "javascript:void(0)");
    }
    return $("<a></a>").attr("href", href);
}

function newSpan(id) {
    if (id == null) {
        return $("<span></span>")
    }
    else {
        return $("<span></span>").attr("id", id);
    }
}

function newImg(src) {
    var img = $("<img />");
    if (src == null) {
        return img;
    }
    return img.attr("src", src);
}

function loadingImg() {
    var img = newImg('/Content/Images/loading-18.gif');
    return img.addClass('nagu-loading-img');
}

function loadingImg128() {
    var img = newImg('/Content/Images/loading-128.gif');
    return img.addClass('nagu-loading-img-128');
}


function newDt(id) {
    return $("<dt></dt>").attr("id", id);
}
function newDd(id) {
    return $("<dd></dd>").attr("id", id);
}
function newDiv(id) {
    return $("<div></div>").attr("id", id);
}

function newTag(name, options) {
    var defaults = {
        id: "",
        text: "",
        cssClass: ""
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);

    var e = $('<' + name + '/>');

    if (opts.id != "") e.attr('id', opts.id);
    if (opts.text != "") e.text(opts.text);
    if (opts.cssClass != "") e.addClass(opts.cssClass);

    return e;
}

function newBtn(text) {
    return newTag('button', { text: text }).addClass('btn');
}