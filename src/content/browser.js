var DoubanFmDownload={
    downTaskNum:0,//正在下载的任务
    mp3Key:"",
    mp3UrlInfo:{
        url:"",//url
        mp3Name:"",//歌曲名字
        albumtitle:"",//专辑名字
    },
    fileUtil:{//关于文件处理的一些方法
        checkTopFolderExsit:function(topFolderPath){//检查文件夹是否存在
            var folder = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            folder.initWithPath(topFolderPath);
            if(folder.exists()){
                return true;
            }else{
                return false;
            }
        },
        createFile:function(topFolderPath,bottomFolder,fileName){//创建文件的操作
            var folder = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            folder.initWithPath(topFolderPath);
            folder.append(bottomFolder);
            if(!folder.exists() || !folder.isDirectory()){
                //folder.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0777);
                folder.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0777);
            }
            folder.append(fileName);
            if(!folder.exists()){
                try{
                    folder.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE,0777);
                }catch(e){
                    return null;
                }
            }
            return folder;
        },
        checkFileExsit:function(topFolderPath,bottomFolder,fileName){
            var folder = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            folder.initWithPath(topFolderPath);
            folder.append(bottomFolder);
            if(!folder.exists()){
                return false;
            }
            folder.append(fileName);
            if(!folder.exists()){
                return false;
            }
            return true;
        }
    },
    //打开和关闭的操作
    doubanOpen:function(envent){
        let flag = this.readOnStatus();
        flag = !flag;
        this.setOnStatus(flag);
        if(!flag){
            this.removeMenuIcon();
        }else{
            this.appendMenuIcon();
        }
        this.setOpenMenuStatus();
    },
    //进行设置的操作
    doubanOption:function(){
        window.openDialog("chrome://doubanfmdownload/content/optionDialog.xul","doubanfmdownload-option-dialog","chrome,centerscreen");
    },
    doubanOptionAccept:function(){//
        var save_file = document.getElementById("doubanfm_save_folder_control");
        let tmp = save_file.value;
        if(tmp != ""){
            this.setSaveFolder(tmp);
        }
    },
    doubanOptionCancel:function(){
    },
    doubanOptionInit:function(){
        var save_file = document.getElementById("doubanfm_save_folder_control");
        let value = this.readSaveFolder();
        save_file.value = value;
    },
    doubanOptionFolderChoose:function(){//选择文件
        const nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.init(window, "", nsIFilePicker.modeGetFolder);
        fp.appendFilters(nsIFilePicker.filterAll);
        if(fp.show()==nsIFilePicker.returnOK && fp.file){
            var save_file = document.getElementById("doubanfm_save_folder_control");
            save_file.value = fp.file.path
        }
    },
    init:function(aEvent){
        //读取插件的状态,并设置标签的状态
        this.setOpenMenuStatus();
        var appcontent = document.getElementById("appcontent");
        if(appcontent){
            appcontent.addEventListener("DOMContentLoaded",this.pageLoad,true);
        }
        //加入http的监控器
        this.addToListener();
    },
    pageLoad:function(event){//页面加载的事件
        var doc = event.originalTarget;
        if(doc.nodeName == "#document"){
            if(doc.location.href=="http://douban.fm/"){
                DoubanFmDownload.appendMenuIcon();
            }
        }
    },
    readOnStatus:function(){//读取插件当前的状态,判断是否代开或者关闭
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.doubanfmdownload.");
        try{
            var value = prefs.getBoolPref("on");
        }catch(e){
            prefs.setBoolPref("on",1);
            value = prefs.getBoolPref("on");
        }
        return value;
    },
    readSaveFolder:function(){//读取保存文件的文件夹
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.doubanfmdownload.");
        var retValue = "";
        try{
            retValue = prefs.getCharPref("savefolder"); 
        }catch(e){
            retValue = "";
        }
        return retValue;
       // return "D:\\abc";
    },
    setSaveFolder:function(saveFolder){//设置保存文件的文件夹
        let prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        try{
            prefs = prefs.getBranch("extensions.doubanfmdownload.");
            prefs.setCharPref("savefolder",saveFolder);
        }catch(e){
        }
    },
    setOnStatus:function(boolValue){//设置插件当前状态,设置为打开或者关闭
        var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.doubanfmdownload.");
        if(boolValue){
            prefs.setBoolPref("on",1);
        }else{
            prefs.setBoolPref("on",0);
        }
    },
    setOpenMenuStatus:function(){//设置按钮的状态
        let boolValue = this.readOnStatus();
        let ele = document.getElementById("doubanfmdownload_menu_on_id");
        ele.setAttribute("checked",boolValue);
    },
    appendMenuIcon:function(){//在网页上加上下载按钮
        let flag = this.readOnStatus();
        if(flag){
            let ele = window.content.document.getElementById("fm-header");
            if(ele){
                eles = ele.getElementsByClassName("user-record");
                ele = eles[0];
                if(ele){
                    var newSpanEle = window.content.document.createElement("span");
                    newSpanEle.setAttribute("class","stat-total");
                    newSpanEle.setAttribute("id","html_download_id");
                    newAEle = window.content.document.createElement("a");
                    let jsStr = "javascript:{var evt = document.createEvent('Events');evt.initEvent('DoubanFmDownloadFileEvent', true, false);var ele= document.createTextNode('');document.documentElement.appendChild(ele);ele.dispatchEvent(evt);}";
                    newAEle.setAttribute("href","#");
                    newAEle.setAttribute("onClick",jsStr);
                    //获得字符串
                    let stringBundle = document.getElementById("doubanfmdownload-string-bundle");
                    newAEle.textContent= stringBundle.getString("doubanfmdownload.menue.download");
                    newSpanEle.appendChild(newAEle);
                    //加入任务指示器
                    let downEle = window.content.document.createElement("span");
                    downEle.setAttribute("id","html_downprogress_id");
                    downEle.textContent='['+this.downTaskNum+']downing';
                    newSpanEle.appendChild(downEle);
                    ele.appendChild(newSpanEle);
                }
            }
        }
    },
    removeMenuIcon:function(){//在网页上移除下载按钮
        let flag = this.readOnStatus();
        if(!flag){
            let ele = window.content.document.getElementById("fm-header");
            if(ele){
                eles = ele.getElementsByClassName("user-record");
                ele = eles[0];
                if(ele){
                    let childEle = window.content.document.getElementById("html_download_id");
                    if(childEle){
                        ele.removeChild(childEle);
                    }
                    let downprogressEle = window.content.document.getElementById("html_downprogress_id");
                    if(downprogressEle){
                        ele.removeChild(downprogressEle);
                    }
                }
            }
        }
    },
    setProgressMenu:function(){
        let flag = this.readOnStatus();
        if(flag){
            let downprogressEle = window.content.document.getElementById("html_downprogress_id");
            if(downprogressEle){
                downprogressEle.textContent='['+this.downTaskNum+']downing';
            }
        }
    },
    observe: function(aSubject, aTopic, aData){//监测所有http请求的操作
        if(aTopic == 'http-on-modify-request'){//读取mp3.url
            let regUrl = /http:\/\/([\w.]+\/?)\S*\.(mp3)/
            let url;
            aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
            url = aSubject.URI.spec;
            if(regUrl.test(url) && url.indexOf("douban.com") != -1){
                DoubanFmDownload.mp3Key = url;
                //开始查找列表里的相关信息
                let songList = DoubanFmDownload.traceListenner.songArray;
                for(i=0;i < songList.length;i++){
                    let song = songList[i];
                    if(song.url==DoubanFmDownload.mp3Key){
                        DoubanFmDownload.mp3UrlInfo.url = song.url;
                        DoubanFmDownload.mp3UrlInfo.mp3Name= song.title;
                        DoubanFmDownload.mp3UrlInfo.albumtitle = song.albumtitle;
                    }
                }
            }
        }else if(aTopic == 'http-on-examine-response'){
            let regUrl = /http:\/\/douban.fm\/j\/mine\/playlist.*/
            aSubject.QueryInterface(Ci.nsITraceableChannel);
            let url = aSubject.URI.spec;
            if(regUrl.test(url)){
                this.traceListenner.originalListener = aSubject.setNewListener(this.traceListenner);
            }
        }
    },
    addToListener:function(){//增加监听器
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.addObserver(this, "http-on-modify-request",   false);
        observerService.addObserver(this,"http-on-examine-response",  false);
    },
    removeFromListener:function(){//移除监听器
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.removeObserver(this, "http-on-modify-request");
        observerService.removeObserver(this, "http-on-modify-request");
    },
    ///////////////////////////////////////////////加入下载的监控/////////////////////////////
    downloadObserver:{
        onProgressChange:function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress){
           /*if(aCurTotalProgress==aMaxTotalProgress){
                DoubanFmDownload.downTaskNum --;
                DoubanFmDownload.setProgressMenu();
            }*/
        },
        onStateChange:function(aWebProgress, aRequest, aStateFlags, aStatus){
            if(aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_START){
            }else if(aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP){
                if(aStatus != 0){
                    let stringBundle = document.getElementById("doubanfmdownload-string-bundle");
                    let prompts  = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
                    let title = stringBundle.getString("doubanfmdownload.alert.title");
                    let msg = stringBundle.getString("doubanfmdownload.alert.downloadfilefail");
                    prompts.alert(window,title,msg);
                }
                DoubanFmDownload.downTaskNum --;
                DoubanFmDownload.setProgressMenu();
            }else{
            }
        }
    },
    //////////////////////////下载的命令///////////////////////////////
    downloadFileAct:function(){
        let stringBundle = document.getElementById("doubanfmdownload-string-bundle");
        let prompts  = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
        //如果还没获得mp3文件的相关信息,返回
        if(this.mp3UrlInfo.albumtitle=="" || this.mp3UrlInfo.mp3Name=="" || this.mp3UrlInfo.url==""){
            let title = stringBundle.getString("doubanfmdownload.alert.title");
            let msg = stringBundle.getString("doubanfmdownload.alert.urlisnull");
            prompts.alert(window,title,msg);
            return;
        }
        //如果还没设置需要保存的文件夹返回
        let saveFolder = this.readSaveFolder();
        if(saveFolder==""){
            let title = stringBundle.getString("doubanfmdownload.alert.title");
            let msg = stringBundle.getString("doubanfmdownload.alert.havenotsetfolder");
            prompts.alert(window,title,msg);
            return;
        }
        //检查设置需要保存的文件夹是否存在,存在的话返回
        if(!this.fileUtil.checkTopFolderExsit(saveFolder)){
            let title = stringBundle.getString("doubanfmdownload.alert.title");
            let msg = stringBundle.getString("doubanfmdownload.alert.folderisnotexist");
            prompts.alert(window,title,msg);
            return;
        }
        //检查要保存的文件是否存在,存在的话提示
        let bottomFolder = this.mp3UrlInfo.albumtitle;
        let saveFileName = this.mp3UrlInfo.mp3Name + ".mp3";
        if(this.fileUtil.checkFileExsit(saveFolder,bottomFolder,saveFileName)){
            let title = stringBundle.getString("doubanfmdownload.alert.title");
            let msg = stringBundle.getString("doubanfmdownload.alert.filealradyexist");
            prompts.alert(window,title,msg);
            return;
        }
        //开始下载文件的操作
        let saveFile = this.fileUtil.createFile(saveFolder,bottomFolder,saveFileName);
        if(saveFile==null || !saveFile.exists()){
            let title = stringBundle.getString("doubanfmdownload.alert.title");
            let msg = stringBundle.getString("doubanfmdownload.alert.createfilefail");
            prompts.alert(window,title,msg);
            //查找问题专辑里是否有该歌曲名字,有的话提示
            if(this.fileUtil.checkFileExsit(saveFolder,"问题专辑",saveFileName)){
                let title = stringBundle.getString("doubanfmdownload.alert.title");
                let msg = "问题专辑里已经有了该文件,请检查是否已经下载了此曲,如果没有,请把已有文件移到别处,重试";
                prompts.alert(window,title,msg);
                return;
            }
            saveFile = this.fileUtil.createFile(saveFolder,"问题专辑",saveFileName);
        }
        if(!saveFile.exists()){
            let title = stringBundle.getString("doubanfmdownload.alert.title");
            prompts.alert(window,title,"修正失败,放弃下载该文件!");
            return;
        }
        var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
        var obj_URI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(this.mp3UrlInfo.url, null, null);
        persist.progressListener = this.downloadObserver;
        try{
            persist.saveURI(obj_URI, null, null, null, "", saveFile);
            DoubanFmDownload.downTaskNum ++;
            DoubanFmDownload.setProgressMenu();
        }catch(e){
            alert(e);
        }
    },
    //////////////////////////增加数据的监听器/////////////////////////
    traceListenner:{
        originalListener:null,
        cacheBuf:"",
        songArray:[],
        onDataAvailable:function(request, context, inputStream, offset, count){
            //读取数据
            //this.originalListener.onDataAvailable(request, context, inputStream, offset, count);
            let binaryInputStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
            let storageStream = Components.classes["@mozilla.org/storagestream;1"].createInstance(Components.interfaces.nsIStorageStream);
            let binaryOutputStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
            let converterInputStream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
            binaryInputStream.setInputStream(inputStream);
            storageStream.init(8192, count, null);
            binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
            //converterInputStream.init(binaryInputStream,"UTF-8",0,0);
            let data = binaryInputStream.readBytes(count);
            binaryOutputStream.writeBytes(data, count);
            converterInputStream.init(storageStream.newInputStream(0),"UTF-8",0,0);
            var theData = {};
            while(converterInputStream.readString(-1,theData) != 0){
                this.cacheBuf += theData.value;
            }
            this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), offset, count);
        },
        onStartRequest:function(request, context){
            this.originalListener.onStartRequest(request, context);
        },
        onStopRequest:function(request, context, statusCode){
            let str = this.cacheBuf;
            try{
                var jsObject = JSON.parse(str);
            }catch(e){
                let prompts  = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
                let title = "标题";
                let msg = "解析歌曲列表失败,应该是json返回的串不合法吧,偶尔就会出现这个问题,我也弄不清楚为啥,重新刷新页面吧!有人认识豆瓣的技术人员吗，或许可以问问他们";
                prompts.alert(window,title,msg);
            }
            if(jsObject!="ok"){
                this.songArray = jsObject.song;
            }
            this.cacheBuf = "";
            this.originalListener.onStopRequest(request, context, statusCode);
        }
    }
};
window.addEventListener("load",function(){DoubanFmDownload.init();},false);
document.addEventListener("DoubanFmDownloadFileEvent",function(e){DoubanFmDownload.downloadFileAct();},false,true);