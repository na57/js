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

function newDt(id) {
    return $("<dt></dt>").attr("id", id);
}
function newDd(id) {
    return $("<dd></dd>").attr("id", id);
}
function newDiv(id) {
    return $("<div></div>").attr("id", id);
}