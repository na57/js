$.fn.naguAccordionGroup = function (title, options) {
    var defaults = {
        clearBefore: true,
        renderBody: function (placeHoder) { }
    };
    // Extend our default options with those provided.    
    var opts = $.extend(defaults, options);
    var ph = $(this).addClass('accordion-group');
    var accordion = ph.parent();

    // 1. accordion-body
    var collapseId = 'collapse_' + randomInt();
    var divBody = newDiv().attr('id', collapseId).addClass('accordion-body collapse').css('height', '0px');
    var divInner = newDiv().addClass('accordion-inner').appendTo(divBody);

    // 2. accordion-heading
    var divHeading = newDiv().addClass('accordion-heading');
    var toggleA = newA().addClass('accordion-toggle').attr('data-toggle', 'collapse');
    toggleA.attr('data-parent', '#' + accordion.attr('id')).attr('href', '#' + collapseId);
    toggleA.text(title).appendTo(divHeading);

    ph.prepend(divBody).prepend(divHeading);

    opts.renderBody(divInner);
};




//$.fn.naguAccodion = function (groups, titles, options) {
//    var defaults = {
//        clearBefore: true
//    };
//    // Extend our default options with those provided.    
//    var opts = $.extend(defaults, options);
//    var ph = $(this).addClass('accordion');
//    $.each(groups, function (i, ag) {
//        ag.naguAccodionGroup(
//    });
//}