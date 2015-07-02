'use strict';

hwc.include([
    "hwc!{PATH_JS_LIB}class/index.js"
]).define(function () {
    var $ = this;

    CMD.Tools = $.class([
        $.public.static({
            // autoplay video
            lockElement: function (el) {
                $.Browser.EventHandler.setEventListner(el, "click", function () {
                    alert(CMD.Language.I().getLang() === "it" ?
                        "Contenuto non ancora disponibile! Lavori in corso..." :
                        "Not available content! Work in progress...");
                });
                $.Browser.JQ(el).addClass("locked");
            }
        })
    ]);

});