'use strict';

hwc.include([
    "https://www.youtube.com/player_api"
]).define(function (YT) {
    var $ = this;

    CMD.VideoPlayer = $.class([
        $.public.static({
            // autoplay video
            onPlayerReady: function (event) {
                $.EventHandler.I("video_player").trigger("ready", event);
            },
            // when video ends
            onPlayerStateChange: function (event) {
                $.EventHandler.I("video_player").trigger("changed", event);
            }
        })
    ]);

});