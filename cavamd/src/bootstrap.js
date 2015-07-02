'use strict';

var CMD = {}; // cavamd namespace

hwc.const.CMDPATH_ROOT = hwc.const.PATH_ROOT + "cavamd/";
hwc.const.CMDPATH_SRC = hwc.const.CMDPATH_ROOT + "src/";
hwc.const.CMDPATH_JS = hwc.const.CMDPATH_SRC + "js/";
hwc.const.CMDPATH_MEDIA = hwc.const.CMDPATH_ROOT + "data/media/";

hwc.include([
    "hwc!{PATH_JS_LIB}browser/application/Component.js",
    "hwc!{PATH_JS_LIB}browser/application/System.js",
    "hwc!{CMDPATH_JS}Language.js",
    "hwc!{CMDPATH_JS}tmpl/body.js",
    "hwc!{CMDPATH_JS}Navigator.js"
]).define(function () {
    var $ = this;

    //var hwcEvent = new Hw2.Event.getInstance("tmpl_events");

    //Hw2.Navigator.checkPage();
    // we should wait includes before load BgMusic that requires jquery
    $.Browser.Loader.load(hwc.const.CMDPATH_JS + "BgMusic.js")
        .then(function () {
            /**
             * 
             * Starting System
             */
            var system = $.Browser.System.I(true); // get system singleton instance

            system.register("main", CMD.Body, {autoStart: true, selector: "body"});

            system.init();
        });
});

