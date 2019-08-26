
var videoId = "so35377363";

var videoInfo = { };
var comments = [];

function GetVideoInfo(){
    GetVideoInfoWithURL("http://flapi.nicovideo.jp/api/getflv/" + videoId);

    setTimeout(() => {
        if(videoInfo["thread_id"]){
            GetVideoInfoWithURL("http://flapi.nicovideo.jp/api/getthreadkey?thread=" + videoInfo["thread_id"])

            setTimeout(() => {
                if(videoInfo["threadkey"]){
                    GetComment();
                }
                else{
                    alert("threadkeyが取得できませんでした。");
                }
            }, 4000);
        }
        else{
            alert("thread_idが取得できませんでした。");
        }
    }, 4000);
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

function GetComment(){
    var postXml ='<thread thread="' + videoInfo["thread_id"] + '" ' +
        'version="20090904" ' +
        'res_from="1000" ' +
        'user_id="' + videoInfo["user_id"] + '" ' + 
        'threadkey="' + videoInfo["threadkey"] + '" ' +
        'force_184="1"/>';

    var xhr = new XMLHttpRequest();

    xhr.open("POST", "http://nmsg.nicovideo.jp/api/", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(xhr.responseText, "text/xml");
            var chats = dom.getElementsByTagName("chat");

            for(var i = 0;i < chats.length;i++){
                var mail = chats[i].attributes["mail"] ? chats[i].attributes["mail"].value : null;
                var comment = {
                    "vpos": chats[i].attributes["vpos"].value,
                    "text": $(chats[i]).text(),
                    "mail": mail
                };

                comments.push(JSON.stringify(comment));
            }

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {"comments": comments}, null);
                console.log("send comments");
            });
        }
    }

    xhr.send(postXml);
}

$("#ok_button").click(GetVideoInfo);
