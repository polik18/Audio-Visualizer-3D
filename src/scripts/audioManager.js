import { state, ui } from './store.js';

export function setupAudioManager(callbacks) {
    const {
        showStatus,
        parseLyrics,
        stopRecording,
        wakeUI,
        showPlayPauseOverlay,
        setUICollapseState
    } = callbacks;

    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
        const m = Math.floor(seconds / 60); 
        const s = Math.floor(seconds % 60).toString().padStart(2, '0'); 
        return `${m}:${s}`;
    }

    function initAudioContext(autoResume = true) {
        if (!state.audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            try { state.audioContext = new AudioContextClass({ latencyHint: 'playback' }); } 
            catch(e) { state.audioContext = new AudioContextClass(); }

            state.mediaStreamDestination = state.audioContext.createMediaStreamDestination();

            state.silenceOsc = state.audioContext.createOscillator();
            state.silenceGain = state.audioContext.createGain();
            state.silenceGain.gain.value = 0; 
            state.silenceOsc.connect(state.silenceGain);
            state.silenceGain.connect(state.mediaStreamDestination);
            state.silenceOsc.start();
        }
        if (autoResume && state.audioContext.state === 'suspended') {
            state.audioContext.resume();
        }
    }

    function stopAudio() {
        if (state.isMicMode) {
            if (state.micStream) { 
                state.micStream.getTracks().forEach(track => track.stop()); 
                state.micStream = null; 
            }
            state.isMicMode = false; 
            if (ui.lyricsInput) parseLyrics(ui.lyricsInput.value);
            if (ui.micBtn) {
                ui.micBtn.querySelector('div').classList.remove('bg-red-500/50', 'border-red-500'); 
            }
            if (ui.playBtn) ui.playBtn.disabled = false; 
        } else { 
            if (state.source) { 
                state.source.onended = null; 
                state.source.stop(); 
            } 
        }
        if (state.source) { 
            state.source.disconnect(); 
            state.source = null; 
        }
        
        state.isPlaying = false; 
        state.currentProgress = 0; 
        if (state.isLrcMode) state.lrcScrollY = 0;
        
        if (!state.isDraggingProgress && ui.progressSlider && ui.timeCurrent) { 
            ui.progressSlider.value = 0; 
            ui.timeCurrent.textContent = "0:00"; 
        }
        
        if (setUICollapseState) setUICollapseState(false); 
        if (wakeUI) wakeUI(); 
        
        if (ui.playIcon && ui.pauseIcon && ui.playText) {
            ui.playIcon.classList.remove('hidden'); 
            ui.pauseIcon.classList.add('hidden'); 
            ui.playText.textContent = '播放 MP3';
        }
    }

    async function handleAudioFile(file) {
        if (!file || !file.type.startsWith('audio/')) return showStatus('請上傳有效的音訊檔案');
        if (state.isMicMode) stopAudio(); 
        initAudioContext(); 
        if (state.isPlaying) stopAudio(); 
        
        state.currentProgress = 0; 
        showStatus('音訊解碼中，大檔案可能需要數秒...');
        if (ui.playBtn) ui.playBtn.disabled = true; 
        if (ui.recordBtn) ui.recordBtn.disabled = true;
        
        try {
            const arrayBuffer = await file.arrayBuffer(); 
            state.audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer);
            state.audioDuration = state.audioBuffer.duration; 
            if (ui.timeTotal) ui.timeTotal.textContent = formatTime(state.audioDuration);
            if (ui.progressWrapper) {
                ui.progressWrapper.classList.remove('hidden'); 
                setTimeout(() => ui.progressWrapper.classList.remove('opacity-0'), 50);
            }
            showStatus('音訊載入完成，請點擊播放 MP3！'); 
            if (ui.playBtn) ui.playBtn.disabled = false; 
            if (ui.recordBtn) ui.recordBtn.disabled = false;
            if (ui.removeAudioBtn) ui.removeAudioBtn.classList.remove('hidden'); 
            if (ui.audioLabelText) ui.audioLabelText.textContent = '已載入 MP3';
        } catch (error) { 
            showStatus('音訊解碼失敗，可能是格式不支援或檔案毀損。'); 
            if (ui.playBtn) ui.playBtn.disabled = true; 
            if (ui.recordBtn) ui.recordBtn.disabled = true; 
        }
    }

    async function startLiveAudio(sourceType) {
        if (ui.audioSourceModal) ui.audioSourceModal.classList.add('hidden'); 
        initAudioContext(); 
        if (state.isPlaying) stopAudio(); 
        
        try {
            let stream;
            if (sourceType === 'mic') {
                stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
            } else if (sourceType === 'system') {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
                if (stream.getAudioTracks().length === 0) { 
                    stream.getTracks().forEach(track => track.stop()); 
                    throw new Error('未分享音訊'); 
                }
            }
            state.micStream = stream; 
            state.source = state.audioContext.createMediaStreamSource(stream);
            
            if (!state.analyser) { 
                state.analyser = state.audioContext.createAnalyser(); 
                state.analyser.fftSize = 512; 
                state.analyser.smoothingTimeConstant = 0.4; 
                state.dataArray = new Uint8Array(state.analyser.frequencyBinCount); 
            }
            if (!state.tunerAnalyser) { 
                state.tunerAnalyser = state.audioContext.createAnalyser(); 
                state.tunerAnalyser.fftSize = 2048; 
                state.tunerTimeDomainData = new Float32Array(state.tunerAnalyser.fftSize); 
            }

            state.analyser.disconnect(); 
            state.tunerAnalyser.disconnect();
            
            state.source.connect(state.analyser); 
            state.source.connect(state.tunerAnalyser);
            if(state.mediaStreamDestination) state.source.connect(state.mediaStreamDestination);
            
            state.isMicMode = true; 
            state.isPlaying = true; 
            if (parseLyrics && ui.lyricsInput) parseLyrics(ui.lyricsInput.value);
            
            if (ui.micBtn) ui.micBtn.querySelector('div').classList.add('bg-red-500/50', 'border-red-500');
            if (ui.playBtn) ui.playBtn.disabled = true; 
            if (ui.recordBtn) ui.recordBtn.disabled = false; 
            
            if (ui.playIcon && ui.pauseIcon && ui.playText) {
                ui.playIcon.classList.add('hidden'); 
                ui.pauseIcon.classList.remove('hidden'); 
                ui.playText.textContent = '暫停';
            }
            if (wakeUI) wakeUI(); 
            showStatus(sourceType === 'mic' ? '🎤 麥克風收音已啟動' : '💻 電腦內部音源已連接');
            
            stream.getVideoTracks().forEach(track => { 
                track.onended = () => { if(state.isMicMode) stopAudio(); }; 
            });
        } catch (err) {
            if (err.message === '未分享音訊') showStatus('未偵測到音訊！請確保在選擇視窗中勾選了「分享系統音訊」。', 5000);
            else if (err.name === 'NotAllowedError' || (err.message && err.message.includes('display-capture'))) showStatus('無法擷取系統音訊：當前環境安全性限制。請改用「🎤 麥克風」或上傳 MP3。', 6000);
            else showStatus('無法啟動音源，請檢查瀏覽器權限或操作。');
        }
    }

    function playAudio(offset = 0, keepPaused = false) {
        if (!state.audioBuffer && !state.isMicMode) return showStatus('請先載入 MP3 音訊');
        if (state.isMicMode) stopAudio(); 
        initAudioContext(!keepPaused);
        
        if (state.source) { 
            state.source.onended = null; 
            state.source.stop(); 
            state.source.disconnect(); 
        }
        
        state.source = state.audioContext.createBufferSource(); 
        state.source.buffer = state.audioBuffer;
        
        if (!state.analyser) { 
            state.analyser = state.audioContext.createAnalyser(); 
            state.analyser.fftSize = 512; 
            state.analyser.smoothingTimeConstant = 0.4; 
            state.dataArray = new Uint8Array(state.analyser.frequencyBinCount); 
        }
        if (!state.tunerAnalyser) { 
            state.tunerAnalyser = state.audioContext.createAnalyser(); 
            state.tunerAnalyser.fftSize = 2048; 
            state.tunerTimeDomainData = new Float32Array(state.tunerAnalyser.fftSize); 
        }

        state.analyser.disconnect(); 
        state.tunerAnalyser.disconnect();
        
        state.source.connect(state.analyser); 
        state.source.connect(state.tunerAnalyser);
        state.source.connect(state.audioContext.destination); 
        if (state.mediaStreamDestination) state.source.connect(state.mediaStreamDestination);
        
        state.audioDuration = state.audioBuffer.duration; 
        state.audioStartTime = state.audioContext.currentTime - offset;
        state.source.start(0, offset); 

        if (keepPaused && state.audioContext.state === 'running') {
            state.source.onended = null; 
            state.source.stop(); 
        } else {
            state.source.onended = () => { 
                stopAudio(); 
                if(state.isRecording && stopRecording) stopRecording(); 
            };
        }

        if (!keepPaused) {
            state.isPlaying = true;
            if (state.isLrcMode && offset === 0) state.lrcScrollY = 0;
            if (wakeUI) wakeUI(); 
            if (ui.playIcon && ui.pauseIcon && ui.playText) {
                ui.playIcon.classList.add('hidden'); 
                ui.pauseIcon.classList.remove('hidden'); 
                ui.playText.textContent = '暫停';
            }
            if (offset === 0 && showPlayPauseOverlay) showPlayPauseOverlay(true); 
        } else {
            state.isPlaying = false;
            if (ui.playIcon && ui.pauseIcon && ui.playText) {
                ui.playIcon.classList.remove('hidden'); 
                ui.pauseIcon.classList.add('hidden'); 
                ui.playText.textContent = '繼續播放';
            }
        }
    }

    async function seekAudio(percent) {
        if (!state.audioBuffer || state.isMicMode) return;
        const wasPlaying = state.isPlaying; 
        const targetTime = (percent / 100) * state.audioDuration;
        
        playAudio(targetTime, !wasPlaying);
        
        if (state.isLrcMode) {
            let activeIdx = -1; 
            for (let i = state.lrcLines.length - 1; i >= 0; i--) { 
                if (targetTime >= state.lrcLines[i].time) { activeIdx = i; break; } 
            }
            state.lrcScrollY = activeIdx >= 0 ? activeIdx * 120 : 0; 
            state.textDirty = true;
        }
        
        if (!wasPlaying) {
            state.currentProgress = percent / 100;
            if (ui.timeCurrent) ui.timeCurrent.textContent = formatTime(targetTime);
        }
    }

    return {
        formatTime,
        initAudioContext,
        stopAudio,
        handleAudioFile,
        startLiveAudio,
        playAudio,
        seekAudio
    };
}
