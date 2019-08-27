let POSSITION_TYPE = {
    TOP: 0,
    MIDDLE: 1,
    BOTTOM: 2,
    NORMAL: 3
}

let COLOR = {
    white: "#fff",
    red: "red",
    pink: "#ff8080",
    orange: "#ffc000",
    yellow: "#ff0",
    green: "#0f0",
    cyan: "#0ff",
    blue: "#00f",
    purple: "#c000ff",
    black: "#000"
}

let COMMENT_CONFIG = {
    NORMAL_BEFORE_TIME: 200,
    NORMAL_AFTER_TIME: 200
}

var AmazonNico = {
    comments: [],
    commentOverlay: null,
    time: {
        hour: 0,
        minute: 0,
        second: 0,
        nicoUnit: 0
    },
    canvas: null,
    ctx: null
}

class VideoComment{
    constructor(comment){
        this.comment = comment.text;
        this.vpos = parseInt(comment.vpos);
        this.topRate = 0.1 + Math.random() * 0.9;

        if(comment.mail){
            var commands = comment.mail.split(" ");
    
            if(commands.indexOf("shita") >= 0){
                this.posType = POSSITION_TYPE.BOTTOM;
            }
            else if(commands.indexOf("naka") >= 0){
                this.posType = POSSITION_TYPE.MIDDLE;
            }
            else if(commands.indexOf("ue") >= 0){
                this.posType = POSSITION_TYPE.TOP;
            }
            else{
                this.posType = POSSITION_TYPE.NORMAL;
            }
    
            for (let [key, value] of Object.entries(COLOR)) {
                if(commands.indexOf(key) >= 0){
                    this.color = COLOR[key];
                }
            }
            if(!this.color){
                this.color = COLOR.white;
            }
        }
        else{
            this.posType = POSSITION_TYPE.NORMAL;
            this.color = COLOR.white;
        }
    }

    SetPosition(time){
        if(this.posType == POSSITION_TYPE.NORMAL){
            this._SetNormalPosition(time);
        }
    }

    _SetNormalPosition(time){
        if((this.vpos - COMMENT_CONFIG.NORMAL_BEFORE_TIME) > time ||
            time > (this.vpos + COMMENT_CONFIG.NORMAL_AFTER_TIME)){
            return;
        }

        var ctx = AmazonNico.ctx;
        var width = ctx.measureText(this.comment).width;
        var overlayWidth = AmazonNico.commentOverlay.innerWidth();
        var overlayHeight = AmazonNico.commentOverlay.innerHeight();
        var min = this.vpos - COMMENT_CONFIG.NORMAL_BEFORE_TIME;
        var max = this.vpos + COMMENT_CONFIG.NORMAL_AFTER_TIME;
        var t = (time - min) / (max - min);
        var x = overlayWidth - (width + overlayWidth) * t;
        var y = this.topRate * overlayHeight;

        AmazonNico.ctx.font = "48px 'ＭＳ ゴシック'";
        AmazonNico.ctx.strokeStyle = "#000";
        AmazonNico.ctx.fillStyle = this.color;
        ctx.strokeText(this.comment, x, y);
        ctx.fillText(this.comment, x, y);
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        AmazonNico.comments = [];

        if(!AmazonNico.commentOverlay){
            AmazonNico.commentOverlay = $("<canvas>").attr('id', 'comment_overlay');
            $(".overlaysContainer").append(AmazonNico.commentOverlay);
        }

        var overlay = document.getElementById('comment_overlay');
        AmazonNico.canvas = overlay;
        AmazonNico.ctx = overlay.getContext('2d');

        for(var i = 0;i < request.comments.length; i++){
            AmazonNico.comments.push(new VideoComment(JSON.parse(request.comments[i])));
        }

        var videoTimes = $(".time").text().split(" / ");
        var videoTime0 = GetVideoTime(videoTimes[0]);
        var videoTime1 = GetVideoTime(videoTimes[1]);

        AmazonNico.time.hour = videoTime0.hour + videoTime1.hour;
        AmazonNico.time.minute = videoTime0.minute + videoTime1.minute;
        AmazonNico.time.second = videoTime0.second + videoTime1.second;
        AmazonNico.time.nicoUnit = videoTime0.nicoUnit + videoTime1.nicoUnit;

        ShowComment();
    }
);

function ShowComment(){
    if(!AmazonNico.commentOverlay){
        return;
    }

    requestAnimationFrame(ShowComment);

    var overlayWidth = AmazonNico.commentOverlay.innerWidth();
    var overlayHeight = AmazonNico.commentOverlay.innerHeight();
    AmazonNico.canvas.width = overlayWidth;
    AmazonNico.canvas.height = overlayHeight;
    AmazonNico.ctx.clearRect(0, 0, overlayWidth, overlayHeight);

    var videos = $("video");
    // 広告があるとvideoが2つある
    var video = $(videos[videos.length - 1]);

    if(!video){
        return;
    }

    // Amazon PrimeのvideoはなぜかcurrentTime=10から始まる
    var nicoTime = ($("video")[0].currentTime - 10) * 100;

    for(var i = 0;i < AmazonNico.comments.length;i++){
        AmazonNico.comments[i].SetPosition(nicoTime);
    }
}

function GetVideoTime(timeString){
    var time = {
        hour: 0,
        minute: 0,
        second: 0,
        nicoUnit: 0
    }

    var re = /(\d\d?):(\d\d?):(\d\d?)/
    var times = timeString.match(re);

    if(times){
        time.hour = Number(times[1]);
        time.minute = Number(times[2]);
        time.second = Number(times[3]);
    }
    else{
        re = /(\d\d?):(\d\d?)/
        times = timeString.match(re);

        time.hour = 0;
        time.minute = Number(times[1]);
        time.second = Number(times[2]);
    }

    time.nicoUnit = GetNicoUnitTime(time.hour, time.minute, time.second);

    return time;
}

function GetNicoUnitTime(hour, minute, second){
    return hour * 60 * 60 * 100 +
        minute * 60 * 100 +
        second * 100;
}

function ShowNormalComment(){

}
