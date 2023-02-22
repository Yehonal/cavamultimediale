'use strict';

hwc.include([
    "hwc!{CMDPATH_ROOT}modules/jQuery/jquery.jplayer.min.js"
]).define(function () {
    var $ = this;
    CMD.BgMusic = $.class.use($.Singleton)([
        $.public.static({
            PlayList: {
                main: $.const.CMDPATH_ROOT + 'data/media/wave/main.wav',
                space: $.const.CMDPATH_ROOT + 'data/media/wave/space.wav'
            }
        }),
        $.private({
            currentSong: null,
            player: null
        }),
        $.public({
            __construct: function () {

                this._i.player = $.Browser.JQ('#audio_player').jPlayer({
                    // Tells JPlayer where to find the SWF file.
                    swfPath: $.const.CMDPATH_SRC + 'Jplayer.swf',
                    // Fix for some older Andriod phones.
                    solution: "flash, html",
                    // Tells the player that the track is available in:
                    //         mp3, Ogg Vorbis and Wave formats.
                    supplied: 'wav',
                    loop: true,
                    ended: function () {
                        var bm = CMD.BgMusic.I();
                        bm.play(bm.currentSong, true); // force loop
                    }
                });

                $.EventHandler.I("audio").bind(this.i);
            },
            play: function (file, force) {
                if (this._i.currentSong === file && !force)
                    return;

                this._i.currentSong = file;

                this._i.player.jPlayer("setMedia", {
                    wav: file
                });

                var state = window.localStorage.getItem("music");
                if (state === "false")
                    return;

                this._i.player.jPlayer('play');
            },
            switchAudio: function (enable) {
                this._i.player.jPlayer(enable === true ? "play" : "pause");
            }
        })
    ]);
});