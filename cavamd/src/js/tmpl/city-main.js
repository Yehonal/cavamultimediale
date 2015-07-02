hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/SlidingPage.js"
]).define(function () {
    var $ = this;

    CMD.CityMain = $.class.extends(CMD.SlidingPage)([
        $.public({
            __construct: function (parent, childs, opt) {
                this.i.parentPage = "main";
                this.__super(parent, childs, opt, "city-main");
            },
            init: function () {
                return this.__super().then(function () {
                    // After animation

                    // if music is terminated, restart it
                    CMD.BgMusic.I().play(CMD.BgMusic.PlayList.main);

                    var lPrefix = CMD.Language.I().getFPrefix();

                    $.Browser.JQ("#city-north").append(
                        "<a id='city-yesterday-link' href='javascript:void(0)'>" +
                        "<div id='city-yesterday' class='city-gallery-button'>" +
                        "<img src='" + $.const.CMDPATH_MEDIA + "images/cittcava/" + lPrefix + "m1.bmp'/>" +
                        "</div>" +
                        "</a>"
                        );

                    $.Browser.Router.I().setRoute("#city-yesterday-link", {component: "city-gallery", path: "cavaieri-img-1"});

                    $.Browser.JQ("#city-south").append(
                        "<a id='city-today-link' href='javascript:void(0)'>" +
                        "<div id='city-today' class='city-gallery-button'>" +
                        "<img id='"+lPrefix+"-today-btn-hover' src='" + $.const.CMDPATH_MEDIA + "images/cittcava/" + lPrefix + "m2.bmp'/>" +
                        "</div>" +
                        "</a>"
                        );

                    $.Browser.Router.I().setRoute("#city-today-link", {component: "city-gallery", path: "cavaoggi-img-1"});


                    // loaded at "update" in this way the effect is the same as original app
                    $.Browser.JQ("#city-text").load($.const.CMDPATH_MEDIA + "text/ccav/" + lPrefix + "benv.txt", function () {
                        $.Browser.DOMTools.removeScrollBar("#city-text");

                        $.Browser.JQ("#city-text-scroll").append("<img id='city-text-scroll-up' src='" + $.const.CMDPATH_MEDIA + "images/vari/fup.png'/>");
                        $.Browser.JQ("#city-text-scroll").append("<img id='city-text-scroll-down' src='" + $.const.CMDPATH_MEDIA + "images/vari/fdown.png' />");

                        var ele = $.Browser.JQ('#city-text');
                        var scroll = 15, speed = 150, int00;

                        $.Browser.JQ('#city-text-scroll-up').mousedown(function () {
                            // Scroll the element up
                            ele.scrollTop(ele.scrollTop() - scroll); // first scroll at click
                            int00 = setInterval(function () {
                                ele.scrollTop(ele.scrollTop() - scroll);
                            }, speed);
                        }).mouseup(function () {
                            clearInterval(int00);
                        }).mouseout(function () {
                            clearInterval(int00);
                        });

                        $.Browser.JQ('#city-text-scroll-down').mousedown(function () {
                            // Scroll the element up
                            ele.scrollTop(ele.scrollTop() + scroll); // first scroll at click
                            int00 = setInterval(function () {
                                ele.scrollTop(ele.scrollTop() + scroll);
                            }, speed);
                        }).mouseup(function () {
                            clearInterval(int00);
                        }).mouseout(function () {
                            clearInterval(int00);
                        });
                    });
                });
            },
            __destruct: function () {
                this.__super();

                $.Browser.JQ("#city-page").remove();
            },
            build: function () {
                this.__super();

                $.Browser.JQ("#city-page").css({
                    "background-image": "url('" + $.const.CMDPATH_MEDIA + "images/cittcava/" + CMD.Language.I().getFPrefix() + "imgmain.jpg')"
                });
            }
        })
    ]);

    return CMD.CityMain;

});