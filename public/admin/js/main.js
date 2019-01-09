
// $(document).ready(function() {

toastr.options = {
    "closeButton": false,
    "debug": false,
    "positionClass": "toast-bottom-left",
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}

// });

var validFiles = ["png", "jpg", "jpeg", "gif"];
function CheckExt(obj) {
    var source = obj.value;
    var ext = source.substring(source.lastIndexOf(".") + 1, source.length).toLowerCase();
    for (var i = 0; i < validFiles.length; i++) {
        if (validFiles[i] == ext)
            break;
    }
    if (i >= validFiles.length) {
        obj.value = "";
        alert("THAT IS NOT A VALID IMAGE\nPlease load an image with an extention of one of the following:\n\n" + validFiles.join(", "));
    }
}

function addCommas(n) {
    n += "";
    x = n.split(".");
    x1 = x[0];
    x2 = x.length > 1 ? "." + x[1] : "";
    for (var t = /(\d+)(\d{3})/; t.test(x1);) x1 = x1.replace(t, "$1,$2");
    return x1 + x2
}

// $(document).on("ready turbolinks:load", Dropzone.discover)

$(document).ready(function () {


    function moveCursorToEnd(input) {
        input.focus();
        var originalValue = input.val();
        input.val('');
        input.blur().focus().val(originalValue);
    }
    $(window).on('shown.bs.modal', function () {

        moveCursorToEnd($('#Name'));
    })

    $.fn.indicator = function (options) {

        var defaults = {

        };

        var options = $.extend(defaults, options);

        return this.each(function () {
            var offset = $(this).offset();
            $("#indicator_" + $(this).attr("id")).remove();
            offset.width = $(this)[0].offsetWidth;
            offset.height = $(this)[0].offsetHeight;
            var indicator = $("<div class='indicator'><div class='load'><hr/><hr/><hr/><hr/></div></div>", {
                "class": "indicator"
            });
            $(indicator).css("width", offset.width);
            $(indicator).css("height", offset.height);
            //$(indicator).css("height", "100%");
            $(indicator).css("top", offset.top);
            $(indicator).css("left", offset.left);
            $(indicator).attr("id", "indicator_" + $(this).attr("id"));



            $(indicator).appendTo($("body"));
        });
    };

    // search
    $('.search').on('keyup', function (event) {
        if (event.keyCode == 13) {
            $('.btn-search').click();
        }
    });
    $('.btn-search').click(function () {
        $('span.search-result, tr.search-result').removeClass('search-result');
        $('.ui').removeHighlight().highlight($('.search').val());
        $('span.ui, tr.ui').hide();
        $('span.search-result, tr.search-result').show();
    })
    $('.btn-search-remove').click(function () {
        // $('.ui').removeHighlight();
        $('span.search-result, tr.search-result').removeClass('search-result');
        $('span.ui, tr.ui').show();
    })
  // search



    if ($.cookie("sidebar") == "mini") {
        $('body').addClass('sidebar-mini');
        md.misc.sidebar_mini_active = true;
    }
    $('#minimizeSidebar').on('click', function () {
        if ($('body').hasClass("sidebar-mini")) {
            $.removeCookie("sidebar");
            $('body').removeClass('sidebar-mini');
            md.misc.sidebar_mini_active = false;
        } else {
            $.cookie("sidebar", "mini");
            $('body').addClass('sidebar-mini');
            md.misc.sidebar_mini_active = true;
        }
    });


    $('.highcharts-legend tspan, .tspan, tspan').each(function () {
        switch ($(this).html()) {
            case 'products':
                $(this).html("محصولات")
                break;
            case 'articles':
                $(this).html("مقالات")
                break;
            case 'categories':
                $(this).html("دسته بندی ها")
                break;
            case 'brands':
                $(this).html("برند ها")
                break;
            case 'home':
                $(this).html("صفحه اصلی")
                break;
            case 'tags':
                $(this).html("تگ ها")
                break;
            case 'Search':
                $(this).html("جستجو ها")
                break;
            case 'page':
                $(this).html("صفحات")
                break;
            default:
                break;
        }
    });


    $("span.price").each(function () {
        var num = $(this).text();
        var commaNum = addCommas(num);
        $(this).text(commaNum).persiaNumber();
    });
    $("span.persian-number").each(function () {
        var num = $(this).text();
        $(this).text(num).persiaNumber();
    });

    //$(function () {
    //    $('.sortable').railsSortable({
    //        placeholder: 'placeholder',
    //        axis: 'y',
    //        items: "> tr",
    //        appendTo: "parent",
    //        helper: "clone",
    //        helper: function (e, tr) {
    //            var $originals = tr.children();
    //            var $helper = tr.clone();
    //            $helper.children().each(function (index) {
    //                $(this).width($originals.eq(index).width())
    //            });
    //            return $helper;
    //        },
    //        start: function (event, ui) {
    //            var cellCount = 0;
    //            $('td, th', ui.helper).each(function () {
    //                var colspan = 1;
    //                var colspanAttr = $(this).attr('colspan');
    //                if (colspanAttr > 1) {
    //                    colspan = colspanAttr;
    //                }
    //                cellCount += colspan;
    //            });
    //            ui.placeholder.html('<td colspan="' + cellCount + '"><div style="height:' + ui.helper.outerHeight() + 'px">&nbsp;</div></td>');
    //            ui.placeholder.height(ui.helper.outerHeight());
    //        },
    //        stop: function (event, ui) {
    //            ui.item.css('display', '')
    //        },
    //        change: function () { }
    //    });
    //});

    //$('div.sortable_photos').railsSortable({
    //    placeholder: 'col-xs-6 col-sm-3 col-md-3 col-lg-2 placeholder',
    //    axis: false,
    //    helper: 'clone',
    //    items: '> .sort_item',
    //    start: function () { },
    //    end: function () { },
    //    change: function () { }
    //});

    // $('.sort_item').mousedown(function () {
    //   var item = $(this),
    //   offset = item.offset(),
    //   margins = {
    //     left: (parseInt(item.css("marginLeft"), 10) || 0),
    //     top: (parseInt(item.css("marginTop"), 10) || 0)
    //   };
    // });

    $('span.ui input[type="checkbox"]').each(function () {
        if (this.checked) {
            var $span = $(this).closest('span');
            $span.addClass('selected');
        }


    })


    // $('span.ui').on('click', 'input[type="checkbox"]', function(e){
    //   var $span = $(this).closest('span');

    //   if(this.checked){
    //     $span.addClass('selected');
    //     $span.find('div.count-input').show();
    //   } else {
    //     $span.removeClass('selected');
    //     $span.find('div.count-input').hide();
    //   }

    //   e.stopPropagation();
    // });

    $("#select_all").on('click', function () {
        if ($(this).hasClass('selected')) {
            $("span.ui.label").not(this).each(function () {
                $(this).find(':checkbox').removeAttr('checked');
                $(this).removeClass('selected');
            })
        } else {
            $("span.ui.label").not(this).each(function () {
                $(this).find(':checkbox').attr('checked', 'checked');
                $(this).addClass('selected');
            })
        }
    })

    $('span.ui.label').on('click', function () {
        if ($(this).hasClass('selected')) {
            $(this).find(':checkbox').removeAttr('checked');
            $(this).removeClass('selected');
        }
        else {
            $(this).find(':checkbox').attr('checked', 'checked');
            $(this).addClass('selected');
        }
    });
})


    