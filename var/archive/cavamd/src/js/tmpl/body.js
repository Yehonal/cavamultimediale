'use strict';

hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/TemplateClass.js",
    "hwc!{CMDPATH_JS}Tools.js"
]).define(function () {
    var $ = this;

    $.global.jQuery = $.global.$ = $.Browser.JQ; // restore global vars for jquery

    CMD.Body = $.class.extends(CMD.TemplateClass)([
        $.private.static({
            instance: null
        }),
        $.private({
            lang: null,
            page: "intro"
        }),
        $.public({
            __construct: function (parent, childs, opt) {
                CMD.Main = this.i; // workaround for singleton
                this.__super(parent, childs, opt, "body");
            },
            update: function () {
                this.__super();
            },
            init: function () {
                var that = this;

                this.__super().then(function () {
                    $.Browser.JQ("#body-wrapper").fadeIn(3000); // this time should be enough to load the content

                    $.Browser.JQ("#project-info-link").prepend('<img src="' + $.const.CMDPATH_MEDIA + 'images/vari/icon-info-red.png" width="15" height="15"/>');
                    $.Browser.Router.I().setRoute("#project-info-link", {component: "project-info", path: ""});

                    that.s.switchAudio(window.localStorage.getItem("music") !== "false");
                });
            },
            build: function () {
                this.__super();
                var that = this;
                this._i.page = this.i.getRouter().getRouteInfo().getComponent() || this._i.page;
                var prev = this.i.getRouter().getPrevRouteInfo();

                // Instructions that must be executed only when new page loaded
                if (!prev || this._i.page != prev.getComponent()) {
                    // this is done before init.__super().then

                    var prevChild = this.i.getChild("content");
                    prevChild && this.i.bindChild("prevContent", prevChild);

                    // bind this component as body child
                    $.Browser.Component.load($.const.CMDPATH_JS + "tmpl/" + this._i.page + ".js", "content", this.i, [])
                        .then(function () {
                            /**
                             *  LEFT BOTTOM BAR AND OTHER CHANGES ON SUBPAGES
                             */
                            if (that._i.page !== "main") {
                                $.Browser.JQ("#bottom-left").empty();
                                $.Browser.JQ("#bottom-center").empty();
                                $.Browser.Loader.load($.const.CMDPATH_SRC + "css/tmpl/body-subpage.css")
                                    .then(function () {
                                        $.Browser.JQ.getJSON($.const.CMDPATH_MEDIA + 'text/bottombar/' + CMD.Language.I().getFPrefix() + 'leftmenu.json',
                                            function (json) {
                                                $.Browser.JQ("#bottom-left")
                                                    .append("<div><a href='javascript:void(0)' id='go-back'>" + json["back"] + "</a></div>"
                                                        + "<div><a id='go-menu'>" + json["menu"] + "</a></div>");

                                                var content = that.i.getChild("content");

                                                $.Browser.Router.I().setRoute("#go-menu", {component: "main", path: ""});
                                                $.Browser.Router.I().setRoute("#go-back", {
                                                    component: (content && content.getParentPage()) ||
                                                        (prev && prev.getComponent()) ||
                                                        "main",
                                                    path: ""
                                                });
                                            }
                                        );
                                    });
                            } else {
                                $.Browser.Loader.removeCss($.const.CMDPATH_SRC + "css/tmpl/body-subpage.css");
                                $.Browser.JQ("#bottom-bar").show();
                            }
                        });
                }

                $.Browser.JQ("#bottom-right").empty();

                /**
                 * RIGHT BOTTOM BAR ITEMS
                 */
                $.Browser.JQ.ajax({
                    type: 'GET',
                    url: $.const.CMDPATH_MEDIA + 'text/bottombar/' + CMD.Language.I().getFPrefix() + 'rightmenu.txt',
                    success: function (myContentFile) {
                        var lines = myContentFile.split("\n");

                        for (var i in lines) {
                            $.Browser.JQ("#bottom-right").append("<a href='#' id='right-btn-" + i + "' class='bottom-item'>" + lines[i] + "</a>");
                            if (i == 1) {
                                $.Browser.Router.I().setRoute("#right-btn-" + i, {component: "project-info", path: ""});
                            } else {
                                CMD.Tools.lockElement("#right-btn-" + i);
                            }
                        }
                    }
                });

            },
            reset: function () {
                return this.i.unbindChild("prevContent");
            },
            getPrevContent: function () {
                return this.i.getChild("prevContent");
            }
        }),
        $.public.static({
            switchAudio: function (enable) {
                enable = (enable === null ? true : enable);
                window.localStorage.setItem("music", enable);
                $.EventHandler.I("audio").trigger("switchAudio", enable);

                $.Browser.JQ("#audio_switch")
                    .empty()
                    .append("<img src='" + $.const.CMDPATH_MEDIA + "images/vari/" + ((enable === true ? "sound" : "no_sound")) + ".png' onclick='CMD.Body.switchAudio(" + Boolean(!enable).toString() + ");'/>");
            }
        })
    ]);

    return CMD.Body;
});
