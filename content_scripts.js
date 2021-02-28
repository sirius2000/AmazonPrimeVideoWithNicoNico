let POSSITION_TYPE = {
    TOP: 0,
    BOTTOM: 1,
    NORMAL: 2
};

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
};

var COMMENT_CONFIG = {
    NORMAL_BEFORE_TIME: 100,
    NORMAL_AFTER_TIME: 300,
    BOTTOM_TIME: 300,
    TOP_TIME: 300,
    FONT_SIZE_RATE: 0.08, // スクリーンサイズ（幅と高さの大きいほう)に対しての比
    FONT_SIZE_PX: 48, // 実際のフォントサイズ
    ROW_COUNT: 10
};

var AmazonNico = {
    comments: [],
    commentOverlay: null,
    time: {
        hour: 0,
        minute: 0,
        second: 0,
        nicoUnit: 0
    },
    canvas: {
        width: 0,
        height: 0
    },
    ctx: null,
    commentGroup: {
        normal: [],
        top: [],
        bottom: []
    },
    video: null,
    animationId: 0
};

class VideoComment{
    constructor(comment){
        this.comment = comment.text;
        this.vpos = parseInt(comment.vpos);
        this.position = [null, null];

        if(comment.mail){
            var commands = comment.mail.split(" ");
    
            if(commands.indexOf("shita") >= 0){
                this.posType = POSSITION_TYPE.BOTTOM;
            }
            else if(commands.indexOf("naka") >= 0){
                this.posType = POSSITION_TYPE.NORMAL;
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
            case POSSITION_TYPE.TOP:
                this._DisplayTop(time);
                break;
        }
    }

    IsDisplay(time){
        switch(this.posType){
            case POSSITION_TYPE.NORMAL:
                return this.vpos - COMMENT_CONFIG.NORMAL_BEFORE_TIME <= time &&
                    time <= this.vpos + COMMENT_CONFIG.NORMAL_AFTER_TIME;
            case POSSITION_TYPE.BOTTOM:
                return this.vpos <= time && time <=this.vpos + COMMENT_CONFIG.BOTTOM_TIME;
            case POSSITION_TYPE.TOP:
                return this.vpos <= time && time <=this.vpos + COMMENT_CONFIG.TOP_TIME;
        }

        return false;
    }

    _DisplayNormal(time){
        if(!this.IsDisplay(time)){
            this._DropNormalGroup();
            return;
        }

        var ctx = AmazonNico.ctx;
        var fontSize = COMMENT_CONFIG.FONT_SIZE_PX

        ctx.font = fontSize + "px 'ＭＳ ゴシック'";
        ctx.strokeStyle = "#000";
        ctx.fillStyle = this.color;

        var width = ctx.measureText(this.comment).width;
        var overlayWidth = AmazonNico.canvas.width;
        var min = this.vpos - COMMENT_CONFIG.NORMAL_BEFORE_TIME;
        var max = this.vpos + COMMENT_CONFIG.NORMAL_AFTER_TIME;
        var t = (time - min) / (max - min);
        var row = this._InsertNormalGroup();
        var x = overlayWidth - (width + overlayWidth) * t;
        var y =  fontSize * (1 + row);

        ctx.strokeText(this.comment, x, y);
        ctx.fillText(this.comment, x, y);

        this.position = [x, y];
    }

    _DisplayBottom(time){
        if(!this.IsDisplay(time)){
            this._DropGroup(AmazonNico.commentGroup.bottom);
            return;
        }

        var ctx = AmazonNico.ctx;
        var fontSize = COMMENT_CONFIG.FONT_SIZE_PX;

        ctx.font = fontSize + "px 'ＭＳ ゴシック'";
        ctx.strokeStyle = "#000";
        ctx.fillStyle = this.color;

        var width = ctx.measureText(this.comment).width;
        var overlayWidth = AmazonNico.canvas.width;
        var overlayHeight = AmazonNico.canvas.height;
        var row = this._InsertGroup(AmazonNico.commentGroup.bottom);
        var x = overlayWidth / 2 - width / 2;
        var y = overlayHeight - fontSize - row * fontSize;

        ctx.strokeText(this.comment, x, y);
        ctx.fillText(this.comment, x, y);

        this.position = [x, y];
    }

    _DisplayTop(time){
        if(!this.IsDisplay(time)){
            this._DropGroup(AmazonNico.commentGroup.top);
            return;
        }

        var ctx = AmazonNico.ctx;
        var fontSize = COMMENT_CONFIG.FONT_SIZE_PX;

        ctx.font = fontSize + "px 'ＭＳ ゴシック'";
        ctx.strokeStyle = "#000";
        ctx.fillStyle = this.color;

        var width = ctx.measureText(this.comment).width;
        var overlayWidth = AmazonNico.canvas.width;
        var row = this._InsertGroup(AmazonNico.commentGroup.top);
        var x = overlayWidth / 2 - width / 2;
        var y = fontSize + row * fontSize;

        ctx.strokeText(this.comment, x, y);
        ctx.fillText(this.comment, x, y);

        this.position = [x, y];
    }

    _InsertNormalGroup(){
        var group = AmazonNico.commentGroup.normal;
        var ctx = AmazonNico.ctx;
        var overlayWidth = AmazonNico.canvas.width;
        var overlayWidthHalf = overlayWidth / 2.0;

        for(var r = 0;r < group.length;r++){
            var index = group[r].indexOf(this);

            if(index >= 0){
                return r;
            }
        }

        for(var r = 0;r < group.length;r++){
            if(group[r].length == 0){
                group[r].push(this);
                return r;
            }

            var tail = group[r][group[r].length - 1];
            ctx.font = COMMENT_CONFIG.FONT_SIZE + "px 'ＭＳ ゴシック'";
            var tailWidth = ctx.measureText(tail.comment).width;

            if(tail.position[0] < overlayWidthHalf - tailWidth / 2.0){
                group[r].push(this);
                return r;
            }
        }

        var min = group[0].length;
        var tempR = 0;
        for(var r = 1;r < group.length;r++){
            if(group[r].length < min){
                min = group[r].length;
                tempR = r;
            }
        }

        group[tempR].push(this);
        return tempR;
    }

    _DropNormalGroup(){
        var group = AmazonNico.commentGroup.normal;

        for(var r = 0;r < group.length;r++){
            var index = group[r].indexOf(this);

            if(index >= 0){
                group[r].splice(index, 1);
            }
        }
    }

    _InsertGroup(group){
        var index = group.indexOf(this);

        if(index >= 0){
            return index % COMMENT_CONFIG.ROW_COUNT;
        }

        var i;
        for(i = 0;i < group.length;i++){
            if(group[i] == null){
                group[i] = this;
                return i % COMMENT_CONFIG.ROW_COUNT;
            }
        }

        group.push(this);

        return i % COMMENT_CONFIG.ROW_COUNT;
    }

    _DropGroup(group){
        var index = group.indexOf(this);

        if(index < 0){
            return;
        }

        group[index] = null;
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        switch(request.type){
            case "new":
                NewComment(request);
                break;
            case "add":
                AddComment(request);
                break;
        }
    }
);

function NewComment(request){
    AmazonNico.comments = [];

    if(!AmazonNico.commentOverlay){
        AmazonNico.commentOverlay = $("<canvas>").attr('id', 'comment_overlay');
        $(".atvwebplayersdk-overlays-container").append(AmazonNico.commentOverlay);
    }

    var overlay = document.getElementById('comment_overlay');
    AmazonNico.canvas = overlay;
    AmazonNico.ctx = overlay.getContext('2d');

    var videos = $("video");
    // 広告があるとvideoが2つある
    AmazonNico.video = videos[videos.length - 1];

    for(var i = 0;i < request.comments.length; i++){
        AmazonNico.comments.push(new VideoComment(JSON.parse(request.comments[i])));
    }

    AmazonNico.comments.sort((a, b) => {
        return a.vpos - b.vpos;
    });

    var videoTimes = $(".atvwebplayersdk-timeindicator-text").text().split(" / ");
    var videoTime0 = GetVideoTime(videoTimes[0]);
    var videoTime1 = GetVideoTime(videoTimes[1]);

    AmazonNico.time.hour = videoTime0.hour + videoTime1.hour;
    AmazonNico.time.minute = videoTime0.minute + videoTime1.minute;
    AmazonNico.time.second = videoTime0.second + videoTime1.second;
    AmazonNico.time.nicoUnit = videoTime0.nicoUnit + videoTime1.nicoUnit;

    console.log("get comments");

    cancelAnimationFrame(AmazonNico.animationId);

    InitializeCommentGroup();
    ShowComment();
}

function AddComment(request){
    for(var i = 0;i < request.comments.length; i++){
        AmazonNico.comments.push(new VideoComment(JSON.parse(request.comments[i])));
    }

    console.log("add comment");
}

function InitializeCommentGroup(){
    AmazonNico.commentGroup.normal = [];
    AmazonNico.commentGroup.top = [];
    AmazonNico.commentGroup.bottom = [];
    for(var i = 0;i < COMMENT_CONFIG.ROW_COUNT;i++){
        AmazonNico.commentGroup.normal.push([]);
    }
}

function ShowComment(){
    if(!AmazonNico.commentOverlay){
        return;
    }

    AmazonNico.animationId = requestAnimationFrame(ShowComment);

    var overlayWidth = AmazonNico.commentOverlay.innerWidth();
    var overlayHeight = AmazonNico.commentOverlay.innerHeight();
    AmazonNico.canvas.width = overlayWidth;
    AmazonNico.canvas.height = overlayHeight;
    AmazonNico.ctx.clearRect(0, 0, overlayWidth, overlayHeight);
    COMMENT_CONFIG.FONT_SIZE_PX = Min(overlayWidth, overlayHeight) * COMMENT_CONFIG.FONT_SIZE_RATE;
    console.log(COMMENT_CONFIG.FONT_SIZE_PX);

    if(!AmazonNico.video){
        return;
    }

    // Amazon PrimeのvideoはなぜかcurrentTime=10から始まる
    var nicoTime = (AmazonNico.video.currentTime - 10) * 100;

    for(var i = 0;i < AmazonNico.comments.length;i++){
        AmazonNico.comments[i].Display(nicoTime);
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

function Min(){
    if(!arguments.length){
        return null;
    }

    var res = arguments[0];

    for(var i = 1; i < arguments.length; i++){
        if(arguments[i] < res){
            res = arguments[i];
        }
    }

    return res;
}
