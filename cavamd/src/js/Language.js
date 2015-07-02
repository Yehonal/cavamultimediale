'use strict';

hwc.include([
    "hwc!{PATH_JS_LIB}browser/language/Language.js"
]).define(function () {
    var $ = this;

    CMD.Language = $.class.extends($.Browser.Language)([
        $.private({
            langs: {"en": "e", "it": "i"}
        }),
        $.public({
            getFPrefix: function () {
                return this._i.langs[this.i.getLang()];
            }
        })
    ]);

    return CMD.Language;

});