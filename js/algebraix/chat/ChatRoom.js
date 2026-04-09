function ChatRoom(chatServicesURL, chatSave, baseURL, userData, opts) {
    let URLRegExp = /^(http[s]*\:\/\/[^\/]+)\/bin/;
    let matches = URLRegExp.exec(document.URL);
    let isHTTPS = matches[0].substr(0, 5) === 'https';
    let socketURL;

    if (isHTTPS) {
        socketURL = matches[1].slice(0, 8) + chatServicesURL + ':2053';
    } else {
        socketURL = matches[1].slice(0, 7) + chatServicesURL + ':2053';
    }

    //SI SE USA LOCAL DESCOMENTAR LA LINEA SIGUIENTE Y CAMBIAR EL HOST
    // socketURL = 'https://aosuna.algebraix.com:2053';
    let socket = new io.connect(socketURL, {
        secure: isHTTPS,
        rememberTransport: false,
        'force new connection': true
    });

    let localVideo = document.getElementById('flashVideoContainer');
    let permissionContainer = document.getElementById('permission-container');
    let userCount = document.getElementById('user-count');
    let chatContainer = document.getElementById('chatContainer');
    let userContainer = document.getElementById('users');

    let _users = null;
    let _talkMode = null;
    let _active = false;
    let _webcamPermission = null;
    let _talkPermission = null;
    let _talkRequests = null;
    let _studentVideo = false;
    let _teacherVideo = false;
    let _whiteboard = null;
    let _canvasDimensions = null;
    let isWhiteboard = false;
    let _mutedVideo = false;
    let _mutedAudio = false;
    let _showVideo = false;
    let _strokes = [];
    const peerConnections = {};
    let getUserMediaAttempts = 1;
    let gettingUserMedia = false;
    let isScreen = false;
    let userListButton = document.getElementById('userListTab');
    let messageListButton = document.getElementById('messagesTab');
    let messageInput = document.getElementById('messageInput');
    let sendButton = document.getElementById('sendButton');
    let userList = [];

    userListButton.addEventListener("click", function (e) {
        chatContainer.parentElement.classList.add('d-none');
        userContainer.classList.remove('d-none');
        userListButton.classList.add('btn--blue');
        if(dark_mode){
            userListButton.classList.remove('btn--dark');
            messageListButton.classList.add('btn--dark');
        }
        userListButton.classList.add('shadow-none');
        userListButton.classList.add('rounded-0');
        userListButton.classList.remove('text--secondary');
        messageListButton.classList.remove('btn--blue');
        messageListButton.classList.add('text--secondary');
    });

    messageListButton.addEventListener("click", function (e) {
        userContainer.classList.add('d-none');
        chatContainer.parentElement.classList.remove('d-none');
        messageListButton.classList.add('btn--blue');
        messageListButton.classList.add('shadow-none');
        messageListButton.classList.add('rounded-0');
        if(dark_mode){
            messageListButton.classList.remove('btn--dark');
            userListButton.classList.add('btn--dark');
        }
        messageListButton.classList.remove('text--secondary');
        userListButton.classList.remove('btn--blue');
        userListButton.classList.add('text--secondary');

    });

    let getBrowserInfo = function() {
        let ua = navigator.userAgent,
            tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            return 'IE';
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) return tem[1].replace('OPR', 'Opera');
        }
        M = M[1];

        return M;
    };

    let browser = getBrowserInfo().toLowerCase();
    let isChrome = (browser === "chrome");
    let isFirefox = (browser === "firefox");
    userData.browser = browser;

    var recorder;
    var mime = isChrome ? 'video/webm;codecs=vp8' : 'video/webm';
    var optionsRecorder = {
        type: 'video',
        video: localVideo,
        mimeType: mime,
        getNativeBlob: true,
        recorderType: null,
        frameRate: 30,
    };

    socket.emit('signIn', userData);

    /** @type {RTCConfiguration} */
    const config = {
        'iceServers': [{
            'urls': ['stun:stun.l.google.com:19302']
        }]
    };

    /** @type {MediaStreamConstraints} */
    let constraints = {
        audio: true,
        video: {
            facingMode: "user"
        }
    };

    this.disconnect = function() {
        socket.disconnect();
        delete socket;
    }

    window.onbeforeunload = function() {
        // socket.emit("disconnect");
    }

    /**
     * Hidden elements
     */
    $('#sessionActive').hide();
    $('#sessionInactive').hide();
    $('#startWhiteboard').hide();
    $('#stopWhiteboard').hide();
    $('#mediaContainer').hide();
    //$('#permissionNobody').hide();
    $('#permissionTeacher').hide();
    $('#permissionEveryone').hide();
    $('#permissionVoiceOnly').hide();
    $('#videoControls').hide();
    $('#videoContainer').hide();

    if (isChrome || isFirefox) {
        $('#videoContainer').show();
    }
    /**
     * Local events
     */
    $('#startSession').click(startSession);
    $('#stopSession').click(stopSession);
    sendButton.addEventListener('click', sendMessage.bind(messageInput));
    messageInput.addEventListener('keydown', sendMessage.bind(messageInput));
    $('#talkPermission').change(changeTalkMode);
    $('#startWhiteboard').click(startWhiteboard);
    $('#stopWhiteboard').click(stopWhiteboard);
    $('#playWebCam').click(playWebCam);
    $('#playScreen').click(playScreen);
    $('#playApplication').click(playApplication);
    $('#playWindow').click(playWindow);
    $('#stopVideoContainer').click(stopVideoContainer);
    $("#muteVideo").click(muteVideo);
    $("#muteAudio").click(muteAudio);

    function canvasResize({ width, height, isScreen, setAttribute, showVideo }){
        if(userData.type === 'TEACHER'){
            Array.from(document.getElementsByTagName('canvas')).forEach(x=> {
                x.setAttribute('width', width);
                x.setAttribute('height', height);
                $('#whiteboard').css('height', height + 'px');
            });
            changeColor('#FF6771');
            resizeSizePicker(7);
            const rpcArray = Array.from(document.getElementsByClassName('round-picker-container'));
            if(rpcArray.length > 0){
                rpcArray.forEach(rpc => rpc.setAttribute('style', 'margin-top: ' + ((rpc.parentElement.clientHeight - rpc.offsetHeight)/2) + 'px;'));
            }
        } else {
            let _width = width;
            let _height = height;

            if (showVideo && _canvasDimensions && width > _canvasDimensions.width) {
                _width = _canvasDimensions.width;
                _height = 'auto';
            }

            Array.from(document.getElementsByTagName('canvas')).forEach(x=> {
                $(x).css('width', showVideo ? _width : _canvasDimensions.width);
                $(x).css('height', showVideo ? _height : _canvasDimensions.height);
                if (setAttribute) {
                    x.setAttribute('width', width);
                    x.setAttribute('height', height);
                }
                $('#whiteboard').css('height', showVideo ? height : _canvasDimensions.height + 'px');
            });

            if (_strokes && _strokes.length && isScreen) {
                console.log('SET STROKES');
                $.fn.whiteboard.setStrokes(_strokes);
                _strokes = [];
            }
        }
    }

    function startSession() {
        _active = true;
        $('#sessionActive').show();
        $('#sessionLoading').hide();
        $('#sessionInactive').hide();
        $('#startWhiteboard').show();
        $('#startSession').hide();
        $('#textContainer').show();
        $('#stopSession').show();
        $('#NOBODY').click();

        // $('#talkPermission').removeAttr('disabled');
        createUserList();
        permissionContainer.classList.remove('d-none');
        socket.emit('startSession');
        return false;
    }

    function stopSession() {
        if (chatSave) {
            // finishing session will search the temp videos to save the final video
            $.ajax({
                url : '/bin/t/chatroom/x_save_final_video',
                type: 'POST',
                data: { class_instance_id: userData.classInstanceId, session_id: userData.roomId },
                success: function(data) {
                    if (data) {
                        console.log(data[0]);
                    }
                },
                error: function(err) {
                    console.log(err);
                }
            });
        }

        _active = false;
        _webcamPermission = null;
        isWhiteboard = false;
        permissionContainer.classList.add('d-none');
        $('#startSession').show();
        $('#sessionInactive').show();
        $('#stopSession').hide();
        $('#textContainer').hide();
        $('#sessionLoading').hide();
        $('#sessionActive').hide();
        $('#startWhiteboard').hide();
        $('#stopWhiteboard').hide();
        $('#whiteBoardControls').hide().prev().hide();
        $('#mediaContainer').hide();
        $('#NOBODY').click();
        $('#flashVideoContainer').hide();
        enableVideoContainer();

        stopStreamedVideo(localVideo, userData.type);
        _mutedAudio = false;
        _mutedVideo = false;
        _showVideo = false;

        // $('#talkPermission').val('NOBODY');
        // $('#talkPermission').trigger('change');
        // $('#talkPermission').attr('disabled', 'disabled');
        // $('#usersContainer').css('height', 300);
        // $('#chatContainer').css('height', 300);
        //stopVideoContainer();
        createUserList();
        socket.emit('stopSession');

        return false;
    }

    function sendMessage(e) {
        if (e.type === 'click' ||
            (e.type === 'keydown')) {
            if(e.type === 'click' || e.code === 'Enter' && !e.shiftKey || e.code === 'NumpadEnter' && !e.shiftKey){
                e.preventDefault();
                let message = this.value.trim();
                if (message.length > 0) {
                    this.value = '';
                    socket.emit('sendMessage', message);
                    if(chatContainer.parentElement.classList.contains('d-none')){
                        messageListButton.dispatchEvent(new Event('click'));
                    }
                }
            }
        }
    }

    function changeTalkMode() {
        let talkPermission = $('#talkPermission').val();
        _talkMode = talkPermission;
        _talkPermission = {};
        _talkRequests = {};
        socket.emit('changeTalkPermission', talkPermission);
        setupTalkPermissions();
    }

    function startWhiteboard() {
        $('#startWhiteboard').hide();
        $('#stopWhiteboard').show();
        $('#mediaContainer').show();

        let canvasWidth = document.getElementsByClassName('whiteboardVideoContainer')[0].offsetWidth;
        let canvasHeight = canvasWidth * 0.5625;
        let options = {
            enableControls: userData.type === 'TEACHER',
            baseURL: baseURL,
            classInstanceId: userData.classInstanceId,
            fileChooser: {
                emitSelect: fileChooserEmitSelect
            },
            sketchpad: {
                onStroke: userData.type === 'TEACHER' ?
                    emitSketchpadStroke : undefined,
                onUndo: userData.type === 'TEACHER' ?
                    emitUndo : undefined,
                onClear: userData.type === 'TEACHER' ?
                    emitClear : undefined,
                drawAllowed: userData.type === 'TEACHER'
            },
            presentationLoader: {
                onPageChange: userData.type === 'TEACHER' ?
                    emitPageChange : undefined,
            },
            urlGenerator: userData.type === 'TEACHER' ? 't' : 's'
        }

        options = $.extend(true, {}, opts, options);
        $('#whiteboard').empty().whiteboard(options);
        if(userData.type === 'TEACHER'){
            $('#whiteBoardControls').show().prev().show();
            $('#videoControls').show();

            let canvasWidth = document.getElementsByClassName('whiteboardVideoContainer')[0].offsetWidth;
            let canvasHeight = canvasWidth * 0.5625;
            _canvasDimensions = {
                width: canvasWidth,
                height: canvasHeight,
            };

            canvasResize({ width: canvasWidth, height: canvasHeight });
        }
        socket.emit('startWhiteboard', {canvasWidth: canvasWidth, canvasHeight: canvasHeight});
        isWhiteboard = true;

        setupWebcamPermissions();
        return false;
    }

    function stopWhiteboard() {
        $('#startWhiteboard').show();
        $('#stopWhiteboard').hide();
        $('#whiteBoardControls').hide().prev().hide();
        $('#mediaContainer').hide();
        // $('#usersContainer').css('height', 300);
        // $('#chatContainer').css('height', 300);
        $('#videoControls').hide();
        isWhiteboard = false;
        webcamsDisabled();
        stopVideoContainer({ stopWhiteboard: true });
        socket.emit('stopPresentation');
        return false;
    }

    function playWebCam() {
        localVideo.muted = true;
        constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            },
            video: {
                facingMode: "user"
            }
        };
        isScreen = false;
        $("#muteAudio").prop("disabled", false);
        getVideoSessionData();
        return false;
    }

    function playScreen() {
        localVideo.muted = true;
        constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            },
            video: {
                 cursor: "always"
            },
        };
        isScreen = true;
        // $("#muteAudio").html('<i class="fa fa-microphone-slash text-red"></i>');
        // $("#muteAudio").prop("disabled", true);
        // socket.emit('alwaysMuted');
        $("#muteAudio").prop("disabled", false);
        getVideoSessionData();
        return false;
    }

    function playApplication() {
        constraints = {
            video: {
                mediaSource: "application"
            }
        };
        $("#muteAudio").html('<i class="fa fa-microphone-slash text-red"></i>');
        $("#muteAudio").prop("disabled", true);
        socket.emit('alwaysMuted');
        getVideoSessionData();
        return false;
    }

    function playWindow() {
        constraints = {
            video: {
                mediaSource: "window"
            }
        };
        $("#muteAudio").html('<i class="fa fa-microphone-slash text-red"></i>');
        $("#muteAudio").prop("disabled", true);
        socket.emit('alwaysMuted');
        getVideoSessionData();
        return false;
    }

    function getVideoSessionData() {
        if (userData.type === 'TEACHER') {
            _teacherVideo = true;
            _studentVideo = false;
        } else {
            _teacherVideo = false;
            _studentVideo = true;
        }
        getUserMediaDevices();
        return false;
    }

    function stopVideoContainer({ stopWhiteboard } = {}) {
        localVideo.muted = false;
        $('#flashVideoContainer').hide();
        enableVideoContainer();

        stopStreamedVideo(localVideo, userData.type);
        _mutedAudio = false;
        _mutedVideo = false;
        _showVideo = false;
        $("#muteVideo").html('<i class="fas fa-video text-green"></i>');
        $("#muteAudio").html('<i class="fas fa-microphone text-green"></i>');
        if (_active) {
            if(userData.type === 'TEACHER' || _webcamPermission) {
                socket.emit('stopVideo', { stopWhiteboard });
                // if theacher stops the student video sharing
                if (recorder !== undefined && recorder !== null && recorder.getState() == 'recording') {
                    recorder.stopRecording(stopRecordingCallback);
                }
            }
        }

        let whiteboard = document.getElementById('whiteboard');
        whiteboard.style.backgroundColor = 'white';

        if (isScreen) {
            whiteboardCleared();
            canvasResize({ width: _canvasDimensions.width, height: _canvasDimensions.height });
            socket.emit('canvasResize', {type: userData.type, isScreen: false, setAttribute: true, width: _canvasDimensions.width, height: _canvasDimensions.height});
        }

        return false;
    }

    function muteVideo() {
        mutingVideo();
        socket.emit('muteVideo');
    }

    function muteAudio() {
        mutingAudio();
        socket.emit('muteAudio');
    }

    function mutingVideo() {
        if (userData.type === 'TEACHER' || userData.userId === _webcamPermission) {
            _mutedVideo = !_mutedVideo;

            let stream = localVideo.srcObject;
            if (stream) {
                stream.getVideoTracks()[0].enabled = !(stream.getVideoTracks()[0].enabled);
            }
            $("#muteVideo").html('<i class="fa fa-eye-slash text-red"></i>');

            _mutedVideo ? $("#muteVideo").html('<i class="fa fa-eye-slash text-red"></i>') :
                $("#muteVideo").html('<i class="fas fa-video text-green"></i>');
        }
    }

    function mutingAudio() {
        if (userData.type === 'TEACHER' || userData.userId === _webcamPermission) {
            _mutedAudio = !_mutedAudio;

            let stream = localVideo.srcObject;
            if (stream) {
                stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);
            }

            _mutedAudio ? $("#muteAudio").html('<i class="fa fa-microphone-slash text-red"></i>') :
                $("#muteAudio").html('<i class="fas fa-microphone text-green"></i>');
        }
    }

    function fileChooserEmitSelect(presentation) {

        let canvasWidth = document.getElementsByClassName('whiteboardVideoContainer')[0].offsetWidth;
        let canvasHeight = canvasWidth * 0.5625;
        canvasResize({ width: canvasWidth, height: canvasHeight });
        socket.emit('startPresentation', {presentation: presentation, canvasWidth: canvasWidth, canvasHeight});
    }

    function emitSketchpadStroke(stroke) {
        socket.emit('addStroke', stroke);
    }

    function emitUndo() {
        socket.emit('undoStroke');
    }

    function emitClear() {
        socket.emit('clearWhiteboard');
    }

    function emitPageChange(page) {
        socket.emit('changePage', page);
    }

    function checkBrowser() {
        if (!isFirefox) {
            //$('#playScreen').hide();
            $('#playApplication').hide();
            $('#playWindow').hide();
            //$("#noExtraFeatures").fadeIn();
        }
    }
    /**
     * Socket events
     */
    socket.on('chatSetup', chatSetup);
    socket.on('sessionStarted', sessionStarted);
    socket.on('presentationStarted', presentationStarted);
    socket.on('presentationStopped', presentationStopped);
    socket.on('strokeAdded', strokeAdded);
    socket.on('whiteboardCleared', whiteboardCleared);
    socket.on('pageChanged', pageChanged);
    socket.on('strokeUndid', strokeUndid);
    socket.on('userSignedIn', userSignedIn);
    socket.on('talkPermissionChanged', talkPermissionChanged);
    socket.on('messageSent', messageSent);
    socket.on('videoStopped', videoStopped);
    socket.on('talkPermissionRequested', talkPermissionRequested);
    socket.on('talkPermissionGranted', talkPermissionGranted);
    socket.on('talkPermissionRevoked', talkPermissionRevoked);
    socket.on('webcamPermissionGranted', webcamPermissionGranted);
    socket.on('webcamPermissionRevoked', webcamPermissionRevoked);
    socket.on('userDisconnected', userDisconnected);
    socket.on('sessionStopped', sessionStopped);
    socket.on('muteAudio', mutedAudio);
    socket.on('muteVideo', mutedVideo);
    socket.on('alwaysMuted', alwaysMuted);

    socket.on('connect_error', function() {});
    socket.on('connect_timeout', function() {});
    socket.on('reconnect_error', function() {});
    socket.on('reconnect_failed', function() {});

    socket.on('broadcaster', broadcaster);
    socket.on('watcher', watcher);
    socket.on('offer', offer);
    socket.on('candidate', candidate);
    socket.on('answer', answer);
    socket.on('bye', bye);

    socket.on('canvasResize', canvasResize);

    function broadcaster(sender) {
        socket.emit('watcher', sender);
    }

    function watcher(id, sender) {
        if (peerConnections[id + ':' + userData.classInstanceId] || !_showVideo) {
            return false;
        }

        if (sender.clearWhiteboard) {
            whiteboardCleared();
        }

        let stream = localVideo.srcObject;
        if (stream.active && sender.isScreen && !sender.noCanvasResize) {
            socket.emit('canvasResize', {type: userData.type, isScreen: sender.isScreen, setAttribute: true, width: localVideo.offsetWidth, height: localVideo.offsetHeight, showVideo: true});
        }

        const peerConnection = new RTCPeerConnection(config);
        peerConnections[id + ':' + userData.classInstanceId] = peerConnection;

        if (stream) {
            let tracks = stream.getTracks();
            tracks.forEach(function(track) {
                peerConnection.addTrack(track, stream);
            });
        }
        peerConnection.createOffer({
            offerToReceiveVideo: true
        })
            .then(sdp => peerConnection.setLocalDescription(sdp))
            .then(function() {
                socket.emit('offer', id, peerConnection.localDescription, sender);
            });
        peerConnection.onicecandidate = function(event) {
            if (event.candidate) {
                socket.emit('candidate', id, event.candidate);
            }
        };
    }

    function offer(id, description, sender) {
        try {
            const peerConnection = new RTCPeerConnection(config);
            peerConnections[id + ':' + userData.classInstanceId] = peerConnection;
            peerConnection.setRemoteDescription(description)
                .then(() => peerConnection.createAnswer())
                .then(sdp => peerConnection.setLocalDescription(sdp))
                .then(function() {
                    socket.emit('answer', id, peerConnection.localDescription);
                });
            peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, sender);
            peerConnection.onicecandidate = function(event) {
                if (event.candidate) {
                    socket.emit('candidate', id, event.candidate);
                }
            };
        } catch(e) { }
    }

    function candidate(id, candidate) {
        if (peerConnections[id + ':' + userData.classInstanceId]) {
            peerConnections[id + ':' + userData.classInstanceId].addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    function answer(id, description) {
        if (peerConnections[id + ':' + userData.classInstanceId]) {
            peerConnections[id + ':' + userData.classInstanceId].setRemoteDescription(description);
        }
    }

    function bye(id) {
        handleRemoteHangup(id + ':' + userData.classInstanceId);
    }

    function mutedVideo() {
        mutingVideo();
    }

    function mutedAudio() {
        mutingAudio();
    }

    function alwaysMuted() {
        $("#muteAudio").html('<i class="fa fa-microphone-slash text-red"></i>');
        $("#muteAudio").prop("disabled", true);
    }

    function chatSetup(data) {
        _active = data.active;
        _talkMode = data.talkMode;
        _talkPermission = data.talkPermission;
        _talkRequests = data.talkRequests;
        _webcamPermission = data.studentVideoPermission;
        _studentVideo = data.studentVideo;
        _teacherVideo = data.teacherVideo;
        _whiteboard = data.whiteboard;
        if (_whiteboard){
            isWhiteboard = true;
        }
        _users = data.users;
        if (data.active) {
            $('#sessionActive').show();
            $('#sessionLoading').hide();
            $('#startWhiteboard').show();
            $('#talkPermission').removeAttr('disabled');
            $('#startSession').click();

        } else {
            $('#sessionInactive').show();
            $('#sessionLoading').hide();
            $('#startWhiteboard').hide();
            $('#talkPermission').attr('disabled', 'disabled');
        }
        if (data.whiteboard) {
            //$('#stopWhiteboard').show();
            $('#mediaContainer').show();
            $('#startWhiteboard').hide();
            $('#stopWhiteboard').show();

            let options = {
                enableControls: userData.type === 'TEACHER',
                presentation: data.whiteboard,
                baseURL: baseURL,
                classInstanceId: userData.classInstanceId,
                fileChooser: {
                    emitSelect: fileChooserEmitSelect
                },
                sketchpad: {
                    onStroke: userData.type === 'TEACHER' ?
                        emitSketchpadStroke : undefined,
                    onUndo: userData.type === 'TEACHER' ?
                        emitUndo : undefined,
                    onClear: userData.type === 'TEACHER' ?
                        emitClear : undefined,
                    drawAllowed: userData.type === 'TEACHER'
                },
                presentationLoader: {
                    onPageChange: userData.type === 'TEACHER' ?
                        emitPageChange : undefined,
                },
                urlGenerator: userData.type === 'TEACHER' ? 't' : 's'
            }

            options = $.extend(true, {}, opts, options);

            $('#whiteboard').empty().whiteboard(options);
            $.fn.whiteboard.startPresentation();
            let outerWidth = document.getElementsByClassName('whiteboardVideoContainer')[0].offsetWidth;
            let newHeight = outerWidth * 0.5625;

            _canvasDimensions = {
                width: outerWidth,
                height: newHeight,
            };

            canvasResize({ width: outerWidth, height: newHeight });

            if(userData.type === 'TEACHER'){
                $('#whiteBoardControls').show().prev().show();
                $('#videoControls').show();
                let canvasWidth = document.getElementsByClassName('whiteboardVideoContainer')[0].offsetWidth;
                let canvasHeight = canvasWidth * 0.5625;
                canvasResize({ width: canvasWidth, height: canvasHeight });
            }
            if (data.whiteboard.strokes) {
                _strokes = [...data.whiteboard.strokes];
                $.fn.whiteboard.setStrokes(data.whiteboard.strokes);
            }
            if (data.whiteboard.type != 'EMPTY' && data.whiteboard.page) {
                $.fn.whiteboard.changePage(data.whiteboard.page);
            }
            enableVideoContainer();
            checkBrowser();
        } else {
            webcamsDisabled();
        }

        controls = ['NOBODY', 'TEACHER', 'EVERYONE', 'VOICE_ONLY'];
        controls.forEach(x => {
            let el = document.getElementById(x);
            if(el){
                el.addEventListener('click', talk);
            }
        });

        createUserList();
    }
    function talk() {
        document.getElementById("NOBODY").classList.remove("material-chip--blue");
        document.getElementById("TEACHER").classList.remove("material-chip--blue");
        document.getElementById("EVERYONE").classList.remove("material-chip--blue");
        document.getElementById("VOICE_ONLY").classList.remove("material-chip--blue");
        this.classList.add("material-chip--blue");
        talkPermissionChanged(this.id);
        socket.emit('changeTalkPermission', this.id);

    }

    function sessionStarted(data) {
        _active = true;
        $('#sessionActive').show();
        $('#textContainer').show();
        $('#sessionLoading').hide();
        $('#sessionInactive').hide();
        createUserList();
        if(userData.type === 'TEACHER'){
            $('#NOBODY').click();
        }
    }

    function presentationStarted(presentation) {
        $('#mediaContainer').show();
        $('#whiteboard').empty().whiteboard({
            presentation: presentation,
            baseURL: baseURL,
            classInstanceId: userData.classInstanceId,
            sketchpad: {
                drawAllowed: false
            },
            urlGenerator: userData.type === 'TEACHER' ? 't' : 's'
        });
        $.fn.whiteboard.startPresentation();
        let canvasWidth = document.getElementsByClassName('whiteboardVideoContainer')[0].offsetWidth;
        let canvasHeight = canvasWidth * 0.5625;
        _canvasDimensions = {
            width: canvasWidth,
            height: canvasHeight,
        };
        canvasResize({ width: canvasWidth, height: canvasHeight });
        if (!localVideo.srcObject){
            enableVideoContainer();
            checkBrowser();
        }
        isWhiteboard = true;
        setupWebcamPermissions();
    }

    function strokeAdded(stroke) {
        _strokes.push(stroke);
        $.fn.whiteboard.addStroke(stroke);
    }

    function whiteboardCleared() {
        _strokes = [];
        $.fn.whiteboard.clear();
    }

    function pageChanged(page) {
        $.fn.whiteboard.changePage(page);
    }

    function strokeUndid() {
        _strokes.pop();
        $.fn.whiteboard.undo();
    }

    function presentationStopped() {
        $('#whiteboard').empty();
        $('#mediaContainer').hide();
        enableVideoContainer();
        isWhiteboard = false;
        webcamsDisabled();
    }

    function userSignedIn(user, teacherVideo, studentVideo) {
        _teacherVideo = teacherVideo;
        _studentVideo = studentVideo;
        userType = user.type;
        _users[user.userId] = user;
        addInformationMessage('text-green',user, 'se ha conectado.');
        createUserList();
        if (teacherVideo || studentVideo) {
            videoStarted();
        }
    }

    let messageTemplate = document.createElement('div');
    messageTemplate.classList.add('chat');
    messageTemplate.innerHTML =
        `<i class="fas fa-circle-user chat__icon" data-toggle="tooltip" data-placement="top" data-color></i>
        <div class="chat__wrapper">
            <div class="chat__bubble text-dark">
                <div class="chat__caption caption" data-message>

                </div>
            </div>
        </div>`;
    function messageSent(message) {
        const user = _users[message.userId];

        const color = userColor(user.type);
        const chatBubble = messageTemplate.cloneNode(true);
        const icon = chatBubble.querySelector('[data-color]');
        icon.classList.add(color);
        let time = message.time;
        let hour = parseInt(time.substr(0,2), 10);
        let minutes = time.substr(3,2);
        let amPm = '';
        if(hour >= 12){
            hour -= 12;
            amPm = 'pm';
        } else {
            amPm = 'am'
        }
        if(hour === 0){
            hour = 12;
        }
        icon.dataset['title'] = `${hour}:${minutes} ${amPm}`;
        if(userData.userId === user.userId){
            chatBubble.classList.add('chat--me');
            chatBubble.querySelector('[data-message]').innerHTML = message.message.replace(/&#10;/g, '<br/>');
        } else {
            chatBubble.querySelector('[data-message]').innerHTML = `<strong data-user>${user.chatName}: </strong>` + message.message.replace(/\n/g, '<br/>');
        }
        chatContainer.append(chatBubble);
        $(chatBubble.children[0]).tooltip();
        // Hacer esto sólo si está visible el div de mensajes
        if(!chatContainer.parentElement.classList.contains('d-none')){
            chatContainer.parentElement.scroll(0, chatContainer.parentElement.scrollHeight);
        }
    }

    function videoStarted() {
        $('#backgroundVideoImage').hide();
        $('#flashVideoContainer').show();
        $('#selectContainer').hide();

        if ((userData.type === 'TEACHER' && _teacherVideo) || (userData.userId === _webcamPermission && _studentVideo)) {
            socket.emit('broadcaster', {type: userData.type, isScreen: isScreen});
            if(_teacherVideo && userData.type !== 'TEACHER'){
                $("#videoControls").hide();
            } else {
                $('#videoControls').show();
            }
        }

        if (userData.type === 'TEACHER') {
            $('#playWebCam').hide();
            $('#playScreen').hide();
            $('#stopVideoContainer').show();
            $('#muteVideo').show();
            $('#muteAudio').show();
        }

        if(userData.type === 'TEACHER'){
            permissionContainer.querySelector('.material-chip--blue').dispatchEvent(new Event('click'));
        }

        return false;
    }

    function videoStopped() {
        $('#flashVideoContainer').hide();
        $('#stopVideoContainer').hide();
        $('#backgroundVideoImage').show();
        $('#playWebCam').show();
        $('#muteVideo').hide();
        $('#muteAudio').hide();

        enableVideoContainer();
        stopStreamedVideo(localVideo, userData.type);
        // if theacher stops the student video sharing
        if (recorder !== undefined && recorder !== null && recorder.getState() == 'recording') {
            recorder.stopRecording(stopRecordingCallback);
        }
        _mutedVideo = false;
        _mutedAudio = false;
        _teacherVideo = false;
        _studentVideo = false;
        _showVideo = false;
        $("#muteVideo").html('<i class="fas fa-video text-green"></i>');
        $("#muteAudio").html('<i class="fas fa-microphone text-green"></i>');
    }

    function talkPermissionRequested(userId) {
        _talkRequests[userId] = true;
        let user = _users[userId];
        addInformationMessage('green', user,'ha solicitado permiso para hablar.');
        setupTalkPermissions();
    }

    function talkPermissionGranted(userId) {
        delete _talkRequests[userId];
        _talkPermission[userId] = true;
        let user = _users[userId];
        if(userData.userId == userId){
            addInformationMessage('text-green',user, 'Se te ha otorgado permiso para hablar.');
        }
        setupTalkPermissions();
    }

    function talkPermissionRevoked(userId) {
        delete _talkPermission[userId];
        let user = _users[userId];
        addInformationMessage('text-red', user, 'se te ha revocado el permiso para hablar.');
        setupTalkPermissions();
    }

    function webcamPermissionGranted(userId) {
        _webcamPermission = userId;
        let user = _users[userId];
        addInformationMessage('text-green', user,'se te ha otorgado permiso de video.');
        setupWebcamPermissions();
        if (!_teacherVideo) {
            enableVideoContainer();
        }
    }

    function webcamPermissionRevoked() {
        let user = _users[_webcamPermission]
        addInformationMessage('text-red', user,'se te ha revocado el permiso de video.');

        if (_studentVideo) {
            stopVideoContainer();
        }
        _webcamPermission = null;
        if(userData.type !== 'TEACHER'){
            $("#videoControls").hide();
        }

        setupWebcamPermissions();
    }

    function userDisconnected(userId) {
        let user = _users[userId];
        addInformationMessage('text-red', user , 'se ha desconectado.');
        delete _users[userId];
        delete _talkPermission[userId];
        delete _talkRequests[userId];
        if (_webcamPermission === userId) {
            _webcamPermission = null;
        }
        createUserList();
    }

    function sessionStopped(data) {
        _active = false;
        if(_studentVideo || _teacherVideo){
            videoStopped();
        }
        _webcamPermission = null;
        isWhiteboard = false;
        $('#sessionInactive').show();
        $('#sessionLoading').hide();
        $('#sessionActive').hide();
        $('#mediaContainer').hide();
        $('#textContainer').hide();
        // $('#usersContainer').css('height', 300);
        // $('#chatContainer').css('height', 300);
        //stopVideoContainer();
        createUserList();
    }

    function createUserList() {
        $("#usersContainer").empty();
        if(!!_users){
            userList = Object.keys(_users).map(u => _users[u]).map(u => {
                let sameName = userList.filter(y => removeAccents(y.name.trim().toLowerCase()) === removeAccents(u.name.trim().toLowerCase())).length > 1;
                u.chatName = u.name + (sameName ? (' ' + u.lastName) : '');
                return u;
            });
        } else {
            userList = [];
        }

        userList.sort(function(a, b) {
            if (a.type === b.type) {
                let aName = a.lastName + a.name;
                let bName = b.lastName + b.name;
                // return aName.localeCompare(bName);
                if (aName === bName) {
                    return 0;
                } else {
                    return -1;
                }
            } else if (a.type === 'TEACHER') {
                return -1;
            } else {
                return 1;
            }
        });
        for (let i = 0; i < userList.length; i++) {
            addSingleUser(userList[i]);
        }
        userCount.parentElement.classList.remove('d-none');
        setupWebcamPermissions();
        setupTalkPermissions();
        if (_active) {
            showControlImages();
        } else {
            hideControlImages();
        }
    }

    function addSingleUser(user) {
        let color = userColor(user.type);
        let li = `<li class="material-list__item singleUser" userId="${user.userId}">
                        <i class="fas fa-circle-user material-list__icon ${color}"></i>
                        <span class="material-list__text">
                            <span class="material-list__text--primary" >${user.lastName} ${user.name}</span>
                        </span>
                        <span class="material-list__meta--center material-list__text--sm">
                            <div class="action-item material-list__meta--btn">
                                <i class="TALK fas fa-hand text-gray material-list__meta material-list__meta-sm"></i>
                            </div>
                        </span>
                            ${user.type !== 'TEACHER' && !user.isMobile ?
                            ' <span class="material-list__meta--center material-list__text--sm" style="margin-left: 0;"><div class="action-item material-list__meta--btn" style="cursor: not-allowed;">' +
                                '<i class="VIDEO fas fa-video text-gray material-list__meta material-list__meta-sm" style="cursor: not-allowed;"></i>' +
                            '</div></span>' : ''}
                    </li>`;

        $("#usersContainer").append(li);
        if(!!_users){
            userCount.innerText = Object.keys(_users).length - 1;
        } else {
            userCount.innerText = '0';
        }
    }

    function userColor(user) {
        switch (user) {
            case 'STUDENT':
                return 'text-blue';
            case 'TEACHER':
                return 'text-yellow';
        }
    }

    function getProfilePictureImage(user) {
        let auth = userData.type == 'TEACHER' ? 't' : 's';
        let titleText = ' ajax_body=[/bin/' + auth + '/chatroom/x_get_s3_image/?user_id=' + user.userId + ']';
        let tooltip = $('<i class="fa fa-image" style="float:right" data-toggle="popover" title="" data-original-title="" data-placement="right" data-html="true" data-content="" data-container="body" data-img="/bin/' + auth + '/chatroom/x_get_s3_image/?user_id=' + user.userId + '"></i>');
        return tooltip;
    }

    function talkPermissionChanged(talkPermission) {
        _talkMode = talkPermission;
        if(userData.type !== 'TEACHER') {
            if (_talkMode === 'NOBODY') {
                _talkPermission = {};
                _talkRequests = {};
                $('#permissionNobody').show();
                $('#permissionTeacher').hide();
                $('#permissionEveryone').hide();
                $('#permissionVoiceOnly').hide();
            } else if (_talkMode === 'TEACHER') {
                _talkPermission = {};
                _talkRequests = {};
                $('#permissionNobody').hide();
                $('#permissionTeacher').show();
                $('#permissionEveryone').hide();
                $('#permissionVoiceOnly').hide();
            } else if (_talkMode === 'EVERYONE') {
                _talkPermission = {};
                _talkRequests = {};
                $('#permissionNobody').hide();
                $('#permissionTeacher').hide();
                $('#permissionEveryone').show();
                $('#permissionVoiceOnly').hide();
            } else if (_talkMode === 'VOICE_ONLY') {
                $('#permissionNobody').hide();
                $('#permissionTeacher').hide();
                $('#permissionEveryone').hide();
                $('#permissionVoiceOnly').show();
            } else{
                $('#permissionNobody').show();
            }
        } else {
            if (_talkMode !== 'VOICE_ONLY'){
                _talkPermission = {};
                _talkRequests = {};
            }
        }
        setupTalkPermissions();
    }

    function enableMessageInput(type, talkMode) {
        if (talkMode === 'NOBODY' ||
            (talkMode === 'TEACHER' && type === 'STUDENT') ||
            (talkMode === 'VOICE_ONLY' && type === 'STUDENT' &&
                !_talkPermission[userData.userId])
        ) {
            $('#messageInput').attr('disabled', 'disabled');
            $('#sendButton').attr('disabled', 'disabled');
            $('#messageInput').val('');
        } else if (talkMode === 'EVERYONE' ||
            (talkMode === 'TEACHER' && type === 'TEACHER') ||
            (talkMode === 'VOICE_ONLY' && type === 'TEACHER')
        ) {
            $('#messageInput').removeAttr('disabled');
            $('#sendButton').removeAttr('disabled');
        } else if (talkMode === 'VOICE_ONLY' &&
            type === 'STUDENT' &&
            _talkPermission[userData.userId]) {
            $('#messageInput').removeAttr('disabled');
            $('#sendButton').removeAttr('disabled');
        }
    }

    function addInformationMessage(color,user, message) {

        let userCo = userColor(user.type);
        let date = new Date();
        let hour = parseInt(date.getHours(), 10);
        let minutes = date.getMinutes();
        let amPm = '';
        if(hour >= 12){
            hour -= 12;
            amPm = 'pm';
        } else {
            amPm = 'am'
        }
        if(hour === 0){
            hour = 12;
        }
        let li = `<li class="material-list__item infoMessage ">
                        ${hour}:${minutes.toString().length === 2 ? minutes : ('0' + minutes)} ${amPm}  <i class="fas fa-circle-user material-list__icon m-0 ${userCo}"></i>
                        <span class="material-list__text">
                            <span class="material-list__text--primary material-list__text--complete" userId="${user.userId}"><span class="${userCo}">${user.name}: </span><span class="${color}">${message}</span></span>
                        </span>
                    </li>`;
        $('#chatContainer').append(li);
        $('.chat-container').scrollTop($('#chatContainer i').length * 48);

    }

    // Pablito, something to remove or add the "text-red-algebraix"
    function setupWebcamPermissions() {
        if (isWhiteboard) {
            for (let userId in _users) {
                let user = _users[userId];
                let imgWebcam = $('li[userId=' + userId + '] i.VIDEO');
                imgWebcam.css('cursor', 'default');
                if (user.type !== 'TEACHER') {
                    imgWebcam.css('cursor', 'not-allowed');
                }
                if (user.type === 'TEACHER') {
                    //imgWebcam.removeClass('text-gray').addClass('text-green');
                } else if (userId === _webcamPermission) {
                    imgWebcam.removeClass('text-gray').addClass('text-green');
                    if (userData.type === 'TEACHER') {
                        imgWebcam.css('cursor', 'pointer');
                        imgWebcam.parent().parent().unbind('click');
                        imgWebcam.parent().parent().click(revokeWebcamPermission);
                    }
                } else if (_webcamPermission === null) {
                    getNavigatorPermissions(user.browser, userData.type, imgWebcam);
                } else {
                    getNavigatorPermissions(user.browser, userData.type, imgWebcam);
                }
            }
        } else {
            webcamsDisabled();
        }
    }

    function webcamsDisabled() {
        /*for (let userId in _users) {
            let user = _users[userId];
            let imgWebcam = $('li[userId=' + userId + '] i:first-child');
            imgWebcam.css('cursor', 'not-allowed');
            imgWebcam.unbind('click');
            imgWebcam.removeClass('text-red-algebraix text-green-algebraix').addClass('text-gray-5-algebraix');
        }*/
    }

    function getNavigatorPermissions(browser, type, imgWebcam) {
        if (browser === "firefox" || browser === "chrome") {
            imgWebcam.removeClass('text-green').addClass('text-gray');
            if (type === 'TEACHER') {
                imgWebcam.css('cursor', 'pointer');
                imgWebcam.parent().parent().unbind('click');
                imgWebcam.parent().parent().click(grantWebcamPermission);
            }
        } else {
            imgWebcam.removeClass('text-green').addClass('disabled text-gray');
            imgWebcam.css('cursor', 'not-allowed');
            if (type === 'TEACHER') {
                imgWebcam.parent().parent().unbind('click');
            }
        }
    }

    function setupTalkPermissions() {
        enableMessageInput(userData.type, _talkMode);
        if (_talkMode === 'NOBODY') {
            $('.singleUser i.TALK').each(function(i) {
                $(this).css('cursor', 'not-allowed');
                $(this).parent().parent().unbind('click');
                $(this).addClass('fa-hand text-gray').removeClass('fa-message text-blue');
            });
        } else if (_talkMode === 'EVERYONE') {
            $('i.TALK').each(function(i) {
                $(this).css('cursor', 'default');
                $(this).parent().parent().unbind('click');
                $(this).removeClass('fa-hand text-gray text-orange').addClass('fa-message text-blue');

            });
        } else if (_talkMode === 'TEACHER') {
            for (let userId in _users) {
                let user = _users[userId];
                let imgTalk = $('li[userId=' + userId + '] i.TALK');
                imgTalk.parent().parent().unbind('click');
                if (user.type === 'TEACHER') {
                    imgTalk.css('cursor', 'default');
                    imgTalk.removeClass('fa-hand text-gray').addClass('fa-message text-blue');
                } else {
                    imgTalk.css('cursor', 'not-allowed');
                    imgTalk.removeClass('fa-message text-blue').addClass('fa-hand text-gray');
                }
            }
        } else {
            for (let userId in _users) {
                let user = _users[userId];
                let imgTalk = $('li[userId=' + userId + '] i.TALK');

                if (user.type === 'TEACHER') {
                    imgTalk.removeClass('fa-hand').addClass('fa-message');
                    imgTalk.removeClass('text-orange text-gray').addClass('text-blue');
                    imgTalk.css('cursor', 'default');
                    imgTalk.parent().parent().unbind('click');
                } else if (_talkPermission[userId]) {
                    if (userData.type === 'TEACHER') {
                        imgTalk.css('cursor', 'pointer');
                        imgTalk.parent().parent().unbind('click');
                        imgTalk.parent().parent().click(revokeTalkPermission);
                        imgTalk.removeClass('text-gray text-orange').addClass('text-blue');
                        imgTalk.removeClass('fa-hand').addClass('fa-message');
                    }else{
                        imgTalk.css('cursor', 'default');
                        imgTalk.parent().parent().unbind('click');
                        imgTalk.removeClass('text-gray text-orange').addClass('text-blue');
                        imgTalk.removeClass('fa-hand').addClass('fa-message');
                    }

                } else if (_talkRequests[userId]) {
                    if (userData.type === 'TEACHER') {
                        imgTalk.css('cursor', 'pointer');
                        imgTalk.parent().parent().unbind('click');
                        imgTalk.parent().parent().click(grantTalkPermission);
                        imgTalk.removeClass('text-blue text-gray').addClass('text-orange');
                        imgTalk.removeClass('fa-message').addClass('fa-hand');
                        let userElement = imgTalk[0].parentElement.parentElement.parentElement;
                        userElement.parentElement.insertBefore(userElement, userElement.parentElement.children[1]);

                    }else{
                        imgTalk.css('cursor', 'default');
                        imgTalk.parent().parent().unbind('click');
                        imgTalk.removeClass('text-gray text-blue').addClass('text-orange');
                        imgTalk.removeClass('fa-message').addClass('fa-hand');
                    }
                } else if (userData.userId === userId) {
                    imgTalk.css('cursor', 'pointer');
                    imgTalk.parent().parent().unbind('click');
                    imgTalk.parent().parent().click(requestTalkPermission);
                    imgTalk.removeClass('text-orange text-blue').addClass('text-gray');
                    imgTalk.removeClass('fa-message').addClass('fa-hand');
                } else {
                    if (userData.type === 'TEACHER') {
                        imgTalk.removeClass('fa-message').addClass('fa-hand');
                        imgTalk.removeClass('text-orange text-blue').addClass('text-gray');
                        imgTalk.css('cursor', 'pointer');
                        imgTalk.parent().parent().unbind('click');
                        imgTalk.parent().parent().click(grantTalkPermission);
                    }
                }
            }
        }
    }

    function grantWebcamPermission(e) {
        if (_webcamPermission) {
            revokeWebcamPermission(e);
        }
        let userId = $(this).parent().attr('userId');

        const user = _users[userId];
        if (user.isMobile) return;

        _webcamPermission = userId;
        setupWebcamPermissions();
        socket.emit('grantWebcamPermission', userId);
    }

    function grantTalkPermission(e) {
        let userId = $(this).parent().attr('userId');
        delete _talkRequests[userId];
        _talkPermission[userId] = true;
        setupTalkPermissions();
        socket.emit('grantTalkPermission', userId);
    }

    function revokeWebcamPermission(e) {
        if (!_teacherVideo && !(userData.type === 'TEACHER')) {
            $('#backgroundVideoImage').show();
            $('#selectContainer').show();
            $('#videoControls').hide();
            $('#flashVideoContainer').hide();
        }
        _webcamPermission = null;
        setupWebcamPermissions();
        socket.emit('revokeWebcamPermission');
    }

    function revokeTalkPermission(e) {
        let userId = $(this).parent().attr('userId');
        delete _talkPermission[userId];
        setupTalkPermissions();
        socket.emit('revokeTalkPermission', userId);
    }

    function requestTalkPermission(e) {
        let userId = $(this).parent().attr('userId');
        _talkRequests[userId] = true;
        setupTalkPermissions();
        socket.emit('requestTalkPermission', userId);

    }

    function enableVideoContainer() {
        if ((!_webcamPermission || userData.userId !== _webcamPermission) && userData.type !== 'TEACHER') {
            $('#videoControls').hide();
            $('#selectContainer').hide();
        } else if (userData.userId === _webcamPermission) {
            $('#videoControls').show();
            $('#stopVideoContainer').hide();
            $('#playWebCam').show();
            $('#playScreen').show();
            $('#muteVideo').hide();
            $('#muteAudio').hide();
        } else if (userData.type === 'TEACHER') {
            //$('#selectContainer').show();
            $('#stopVideoContainer').hide();
            $('#playWebCam').show();
            $('#playScreen').show();
            $('#muteVideo').hide();
            $('#muteAudio').hide();
        }
        $('#backgroundVideoImage').show();
    }

    function hideControlImages() {
        $('.singleUser img:nth-child(1)').hide();
        $('.singleUser img:nth-child(2)').hide();
    }

    function showControlImages() {
        $('.singleUser img:nth-child(1)').show();
        $('.singleUser img:nth-child(2)').show();
    }

    function stopRecordingCallback() {
        if(isScreen) {
            recorder.screen.stop();
        } else {
            recorder.camera.stop();
        }
        saveTmpVideo();
    }

    function getUserMediaError(error) {
        gettingUserMedia = false;
        if(error != DOMException){
            (--getUserMediaAttempts > 0) && setTimeout(getUserMediaDevices, 1000);
            if (getUserMediaAttempts == 0) {
                if(isScreen){
                    $("#noScreen").fadeIn();
                    document.getElementById('noCamera').scrollIntoView({ behavior:'smooth', block:'end' })
                } else {
                    $("#noCamera").fadeIn();
                    document.getElementById('noCamera').scrollIntoView({ behavior:'smooth', block:'end' })
                }
                getUserMediaAttempts = 1;
            }
        }
    }

    function getUserMediaSuccess(stream) {
        gettingUserMedia = false;
        if (localVideo instanceof HTMLVideoElement && stream.active) {
            localVideo.onloadedmetadata = function(e) {
                localVideo.play();
                let video = document.getElementById('videoBackground');
                let whiteboard = document.getElementById('whiteboard');
                whiteboard.style.backgroundColor = isScreen ? '' : 'white';
                video.style.width = isScreen ? '100%' : '30%';
                video.style.height = isScreen ? '100%' : '40%';
                localVideo.style.zIndex = isScreen ? '0' : '1';
                localVideo.style.borderRadius = isScreen ? 0 : '5%';
                localVideo.parentElement.style.zIndex = isScreen ? 'auto' : 1;
                localVideo.nextElementSibling.style.zIndex = isScreen ? 1 : 2;
            };
            if(!isScreen){
                !localVideo.srcObject && (localVideo.srcObject = stream);
                _showVideo = true;
                socket.emit('broadcaster', {type: userData.type, isScreen: isScreen});
                if (chatSave) {
                    recorder = RecordRTC(stream, optionsRecorder);
                    // release camera on stopRecording
                    recorder.camera = stream;
                    recorder.startRecording();
                }
            }
        }
        $('#playWebCam').hide();
        $('#playScreen').hide();
        $('#stopVideoContainer').show();
        $('#muteVideo').show();
        $('#muteAudio').show();
        $('#selectContainer').hide();
        $('#backgroundVideoImage').hide();
        $('#videoControls').show();
        $('#flashVideoContainer').show();
    }

    function getDisplayMediaSuccess(stream) {
        var screenAudioConstraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        };
        navigator.mediaDevices.getUserMedia(screenAudioConstraints).then(function(mic) {
            gettingUserMedia = false;
            stream.addTrack(mic.getTracks()[0]);
            if (localVideo instanceof HTMLVideoElement && stream.active) {
                localVideo.onloadedmetadata = function(e) {
                    localVideo.play();
                    let video = document.getElementById('videoBackground');
                    let whiteboard = document.getElementById('whiteboard');
                    whiteboard.style.backgroundColor = isScreen ? '' : 'white';
                    video.style.width = isScreen ? '100%' : '30%';
                    video.style.height = isScreen ? '100%' : '40%';
                    localVideo.style.zIndex = isScreen ? '0' : '1';
                    localVideo.style.borderRadius = isScreen ? 0 : '5%';
                    localVideo.parentElement.style.zIndex = isScreen ? 'auto' : 1;
                    localVideo.nextElementSibling.style.zIndex = isScreen ? 1 : 2;

                    canvasResize({ width: localVideo.offsetWidth, height: localVideo.offsetHeight });
                    socket.emit('canvasResize', {type: userData.type, isScreen: isScreen, setAttribute: true, width: localVideo.offsetWidth, height: localVideo.offsetHeight, showVideo: true});
                };

                !localVideo.srcObject && (localVideo.srcObject = stream);
                _showVideo = true;
                socket.emit('broadcaster', {type: userData.type, isScreen: isScreen, clearWhiteboard: true, noCanvasResize: true});
                if (chatSave) {
                    recorder = RecordRTC(stream, optionsRecorder);
                    // release screen on stopRecording
                    recorder.screen = stream;
                    recorder.startRecording();
                }
            }

            $('#playWebCam').hide();
            $('#playScreen').hide();
            $('#stopVideoContainer').show();
            $('#muteVideo').show();
            $('#muteAudio').show();
            $('#selectContainer').hide();
            $('#backgroundVideoImage').hide();
            $('#videoControls').show();
            $('#flashVideoContainer').show();
        });
    }

    function getUserMediaDevices() {
        if (localVideo instanceof HTMLVideoElement) {
            gettingUserMedia = true;
            if(navigator.mediaDevices){
                if(isScreen){
                    navigator.mediaDevices.getDisplayMedia({ video: true })
                        .then(getDisplayMediaSuccess)
                        .catch(getUserMediaError);
                } else {
                    navigator.mediaDevices.getUserMedia(constraints)
                        .then(getUserMediaSuccess)
                        .catch(getUserMediaError);
                }
            } else { // Esto sucede si se accede a una url sin https
                if(isScreen){
                    $("#noScreen").fadeIn();
                    document.getElementById('noScreen').scrollIntoView({ behavior:'smooth', block:'end' });
                } else {
                    $("#noCamera").fadeIn();
                    document.getElementById('noCamera').scrollIntoView({ behavior:'smooth', block:'end' });
                }
            }
        }
    }

    function handleRemoteStreamAdded(stream, sender) {
        if (userData.type === 'TEACHER') {
            $('#videoControls').show();
            $('#playWebCam').hide();
            $('#playScreen').hide();
            $('#stopVideoContainer').show();
            $('#muteVideo').show();
            $('#muteAudio').show();
        } else {
            $('#videoControls').hide();
        }
        if (sender.type === 'TEACHER') {
            _teacherVideo = true;
            _studentVideo = false;
        } else {
            _teacherVideo = false;
            _studentVideo = true;
        }


        $('#flashVideoContainer').show();
        $('#selectContainer').hide();
        $('#backgroundVideoImage').hide();
        remoteVideo = document.getElementById('flashVideoContainer');
        try{
            remoteVideo.srcObject = stream;
            remoteVideo.onloadedmetadata = function(e) {
                remoteVideo.play();
            };
            let video = document.getElementById('videoBackground');
            video.style.width = sender.isScreen? '100%' : '30%';
            video.style.height = sender.isScreen? '100%' : '40%';
            video.style.zIndex = sender.isScreen ? 'auto' : 1;
            remoteVideo.style.zIndex = sender.isScreen ? 'auto' : 1;
            remoteVideo.style.borderRadius = sender.isScreen ? 0 : '5%';
            let whiteboard = document.getElementById('whiteboard');
            whiteboard.style.backgroundColor = sender.isScreen ? '' : 'white';
        }catch(err){ console.error(err.name + ": " + err.message); }
    };

    function handleRemoteHangup(id) {
        peerConnections[id] && peerConnections[id].close();
        delete peerConnections[id];
    }

    function stopStreamedVideo(videoElem, sender) {
        Object.keys(peerConnections).forEach(function(id) {
            handleRemoteHangup(id);
        });
        if ((userData.type === 'TEACHER' && sender === 'TEACHER') || (userData.type === 'STUDENT' && sender === 'STUDENT')) {
            let stream = videoElem.srcObject;
            if (stream) {
                let tracks = stream.getTracks();
                tracks.forEach(function(track) {
                    track.stop();
                });
            }
            let video = document.getElementById('videoBackground');
            video.style.width = '30%';
            video.style.height = '40%';
            videoElem.style.zIndex = 1;
            video.style.zIndex = 1;
            let whiteboard = document.getElementById('whiteboard');
            whiteboard.style.backgroundColor = 'white';
            videoElem.srcObject = null;
            // socket.emit('disconnect'); Hacer esto nunca ha hecho nada, ni siquiera en la version 1.x (Y apartir de la 3.x tira error).
        }
    }

    var LANG = {
    	ES: {
            wait_please: 'El video del chat se esta guardando, favor de esperar unos minutos y no salir de la p&aacute;gina.',
            video_saved: 'Video guardado.',
            error_video: 'Hubo un problema y no se podr&aacute; guardar el video, por lo cual no ser&aacute; tomado en cuenta para el video final.',
    	},
    	EN: {
            wait_please: 'Video is saving, please wait a few minutes and do not leave the page.',
            video_saved: 'Video saved.',
            error_video: 'There was a problem and the video cannot be saved, so it will not be taken in account for the final video.',
    	}
    };

    function saveTmpVideo() {
        if (chatSave) {
            display_info(LANG[__LANGUAGE_CODE].wait_please);
            var blob = recorder.getBlob();
            recorderDestroy();
            var AUTH = '';
            if (userData.type === 'TEACHER'){
                AUTH = '/bin/t/';
            } else if(userData.type === 'STUDENT'){
                AUTH = '/bin/s/';
            }

            console.log('Sending file: ' + blob.size);
            $.ajax({
                type: 'POST',
                url: AUTH + 'chatroom/save_tmp_video',
                data: {
                    class_instance_id: userData.classInstanceId,
                    size: blob.size,
                    session_id: userData.roomId,
                },
                success: function(data) {
                    var fd = new FormData();
                    fd.append('class_instance_id', userData.classInstanceId);
                    fd.append('session_id', userData.roomId);
                    fd.append('file', blob);
                    fd.append('id', data[0].id);
                    fd.append('file_id', data[0].file_id);
                    fd.append('file_name', data[0].file_name);
                    $.ajax({
                        type: 'POST',
                        url: AUTH + 'chatroom/save_tmp_video_file',
                        data: fd,
                        processData: false,
                        contentType: false,
                        success: function(data) {
                            console.log(data);
                            display_info(LANG[__LANGUAGE_CODE].video_saved);
                        },
                        error: function() {
                            console.log(error);
                            display_error(LANG[__LANGUAGE_CODE].error_video);
                        }
                    });
                },
                error: function() {
                    console.log(error);
                }
            });
        }
    }

    function recorderDestroy(){
        if (recorder !== undefined && recorder !== null) {
            recorder.destroy();
            recorder = null;
        }
    }
}
