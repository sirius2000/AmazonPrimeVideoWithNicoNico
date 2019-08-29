
var videoId = "";
var videoInfo = { };
var commentCount = 0;

let COMMENT_LIMIT = 5000;

function GetVideoInfo(){
    videoId = $("#video_id").val();
    videoInfo["isUserVideo"] = !!videoId.match("^sm")

    GetVideoInfoFromVideoPage(videoId);

    var intervals = [
        setInterval(() => {
            if(videoInfo["thread_id"]){
                clearInterval(intervals[0]);
                GetVideoInfoWithURL("http://flapi.nicovideo.jp/api/getthreadkey?thread=" + videoInfo["thread_id"]);
            }
        }, 10),
        setInterval(() => {
            if(videoInfo["thread_id"]){
                clearInterval(intervals[1]);
                GetVideoInfoWithURL("http://flapi.nicovideo.jp/api/getwaybackkey?thread=" + videoInfo["thread_id"]);
            }
        }, 10),
        setInterval(() => {
            if((videoInfo["isUserVideo"] || videoInfo["threadkey"]) &&
                videoInfo["waybackkey"]){
                clearInterval(intervals[2]);
                GetComment();
            }
        }, 10)
    ];
}

function GetVideoInfoWithURL(url){
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var res = xhr.responseText.split("&");
        
            res.forEach((s) => {
                var nameValue = s.split("=");
                var name = nameValue[0];
                var value = nameValue[1];
        
                videoInfo[name] = decodeURIComponent(value);
            });
        }
    }

    xhr.send();
}

function GetComment(time){
    var isNew = !!!time;
    time = isNew ? new Date().getTime() / 1000 : time;

    var postXml ='<thread thread="' + videoInfo["thread_id"] + '" ' +
        'version="20090904" ' +
        'res_from="1000" ' +
        'user_id="' + videoInfo["user_id"] + '" ' + 
        'threadkey="' + videoInfo["threadkey"] + '" ' +
        'when="' + time + '" ' +
        'waybackkey="' + videoInfo["waybackkey"] + '" ' +
        'force_184="1"/>';

    var xhr = new XMLHttpRequest();

    xhr.open("POST", "http://nmsg.nicovideo.jp/api/", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(xhr.responseText, "text/xml");
            var chats = dom.getElementsByTagName("chat");
            var comments = [];
            var minDate = parseInt(chats[0].attributes["date"].value);

            for(var i = 0;i < chats.length;i++){
                var mail = chats[i].attributes["mail"] ? chats[i].attributes["mail"].value : null;
                var comment = {
                    "vpos": chats[i].attributes["vpos"].value,
                    "text": $(chats[i]).text(),
                    "mail": mail
                };
                var date = parseInt(chats[i].attributes["date"].value);

                comments.push(JSON.stringify(comment));
                minDate = date < minDate ? date : minDate;
            }

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    "type": isNew ? "new" : "add",
                    "comments": comments,
                }, null);
                console.log("send comments");
            });

            commentCount = isNew ? comments.length : commentCount + comments.length;

            // 過去ログを遡る
            if(commentCount < COMMENT_LIMIT && chats.length == 1000){
                GetComment(minDate - 1);
            }
        }
    }

    xhr.send(postXml);
}

function GetVideoInfoFromVideoPage(videoId){
    var url = "https://www.nicovideo.jp/watch/" + videoId;
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4){
            var parser = new DOMParser();
            var dom = parser.parseFromString(xhr.responseText, "text/html");
            var watchData = dom.getElementById("js-initial-watch-data");
            var apiDataString = watchData.getAttribute("data-api-data");
            var apiData = JSON.parse(apiDataString);

            videoInfo["user_id"] = apiData.viewer.id;
            videoInfo["thread_id"] = apiData.commentComposite.threads.filter((th)=>{
                return th.isActive && th.isDefaultPostTarget;
            })[0].id;
        }
    }
    xhr.send();
}

$("#ok_button").click(GetVideoInfo);
