hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/StandardPage.js",
    "hwc!{CMDPATH_ROOT}modules/jQuery/jquery.marquee.js"
]).define(function () {
    var $ = this;


    CMD.Main = $.class.extends(CMD.StandardPage)([
        $.private({
            headInterval: null
        }),
        $.public({
            __construct: function (parent, childs, opt) {
                this.__super(parent, childs, opt, "main");
            },
            init: function () {
                return this.__super();
            },
            build: function () {
                this.__super();

                switch (CMD.Language.I().getLang()) {
                    case "en":
                        var flags = ["ita", "eng_sel"];
                        break;
                    default:
                        var flags = ["ita_sel", "eng"];
                }

                var curr = this.i.getRouter().getRouteInfo().getComponent();
                var prev = this.i.getRouter().getPrevRouteInfo();

                // Instructions that must be executed only when new page loaded
                if (this.i.state === this.s.stateType.INIT) {
                    for (i = 1; i <= 10; i++) {
                        $.Browser.JQ("#main-header").append(
                            "<div>" +
                            "<img src='" + $.const.CMDPATH_MEDIA + "images/main/" + i + ".bmp' alt='1'/>" +
                            "</div>"
                            );
                    }

                    $.Browser.JQ("#main-header > div:gt(0)").hide();

                    this._i.headInterval = setInterval(function () {
                        $.Browser.JQ('#main-header > div:first')
                            .fadeOut(0)
                            .next()
                            .fadeIn(0)
                            .end()
                            .appendTo('#main-header');
                    }, 200);

                    var page = ["city-main"];

                    for (var i = 1; i <= 6/*page.length*/; i++) {
                        $.Browser.JQ("#main-center").append(
                            "<a id='page-" + i + "' href='javascript:void(0)'>" +
                            "<div class='main-menuitem' style='margin-left:" + (i - 1) * 103 + "px' onmouseover='CMD.Main.menuOver(" + i + ",true)' onmouseout='CMD.Main.menuOver(0,false)'>" +
                            "   <img id='main-menuimg-" + i + "' class='main-menuitem-img' src='" + $.const.CMDPATH_MEDIA + "images/main/m" + i + ".bmp'/>" +
                            "</div>" +
                            "</a>"
                            );

                        if (i <= page.length) {
                            $.Browser.Router.I().setRoute("#page-" + i, {component: page[i - 1]});
                        } else {
                            CMD.Tools.lockElement("#page-" + i);
                        }
                    }

                    CMD.BgMusic.I().play(CMD.BgMusic.PlayList.main);
                }

                // we should clean this elements here only when 
                // lang change or during init
                // when we're switching from main to subpage
                // this job will be done by __destruct
                if (this.i.state === this.s.stateType.INIT || !prev || curr == prev.getComponent()) {
                    $.Browser.JQ("#bottom-left").empty();
                    $.Browser.JQ("#bottom-center").empty();

                    $.Browser.JQ("#bottom-left").append("<div class='main-flag-"+flags[0]+"'><a href='javascript:void(0)' onclick='CMD.Language.I().changeLang(\"it\")' style='cursor: pointer;'><img src='" + $.const.CMDPATH_MEDIA + "images/flags/" + flags[0] + ".png'/></a></div>");
                    $.Browser.JQ("#bottom-left").append("<div class='main-flag-"+flags[1]+"'><a href='javascript:void(0)' onclick='CMD.Language.I().changeLang(\"en\")' style='cursor: pointer;'><img src='" + $.const.CMDPATH_MEDIA + "images/flags/" + flags[1] + ".png'/></a></div>");

                    $.Browser.JQ("#main-center-text").css({
                        "background-image": "url('" + $.const.CMDPATH_MEDIA + "images/main/" + CMD.Language.I().getFPrefix() + "tex.bmp')"
                    });

                    $.Browser.JQ("#bottom-center").append("<div id='bottom-scroll' class='marquee-scroll'></div>");

                    jQuery.ajax({
                        async: true,
                        type: 'GET',
                        url: $.const.CMDPATH_MEDIA + 'text/main/' + CMD.Language.I().getFPrefix() + 'scroll.txt',
                        success: function (myContentFile) {
                            var lines = myContentFile.split("\n");

                            for (var i  in lines) {
                                $.Browser.JQ("#bottom-scroll").append('<div class="js-marquee" style="margin-right: 0px; float: left;">' + lines[i] + '</div>');
                            }

                            $.Browser.JQ('.marquee-scroll').marquee({
                                allowCss3Support: true,
                                //speed in milliseconds of the marquee
                                duration: 5000,
                                //gap in pixels between the tickers
                                gap: 330,
                                delayBeforeStart: 2000,
                                //'left' or 'right'
                                direction: 'left',
                                //true or false - should the marquee be duplicated to show an effect of continues flow
                                duplicated: false
                            });
                        }
                    });
                }
            },
            __destruct: function () {
                this.__super();
                $.Browser.JQ("#main-page").remove();
                window.clearInterval(this._i.headInterval);
            },
            onPageChangeAnim: function () {
                $.Browser.JQ('.marquee-scroll').marquee("pause"); // pause effect of original app
            }
        }),
        /*
         * STATIC METHODS
         */
        $.public.static({
            menuOver: function (i, on) {
                if (on === true)
                    $.Browser.JQ("#main-center-text").css({
                        "display": "block",
                        "background-position": "0% " + (i - 1) * 20 + "%"
                    });
                else
                    $.Browser.JQ("#main-center-text").css({"display": "none"});
            }
        })
    ]);

    return CMD.Main;

});