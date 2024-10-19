// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

define(["jquery", "core/ajax", "mod_supervideo/player_render"], function($, Ajax, PlayerRender) {
    var progress = {

        ottflix : function(view_id, start_currenttime, elementId, videoid) {
            window.addEventListener('message', function receiveMessage(event) {
                if (event.data.origem == 'OTTFLIX-player' && event.data.name == "progress") {
                    progress._internal_saveprogress(event.data.currentTime, event.data.duration);
                    progress._internal_resize(16, 9);
                }
            });
        },

        youtube : function(view_id, start_currenttime, elementId, videoid, playersize, showcontrols, autoplay) {

            progress._internal_view_id = view_id;

            var playerVars = {
                rel         : 0,
                controls    : showcontrols,
                autoplay    : autoplay,
                playsinline : 1,
                start       : start_currenttime ? start_currenttime : 0,
            };

            if (YT && YT.Player) {
                var player = new YT.Player(elementId, {
                    suggestedQuality : 'large',
                    videoId          : videoid,
                    width            : '100%',
                    playerVars       : playerVars,
                    events           : {
                        'onReady'       : function(event) {

                            var sizes = playersize.split("x");
                            if (sizes && sizes[1]) {
                                progress._internal_resize(sizes[0], sizes[1]);
                            } else {
                                progress._internal_resize(16, 9);
                            }

                            document.addEventListener("setCurrentTime", function(event) {
                                player.seekTo(event.detail.goCurrentTime);
                            });
                        },
                        'onStateChange' : function(event) {
                            console.log(event)
                        }
                    }
                });

                window.ytplayer = player
                // console.log(player.getVideoEmbedCode());
            } else {
                var html =
                        '<div class="alert alert-danger">' +
                        'Error loading the JavaScript at https://www.youtube.com/iframe_api. ' +
                        'Please check for any Security Policy restrictions.' +
                        '</div>';
                $("#supervideo_area_embed").html(html);
            }

            setInterval(function() {
                if (player && player.getCurrentTime != undefined) {
                    progress._internal_saveprogress(player.getCurrentTime(), player.getDuration() - 1);
                }
            }, 150);
        },

        resource_audio : function(view_id, start_currenttime, elementId, fullurl, autoplay, showcontrols) {

            $("body").removeClass("distraction-free-mode");

            progress._internal_view_id = view_id;

            var embedparameters = "";
            if (showcontrols) {
                embedparameters += "controls ";
            }
            if (autoplay) {
                embedparameters += "autoplay ";
            }

            var embed = `<audio ${embedparameters} crossorigin playsinline id="${elementId}_audio"></audio>`;
            $(`#${elementId}`).html(embed);
            progress._error_load(`${elementId}_audio`);
            //$(`#${elementId}_audio`).html(`<source src="${fullurl}">`);
            $(`#${elementId}_audio`).attr("src", fullurl);

            var config = {
                controls :
                    showcontrols ? [
                        'play', 'progress', 'current-time', 'mute', 'volume', 'pip', 'airplay', 'duration'
                    ] : [
                        'play'
                    ],
                tooltips : {controls : showcontrols, seek : showcontrols},
                settings : ['speed', 'loop'],
                autoplay : autoplay ? true : false,
                storage  : {enabled : true, key : "id-" + view_id},
                speed    : {selected : 1, options : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4]},
                seekTime : parseInt(start_currenttime) ? parseInt(start_currenttime) : 0,
            };
            var player = new PlayerRender("#" + elementId + " audio", config);
            player.on("ready", function() {
                if (start_currenttime) {
                    player.currentTime = parseInt(start_currenttime);
                    setTimeout(function() {
                        player.currentTime = parseInt(start_currenttime);
                    }, 1000);

                    if (!autoplay) {
                        player.pause();
                    }
                }
            });

            document.addEventListener("setCurrentTime", function(event) {
                player.currentTime = event.detail.goCurrentTime;
            });

            setInterval(function() {
                progress._internal_saveprogress(player.currentTime, player.duration);
            }, 200);
        },

        resource_video : function(view_id, start_currenttime, elementId, fullurl, autoplay, showcontrols) {

            progress._internal_view_id = view_id;

            var embedparameters = "";
            if (showcontrols) {
                embedparameters += "controls ";
            }
            if (autoplay) {
                embedparameters += "autoplay ";
            }

            var embed = `<video ${embedparameters} crossorigin playsinline id="${elementId}_video"></video>`;
            $(`#${elementId}`).html(embed);
            progress._error_load(`${elementId}_video`);
            // $(`#${elementId}_video`).html(`<source src="${fullurl}">`);
            $(`#${elementId}_video`).attr("src", fullurl);

            var config = {
                controls :
                    showcontrols ? [
                        'play-large', 'play', 'current-time', 'progress', 'duration', 'mute', 'volume',
                        'settings', 'pip', 'airplay', 'fullscreen'
                    ] : [
                        'play-large', 'play'
                    ],
                tooltips : {controls : showcontrols, seek : showcontrols},
                settings : ['speed', 'loop'],
                storage  : {enabled : true, key : "id-" + view_id},
                speed    : {selected : 1, options : [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4]},
                // autoplay : autoplay ? 1 : 0,
                seekTime : parseInt(start_currenttime) ? parseInt(start_currenttime) : 0,
            };
            var player = new PlayerRender("#" + elementId + " video", config);

            player.on("ready", function() {
                if (start_currenttime) {
                    player.currentTime = parseInt(start_currenttime);
                    setTimeout(function() {
                        player.currentTime = parseInt(start_currenttime);
                    }, 1000);

                    if (!autoplay) {
                        player.pause();
                    }
                }
                progress._internal_resize(16, 9);
            });

            var video = document.getElementById(elementId);
            video.addEventListener("loadedmetadata", function(event) {
                progress._internal_resize(video.videoWidth, video.videoHeight);
            });

            document.addEventListener("setCurrentTime", function(event) {
                player.currentTime = event.detail.goCurrentTime;
            });

            setInterval(function() {
                progress._internal_saveprogress(player.currentTime, player.duration);
            }, 200);

            window.videoplayer = player;
        },

        vimeo : function(view_id, start_currenttime, vimeoid, elementId) {

            progress._internal_view_id = view_id;

            var iframe = document.getElementById(elementId);
            var player = new Vimeo.Player(iframe);

            if (start_currenttime) {
                player.setCurrentTime(start_currenttime);
            }

            document.addEventListener("setCurrentTime", function(event) {
                player.setCurrentTime(event.detail.goCurrentTime);
            });

            Promise.all([player.getVideoWidth(), player.getVideoHeight()]).then(function(dimensions) {
                var width = dimensions[0];
                var height = dimensions[1];

                progress._internal_resize(width, height);
            });

            var duration = 0;
            setInterval(function() {
                if (duration > 1) {
                    player.getCurrentTime().then(function(_currenttime) {
                        _currenttime = parseInt(_currenttime);
                        progress._internal_saveprogress(_currenttime, duration);
                    });
                } else {
                    player.getDuration().then(function(_duration) {
                        duration = _duration;
                    });
                }
            }, 300);
        },

        drive : function(view_id, elementId, playersize) {

            progress._internal_view_id = view_id;

            progress._internal_saveprogress(1, 1);

            if (playersize == "4x3" || playersize == 2) {
                progress._internal_resize(4, 3);
            } else if (playersize == "16x9" || playersize == 1) {
                progress._internal_resize(16, 9);
            } else if (playersize == 5) {
                $("body").removeClass("distraction-free-mode");

                progress._internal_resize(100, 640);
            }

            $("#mapa-visualizacao").hide();
        },

        _error_load : function(elementId) {
            function errorF(e) {
                $(`#${elementId}, #mapa-visualizacao`).hide();
                //$("body").removeClass("distraction-free-mode");

                switch (e.target.error.code) {
                    case e.target.error.MEDIA_ERR_ABORTED:
                        $(`#error_media_err_aborted`).show();
                        break;
                    case e.target.error.MEDIA_ERR_NETWORK:
                        $(`#error_media_err_network`).show();
                        break;
                    case e.target.error.MEDIA_ERR_DECODE:
                        $(`#error_media_err_decode`).show();
                        break;
                    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        $(`#error_media_err_src_not_supported`).show();
                        break;
                    default:
                        $(`#error_default`).show();
                        break;
                }
            }

            var videoElem = document.getElementById(elementId);
            videoElem.addEventListener("error", errorF);
        },

        _internal_resize__width  : 0,
        _internal_resize__height : 0,
        _internal_resize         : function(width, height) {
            progress._internal_resize__width = width;
            progress._internal_resize__height = height;

            $(window).resize(progress._internal_max_height__resizePage);
            progress._internal_max_height__resizePage();
        },

        _internal_max_height__resizePage : function() {

            var windowHeight = $(window).height();
            if ($("body").hasClass("distraction-free-mode")) {
                var $supervideoArea = $("#supervideo_area_embed video,#supervideo_area_embed iframe");

                $supervideoArea.css({
                    "max-height" : "inherit",
                    "height"     : "inherit",
                });

                var removeHeight = 44; // $("#distraction-free-mode-header").height();
                console.log(removeHeight);

                var $activity = $(".activity-navigation");
                console.log($activity.is(":hidden"));
                if (!$activity.is(":hidden")) {
                    removeHeight += $activity.height() + 21;
                }
                console.log(removeHeight);

                if (document.getElementById("mapa-visualizacao")) {
                    removeHeight += 12;
                }
                console.log(removeHeight);

                var playerMaxHeight = windowHeight - removeHeight;
                $supervideoArea.css({
                    "max-height" : playerMaxHeight,
                    "height"     : playerMaxHeight
                });
            }
            else {
                if (document.querySelector("#supervideo_area_embed iframe")) {
                    var $supervideo_area_embed = $("#supervideo_area_embed");

                    var maxHeight = $(window).height() - $("#header").height();
                    var width = $supervideo_area_embed.width();
                    var height = (width * progress._internal_resize__height) / progress._internal_resize__width;

                    if (height < maxHeight) {
                        var ratio = (progress._internal_resize__height / progress._internal_resize__width) * 100;
                        $supervideo_area_embed.css({
                            paddingBottom : `${ratio}%`,
                            width         : "100%",
                        });
                    } else {
                        // var newWidth = (maxHeight * progress._internal_resize__width) / progress._internal_resize__height;
                        $supervideo_area_embed.css({
                            // width         : newWidth,
                            // margin        : `0 auto`,
                            height        : maxHeight,
                            maxHeight     : maxHeight,
                            paddingBottom : `0`,
                        });
                    }
                }
            }
        },

        _internal_last_posicao_video : -1,
        _internal_last_percent       : -1,
        _internal_assistido          : [],
        _internal_view_id            : 0,
        _internal_progress_length    : 100,
        _internal_sizenum            : -1,
        _internal_saveprogress       : function(currenttime, duration) {

            currenttime = Math.floor(currenttime);
            duration = Math.floor(duration);

            if (!duration) {
                return 0;
            }

            if (duration && progress._internal_assistido.length == 0) {
                progress._internal_progress_create(duration);
            }

            if (progress._internal_progress_length < 100) {
                posicao_video = currenttime;
            } else {
                var posicao_video = parseInt(currenttime / duration * progress._internal_progress_length);
            }

            if (progress._internal_last_posicao_video == posicao_video) return;
            progress._internal_last_posicao_video = posicao_video;

            if (posicao_video) {
                progress._internal_assistido[posicao_video] = 1;
            }

            var percent = 0;
            for (var j = 1; j <= progress._internal_progress_length; j++) {
                if (progress._internal_assistido[j]) {
                    percent++;
                    $("#mapa-visualizacao-" + j).css({opacity : 1});
                }
            }

            if (progress._internal_progress_length < 100) {
                percent = Math.floor(percent / progress._internal_progress_length * 100);
            }

            if (progress._internal_last_percent == percent) {
                return;
            }
            progress._internal_last_percent = percent;

            if ($("body").hasClass("distraction-free-mode")) {
                if (document.getElementById("mapa-visualizacao")) {
                    if (currenttime > (duration * .95)) {
                        if (progress._internal_sizenum != 1) {
                            $(".activity-navigation").hide();
                            $("#mapa-visualizacao").addClass("fixed-booton");
                            progress._internal_max_height__resizePage();
                            progress._internal_sizenum = 1;
                        }
                    } else {
                        if (progress._internal_sizenum != 2) {
                            $(".activity-navigation").show();
                            $("#mapa-visualizacao").removeClass("fixed-booton");
                            progress._internal_max_height__resizePage();
                            progress._internal_sizenum = 2;
                        }
                    }
                } else {
                    if (progress._internal_sizenum != 3) {
                        $(".activity-navigation").show();
                        $("#mapa-visualizacao").removeClass("fixed-booton");
                        progress._internal_max_height__resizePage();
                        progress._internal_sizenum = 3;
                    }
                }
            }

            if (currenttime) {
                Ajax.call([{
                    methodname : 'mod_supervideo_progress_save',
                    args       : {
                        view_id     : progress._internal_view_id,
                        currenttime : parseInt(currenttime),
                        duration    : parseInt(duration),
                        percent     : parseInt(percent),
                        mapa        : JSON.stringify(progress._internal_assistido)
                    }
                }]);
            }

            if (percent >= 0) {
                $("#seu-mapa-view span").html(percent + "%");
            }
        },

        _internal_progress_create : function(duration) {

            var $mapa = $("#mapa-visualizacao .mapa");
            if (!$mapa.length) {
                return;
            }

            var supervideo_view_mapa = [];
            try {
                var mapa_json_base64 = $mapa.attr('data-mapa');
                if (mapa_json_base64) {
                    supervideo_view_mapa = JSON.parse(atob(mapa_json_base64));
                }
            } catch (e) {
                supervideo_view_mapa = [];
            }

            if (Math.floor(duration) <= 100) {
                progress._internal_progress_length = Math.floor(duration);
            }
            for (var i = 1; i <= progress._internal_progress_length; i++) {
                if (typeof supervideo_view_mapa[i] != "undefined") {
                    progress._internal_assistido[i] = supervideo_view_mapa[i];
                } else {
                    progress._internal_assistido[i] = 0;
                }
                var $mapa_item = $("<div id='mapa-visualizacao-" + i + "'>");
                $mapa.append($mapa_item);

                // Mapa Clique
                var mapaTitle = Math.floor(duration / progress._internal_progress_length * i);

                var hours = Math.floor(mapaTitle / 3600);
                var minutes = (Math.floor(mapaTitle / 60)) % 60;
                var seconds = mapaTitle % 60;

                var tempo = minutes + ":" + seconds;
                if (hours) {
                    tempo = hours + ":" + minutes + ":" + seconds;
                }
                var $mapa_clique =
                        $("<div id='mapa-visualizacao-" + i + "'>")
                            .attr("title", 'Ir para ' + tempo)
                            .attr("data-currenttime", mapaTitle)
                            .click(function() {
                                var _setCurrentTime = $(this).attr("data-currenttime");
                                _setCurrentTime = parseInt(_setCurrentTime);

                                var event = document.createEvent('CustomEvent');
                                event.initCustomEvent('setCurrentTime', true, true, {goCurrentTime : _setCurrentTime});
                                document.dispatchEvent(event);
                            });
                $("#mapa-visualizacao .clique").append($mapa_clique);
            }
        },

        _internal_add : function(accumulator, a) {
            return accumulator + a;
        },

        error_idnotfound : function() {
            $("body").removeClass("distraction-free-mode");
        },

        secondary_navigation : function() {
            var newHeader = $(`<div id="distraction-free-mode-header"></div>`);
            $(`#page-header`).after(newHeader);

            var $back = $("#page-header #page-navbar .crumbs li:first-child a");
            $back.addClass("back-icon");
            newHeader.append($back.clone());

            var $icon = $(".activityiconcontainer.content");
            $icon.addClass("activityiconcontainer-icon");
            newHeader.append($icon.clone());

            var $title = $(".page-header-headings h1");
            $title.addClass("page-header-free");
            newHeader.append($title.clone());

            var $navAdmin = $(".secondary-navigation .navigation .nav-tabs");
            $navAdmin.addClass("free-secondary-navigation");
            newHeader.append($navAdmin.clone());

            var $completionInfo = $("#id-activity-header .completion-info");
            $completionInfo.addClass("completion-free");
            newHeader.append($completionInfo.clone());
        },
    };
    return progress;
});
