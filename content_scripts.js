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
    NORMAL_BEFORE_TIME: 100,
    NORMAL_AFTER_TIME: 300,
    BOTTOM_TIME: 400,
    FONT_SIZE: 48
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
    ctx: null,
    commentGroup: {
        normal: [],
        top: [],
        middle: [],
        bottom: []
    }
}

class VideoComment{
    constructor(comment){
        this.comment = comment.text;
        this.vpos = parseInt(comment.vpos);
        this.topRate = 0.1 + Math.random() * 0.8;
        // 直前の表示位置[x, y]
        this.prePosition = [null, null]

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

    Display(time){
        switch(this.posType){
            case POSSITION_TYPE.NORMAL:
                this._DisplayNormal(time);
                break;
            case POSSITION_TYPE.BOTTOM:
                this._DisplayBottom(time);
                break;
        }
    }

    IsDisplay(time){
        switch(this.posType){
            case POSSITION_TYPE.NORMAL:
                return this.vpos - COMMENT_CONFIG.NORMAL_BEFORE_TIME <= time &&
                    time <= this.vpos + COMMENT_CONFIG.NORMAL_AFTER_TIME;
            case POSSITION_TYPE.BOTTOM:
                return this.vpos <= time && this.vpos + COMMENT_CONFIG.BOTTOM_TIME;
        }

        return false;
    }

    _DisplayNormal(time){
        if(!this.IsDisplay(time)){
            return;
        }

        var ctx = AmazonNico.ctx;

        ctx.font = "48px 'ＭＳ ゴシック'";
        ctx.strokeStyle = "#000";
        ctx.fillStyle = this.color;

        var width = ctx.measureText(this.comment).width;
        var overlayWidth = AmazonNico.commentOverlay.innerWidth();
        var overlayHeight = AmazonNico.commentOverlay.innerHeight();
        var min = this.vpos - COMMENT_CONFIG.NORMAL_BEFORE_TIME;
        var max = this.vpos + COMMENT_CONFIG.NORMAL_AFTER_TIME;
        var t = (time - min) / (max - min);
        var x = overlayWidth - (width + overlayWidth) * t;
        var y = this.topRate * overlayHeight;

        ctx.strokeText(this.comment, x, y);
        ctx.fillText(this.comment, x, y);
    }

    _DisplayBottom(time){
        if(!this.IsDisplay(time)){
            this.prePosition = [null, null];
            return;
        }

        var ctx = AmazonNico.ctx;
        var fontSize = COMMENT_CONFIG.FONT_SIZE;

        ctx.font = fontSize + "px 'ＭＳ ゴシック'";
        ctx.strokeStyle = "#000";
        ctx.fillStyle = this.color;

        var width = ctx.measureText(this.comment).width;
        var overlayWidth = AmazonNico.commentOverlay.innerWidth();
        var overlayHeight = AmazonNico.commentOverlay.innerHeight();
        var x = overlayWidth / 2 - width / 2;
        var y = this.prePosition[1] == null ?
            overlayHeight - fontSize - AmazonNico.commentGroup.bottom.length * fontSize :
            this.prePosition[1];

        ctx.strokeText(this.comment, x, y);
        ctx.fillText(this.comment, x, y);

        AmazonNico.commentGroup.bottom.push(this);
        this.prePosition = [x, y];
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

        AmazonNico.comments.sort((a, b) => {
            return a.vpos - b.vpos;
        });

        var videoTimes = $(".time").text().split(" / ");
        var videoTime0 = GetVideoTime(videoTimes[0]);
        var videoTime1 = GetVideoTime(videoTimes[1]);

        AmazonNico.time.hour = videoTime0.hour + videoTime1.hour;
        AmazonNico.time.minute = videoTime0.minute + videoTime1.minute;
        AmazonNico.time.second = videoTime0.second + videoTime1.second;
        AmazonNico.time.nicoUnit = videoTime0.nicoUnit + videoTime1.nicoUnit;

        console.log("get comments");

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

    ClearCommentGroup();

    var videos = $("video");
    // 広告があるとvideoが2つある
    var video = videos[videos.length - 1];

    if(!video){
        return;
    }

    // Amazon PrimeのvideoはなぜかcurrentTime=10から始まる
    var nicoTime = (video.currentTime - 10) * 100;

    for(var i = 0;i < AmazonNico.comments.length;i++){
        AmazonNico.comments[i].Display(nicoTime);
    }
}

function ClearCommentGroup(){
    AmazonNico.commentGroup.normal = [];
    AmazonNico.commentGroup.top = [];
    AmazonNico.commentGroup.middle = [];
    AmazonNico.commentGroup.bottom = [];
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
