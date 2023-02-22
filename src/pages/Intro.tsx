import { useNavigate } from 'react-router-dom'
import YouTube from 'react-youtube'
import "./Intro.css"

// hwc.include([
//     "hwc!{CMDPATH_JS}tmpl/prototype/StandardPage.js"
// ]).define(function () {
//     var $ = this;

//     CMD.Intro = $.class.extends(CMD.StandardPage)([
//         $.public({
//             __construct: function (parent, childs, opt) {
//                 this.__super(parent, [], opt, "intro");
//             },
//             init: function () {
//                 var that = this;
//                 this.__super().then(function () {


//                 });
//             },
//             __destruct: function () {
//                 this.__super();
//                 $.Browser.JQ("#nav-bar-center").empty();
//                 $.Browser.JQ("#intro-page").remove();

//                 $.EventHandler.I("audio").unbind(this.i);

//                 $.Browser.JQ("#bottom-bar").removeClass("hidden");
//             },
//             switchAudio: function (enable) {
//                 if (!enable)
//                     CMD.yt_player.mute();
//                 else
//                     CMD.yt_player.unMute();
//             }
//         }),
//         $.public.static({
//             // autoplay video
//             onPlayerReady: function (event) {
//                 event.target.playVideo();
//                 $.EventHandler.I("audio").trigger("switchAudio", window.localStorage.getItem("music") !== "false");
//             },
//             // when video ends
//             onPlayerStateChange: function (event) {
//                 switch (event.data) {
//                     case window.YT.PlayerState.ENDED:
//                     case window.YT.PlayerState.PAUSED:
//                         $.Browser.Router.I().navigate({component: "main"});
//                         break;
//                     case window.YT.PlayerState.PLAYING:
//                         //
//                         break;
//                 }
//             }
//         })
//     ]);

//     window.onYouTubePlayerAPIReady = function () {
//         CMD.yt_player = new window.YT.Player('intro', {
//             height: '480',
//             width: '640',
//             videoId: '5C2SxUJjYEc',
//             playerVars: {
//                 'rel': 0,
//                 'modestbranding': 1,
//                 'showinfo': 1,
//                 'autoplay': 1,
//                 'controls': 0,
//                 'disablekb': 1
//             },
//             events: {
//                 'onReady': CMD.Intro.onPlayerReady,
//                 'onStateChange': CMD.Intro.onPlayerStateChange
//             }
//         });
//     };

//     return CMD.Intro;

// });



const Intro = () => {
    const navigate = useNavigate()

    // $.Browser.JQ.getJSON($.const.CMDPATH_MEDIA + 'text/intro/' + CMD.Language.I().getFPrefix() + 'language.json',
    //     function (json) {
    //         $.Browser.JQ("#nav-bar-center").append("<button type='button' id='skip-intro'>" + json["skip_intro"] + "</button>");
    //         that.i.getRouter().setRoute("#skip-intro", {component: "main"});
    //     }
    // );

    // $.EventHandler.I("audio").bind(that.i);

    // $.Browser.JQ("#hwc_intro").delay("3000").fadeOut("2000", function () {
    //     $.Browser.Loader.load($.const.CMDPATH_JS + "VideoPlayer.js").then(function () {
    //         //Hw2.JQ("#intro").append("<video src='" + HWCPATH_CAVA + "media/avi/0.flv' controls autoplay height='480' width='640'></video>");
    //     });
    // });

    // $.Browser.JQ("#bottom-bar").addClass("hidden");

    return <div id="intro-page" onClick={() => navigate('/home')}>
        <div id="intro">
            <div id="hwc_intro">
                <YouTube videoId='5C2SxUJjYEc'  onPause={() => navigate('/home')}></YouTube>
            </div>
        </div>
    </div>
}

export default Intro