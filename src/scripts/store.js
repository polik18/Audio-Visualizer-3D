export const state = {
    audioContext: null,
    analyser: null,
    source: null,
    audioBuffer: null,
    dataArray: new Uint8Array(512), 
    isPlaying: false,
    
    isRecording: false,
    muxer: null,
    videoEncoder: null,
    audioEncoder: null,
    audioTrackProcessor: null,
    audioReader: null,
    recordCanvas: null,
    recordCtx: null,
    recordTargetFps: 30,
    recordedFrames: 0,
    recordingStartTime: 0,
    recordingStartTimeReal: 0,
    maxRecordTimeMs: 60 * 60 * 1000, 
    recordingInterval: null,
    hasAudioTrack: false,

    currentScene: 0,
    bassHitTimer: 0,
    hueOffset: 0,
    isAutoMode: true,
    
    vScale: 1.0,
    vRotation: 1.0,
    vColorSpeed: 1.0,
    vDensity: 1.0,
    bpm: 120,
    
    isMicMode: false,
    micStream: null,
    
    audioStartTime: 0,
    audioDuration: 0,
    currentProgress: 0,
    
    parsedLyrics: null,
    textDirty: false,
    
    lrcLines: [],        
    isLrcMode: false,    
    lrcScrollY: 0,       
    targetLrcScrollY: 0, 
    
    lrcColor: '#ffffff',
    isLrcAutoColor: true,
    lrcBgColor: '#000000',
    lrcBgOpacity: 0.65,
    isLrcBgAutoColor: true,
    plainTextStartY: 0,
    plainTextHeight: 0,
    
    activeControl: null,
    bassHistory: [], 
    flashIntensity: 0, 
    cameraShake: 0,
    
    cameraOrbitAngle: 0,
    cameraOrbitSpeed: 0.005,
    targetFov: 75,
    baseFov: 75,
    bgVideoElement: null,

    lastRenderActiveIdx: -1,
    lastRenderLrcScrollY: -999,
    lastRenderPopScale: -1,
    isPureTextDrawn: false,
    textTextureRatio: 1.0,
    
    overlayTimer: null, 
    isDraggingProgress: false,
    
    lastRecordFrameTime: 0,
    
    metroIsPlaying: false,
    metroBpm: 120,
    metroBeatsPerBar: 4,
    metroCurrentBeat: 0,
    metroNextNoteTime: 0.0,
    metroTimerID: null,
    metroLookahead: 25.0, 
    scheduleAheadTime: 0.1, 
    metroVolume: 0.8,

    tunerIsActive: false,
    tunerAnalyser: null,
    tunerTimeDomainData: null
};

export const ui = {};

export function initUI() {
    Object.assign(ui, {
        upload: document.getElementById('audio-upload'),
        removeAudioBtn: document.getElementById('remove-audio-btn'),
        audioLabelText: document.getElementById('audio-label-text'),
        bgUpload: document.getElementById('bg-upload'),
        removeBgBtn: document.getElementById('remove-bg-btn'),
        playBtn: document.getElementById('play-btn'),
        playIcon: document.getElementById('play-icon'),
        pauseIcon: document.getElementById('pause-icon'),
        playText: document.getElementById('play-text'),
        recordBtn: document.getElementById('record-btn'),
        recordCircle: document.getElementById('record-circle'),
        recordInner: document.getElementById('record-inner'),
        recordText: document.getElementById('record-text'),
        statusBox: document.getElementById('status-box'),
        titleContainer: document.getElementById('title-container'), 
        instructionsContainer: document.getElementById('instructions-container'), 
        lyricsContainer: document.getElementById('lyrics-container'), 
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingText: document.getElementById('loading-text'),
        lyricsInput: document.getElementById('lyrics-input'),
        dropZone: document.getElementById('drop-zone'),
        closeDropZone: document.getElementById('close-drop-zone'),
        micBtn: document.getElementById('mic-btn'),
        
        mainHeader: document.getElementById('main-header'), 
        footerContainer: document.getElementById('footer-container'),
        mainToolbar: document.getElementById('main-toolbar'),
        toggleUiBtn: document.getElementById('toggle-ui-btn'),
        toggleUiIcon: document.getElementById('toggle-ui-icon'),
        
        progressWrapper: document.getElementById('progress-wrapper'),
        progressSlider: document.getElementById('progress-slider'),
        timeCurrent: document.getElementById('time-current'),
        timeTotal: document.getElementById('time-total'),

        audioSourceModal: document.getElementById('audio-source-modal'),
        closeAudioModal: document.getElementById('close-audio-modal'),
        btnMicSource: document.getElementById('btn-mic-source'),
        btnSystemSource: document.getElementById('btn-system-source'),

        fxModal: document.getElementById('fx-modal'),
        closeFxModal: document.getElementById('close-fx-modal'),
        fxBtn: document.getElementById('fx-btn'),

        fullscreenBtn: document.getElementById('fullscreen-btn'),
        btnPrevScene: document.getElementById('btn-prev-scene'),
        btnNextScene: document.getElementById('btn-next-scene'),

        chkAutoScene: document.getElementById('chk-auto-scene'),
        tunerNote: document.getElementById('tuner-note'),
        tunerOctave: document.getElementById('tuner-octave'),
        tunerFreq: document.getElementById('tuner-freq'),
        tunerIndicator: document.getElementById('tuner-indicator')
    });
}
