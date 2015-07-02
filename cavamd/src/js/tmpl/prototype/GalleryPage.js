'use strict';

hwc.include([
    "hwc!{CMDPATH_ROOT}modules/jQuery/jquery-ui-1.10.4.custom.js",
    "hwc!{CMDPATH_JS}tmpl/prototype/StandardPage.js",
    "hwc!{PATH_JS_LIB}browser/filesystem/index.js"
]).define(function () {
    var $ = this;

    CMD.GalleryPage = $.class.extends(CMD.TemplateClass)([
        $.private({
            animating: false
        }),
        $.public({
            __construct: function (parent, childs, opt) {
                $.Browser.JQ("#application").prepend("<div id='application-content-trans' class='filled'></div>");
                opt.selector = "#application-content-trans.filled";
                this.__super(parent, childs, opt, "gallery");
            },
            animEffect: function (changingImg, callback) {
                this._i.animating = true;

                var that = this;
                var parent = this.i.parent;

                $.Browser.JQ("#application-content-trans #gallery-image").load(function () {
                    that._i.fixImage("#application-content-trans ");
                    that._i.animating = false;
                    $.Browser.JQ("#application-content-trans #gallery-image").show("scale", {}, 300, function () {
                        $.Browser.JQ(this).css("display", "block");

                        $.Browser.JQ('#application-content').remove();
                        $.Browser.JQ('#application-content-trans').removeClass("filled");
                        $.Browser.JQ('#application-content-trans').attr("id", "application-content");
                        $.Browser.JQ('#application-content-trans').remove();

                        if (!changingImg)
                            parent.reset();

                        callback();
                    });
                });
            },
            init: function () {
                var that = this;
                this.__super().then(function () {
                    return $.Browser.include($.const.CMDPATH_SRC + "css/vendor/jquery/smoothness/jquery-ui-1.10.4.custom.css");
                });
            },
            __destruct: function () {
                this.__super();
                $.Browser.JQ("#gallery-page").remove();
                $.Browser.JQ("#bottom-center").empty();
            },
            build: function () {
                this.__super();
                var that = this;

                var curr = this.i.getRouter().getRouteInfo().getComponent();
                var prevComp = this.i.getRouter().getPrevRouteInfo();
                var changingImg = prevComp && curr == prevComp.getComponent();
                
                var imgCnt=that.i.opt.imgCnt;

                if (this.i.state === this.s.stateType.INIT || changingImg) {
                    var __build = function () {
                        var path = $.Browser.Router.I().getRouteInfo().getPath();
                        var t = path.split("-");
                        var cId = parseInt(t[t.length - 1]);
                        t.pop();
                        var dir = t.join("/") + "/";

                        var sp = "#application-content-trans "; // selector prefix
                        var fPrefix = t[0] === "cavaoggi" ? "t" : "";
                        var prev = dir + fPrefix + (cId - 1);
                        var cur = dir + fPrefix + (cId);
                        var next = dir + fPrefix + (cId + 1);

                        var url = $.const.CMDPATH_MEDIA + "images/" + cur + ".jpg";
                        $.Browser.JQ(sp + "#gallery-image-mask").html("<img id='gallery-image' src='" + url + "'/>");

                        var text = $.const.CMDPATH_MEDIA + "text/" + dir + "d" + CMD.Language.I().getFPrefix() + ".dat";

                        var rows;
                        $.Browser.JQ.ajax({
                            url: text,
                            contentType: 'Content-type: text/plain; charset=iso-8859-1',
                            // This is the imporant part!!!
                            beforeSend: function (jqXHR) {
                                jqXHR.overrideMimeType('text/html;charset=iso-8859-1');
                            },
                            success: function (data) {
                                rows = data.split('\n');
                                var test = rows[cId - 1];
                                $.Browser.JQ(sp + "#gallery-controls-center").text(test);
                            }
                        });

                        //var urlPrev = $.const.CMDPATH_MEDIA + "images/" + prev + ".jpg";
                        if (cId > 1) {
                            $.Browser.JQ(sp + "#gallery-controls-left").html(
                                "<a id='gallery-go-prev' href='javascript:void(0)'>" +
                                "<img src='" + $.const.CMDPATH_MEDIA + "images/vari/fsx.bmp'/>" +
                                "</a>"
                                );

                            $.Browser.Router.I().setRoute(sp + "#gallery-go-prev", {path: t.join("-") + "-" + (cId - 1)});
                        } else {
                            $.Browser.JQ(sp + "#gallery-controls-left").empty();
                        }

                        //var urlNext = $.const.CMDPATH_MEDIA + "images/" + next + ".jpg";
                        //$.Browser.Path.fileExists(urlNext).then(function () {
                        if (cId < imgCnt) {
                            $.Browser.JQ(sp + "#gallery-controls-right").html(
                                "<a id='gallery-go-next' href='javascript:void(0)'>" +
                                "<img src='" + $.const.CMDPATH_MEDIA + "images/vari/fdx.bmp'/>" +
                                "</a>"
                                );

                            $.Browser.Router.I().setRoute(sp + "#gallery-go-next", {path: t.join("-") + "-" + (cId + 1)});
                            $.Browser.Router.I().setRoute(sp + "#gallery-image-mask", {path: t.join("-") + "-" + (cId + 1)});
                        }
                        /*}).fail(function () {
                         $.Browser.JQ(sp + "#gallery-controls-right").empty();
                         });*/

                        that.i.animEffect(changingImg, function () {
                            // Selector prefix is no needed
                            // here because animation-trans has been removed
                            // so shouldn't be duplicated
                            $.Browser.JQ("#gallery-image").load(function () {
                                that._i.fixImage();
                            });

                            $.Browser.JQ("#bottom-center").html("<div id='gallery-start-div'><a href='javascript:void(0)' id='gallery-start'>Start</a></div>");

                            $.Browser.JQ("#gallery-start").click(function () {
                                var el = $.Browser.JQ(this);
                                if (el.hasClass("gallery-started")) {
                                    el.removeClass("gallery-started");
                                    el.text("Start");
                                } else {
                                    el.addClass("gallery-started");
                                    el.text("Stop");
                                }
                            });
                        });
                    }

                    // we should recreate trans div if we're changing gallery image
                    if (changingImg) {
                        $.Browser.JQ("#application").prepend("<div id='application-content-trans' class='filled'></div>");
                        $.Browser.Loader.load($.const.CMDPATH_SRC + "tmpl/gallery.html", __build, {selector: "#application-content-trans.filled"});
                    } else {
                        __build();
                    }
                }
            }
        }),
        $.private({
            fixImage: function (prefix) {
                var el = $.Browser.JQ(prefix + "#gallery-image");

                if (!this._i.animating) {
                    el.show().css("display", "block");
                }

                var h = el.height();
                var w = el.width();
                var landHeight = ((445 - h) / 2);
                var sideWidth = (634 - w) / 2;
                // 478 ( application wrap without borders ) − 33 ( gallery control bar )
                $.Browser.JQ(prefix + "#gallery-image-top").css({height: (landHeight + 1) + "px"});
                $.Browser.JQ(prefix + "#gallery-image-left,#gallery-image-right").css({width: sideWidth + "px"});
                $.Browser.JQ(prefix + "#gallery-page-center").css({height: (h + landHeight + 1) + "px"});
            }

        })
    ]);

    return CMD.GalleryPage;
});