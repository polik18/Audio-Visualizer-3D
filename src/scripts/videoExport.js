import { state, ui } from './store.js';

export function setupVideoExport(callbacks) {
    const { showStatus, initAudioContext, playAudio } = callbacks;

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.style.display = 'none'; 
        a.href = url; 
        a.download = filename;
        document.body.appendChild(a); 
        a.click(); 
        setTimeout(() => { 
            document.body.removeChild(a); 
            window.URL.revokeObjectURL(url); 
        }, 100);
    }

    async function startRecording() {
        if (typeof VideoEncoder === 'undefined') return showStatus('⚠️ 您的瀏覽器太舊不支援新一代高畫質 WebCodecs 引擎，請使用最新版 Chrome 或 Edge。');
        if (state.isMicMode && !state.isPlaying) return showStatus('請先啟動現場收音再開始錄製');

        if (initAudioContext) initAudioContext();
        if (!state.isMicMode && !state.mediaStreamDestination && state.audioContext && state.audioContext.createMediaStreamDestination) {
            state.mediaStreamDestination = state.audioContext.createMediaStreamDestination();
        }

        const wasPlaying = state.isPlaying;
        let currentOffset = 0;
        if (!state.isMicMode && state.audioBuffer && ui.progressSlider) {
            currentOffset = (ui.progressSlider.value / 100) * state.audioDuration || 0;
        }
        
        const qualityElement = document.getElementById('export-quality');
        const ratioElement = document.getElementById('export-ratio');
        const quality = qualityElement ? qualityElement.value : 'high'; 
        const ratio = ratioElement ? ratioElement.value : '16:9';
        const isFast = quality === 'fast';
        const fps = isFast ? 30 : 60;
        state.recordTargetFps = fps; 
        
        state.recordCanvas = document.createElement('canvas');
        
        let rawW, rawH;
        const baseRes = isFast ? 720 : 1080;
        if (ratio === '16:9') { rawW = Math.round((baseRes * 16) / 9); rawH = baseRes; }
        else if (ratio === '9:16') { rawW = baseRes; rawH = Math.round((baseRes * 16) / 9); }
        else {
            const ar = window.innerWidth / window.innerHeight;
            if (ar > 1) { rawH = baseRes; rawW = Math.round(baseRes * ar); }
            else { rawW = baseRes; rawH = Math.round(baseRes / ar); }
        }

        const maxW = isFast ? 1280 : 1920;
        const maxH = isFast ? 720 : 1080;
        let W = rawW, H = rawH;
        if (rawW > maxW || rawH > maxH) {
            const scale = Math.min(maxW / rawW, maxH / rawH);
            W = Math.round(rawW * scale);
            H = Math.round(rawH * scale);
        }

        W = Math.floor(W / 2) * 2; H = Math.floor(H / 2) * 2; 
        state.recordCanvas.width = W; state.recordCanvas.height = H;
        state.recordCtx = state.recordCanvas.getContext('2d', { willReadFrequently: true, alpha: false });

        state.hasAudioTrack = false;
        let audioTrack = null;
        if (state.isMicMode && state.micStream) { 
            audioTrack = state.micStream.getAudioTracks()[0]; 
        } else if (!state.isMicMode && state.mediaStreamDestination) { 
            audioTrack = state.mediaStreamDestination.stream.getAudioTracks()[0]; 
        }
        
        if (audioTrack && typeof MediaStreamTrackProcessor !== 'undefined') {
            state.hasAudioTrack = true;
        } else if (audioTrack) {
            showStatus('⚠️ 您的瀏覽器不支援高畫質音軌擷取，將導出無聲影片。建議改用最新版 Chrome。');
        }

        let audioSampleRate = 44100;
        let audioChannels = 2;
        if (state.hasAudioTrack) {
            const settings = audioTrack.getSettings();
            audioSampleRate = settings.sampleRate || state.audioContext.sampleRate || 44100;
            audioChannels = settings.channelCount || 2;
        }

        let firstAudioTs = null;

        try {
            state.muxer = new window.Mp4Muxer.Muxer({
                target: new window.Mp4Muxer.ArrayBufferTarget(),
                video: { codec: 'avc', width: W, height: H },
                audio: state.hasAudioTrack ? { codec: 'aac', sampleRate: audioSampleRate, numberOfChannels: audioChannels } : undefined,
                fastStart: 'in-memory'
            });

            const codecString = isFast ? 'avc1.42E01F' : 'avc1.4D402A'; 

            state.videoEncoder = new VideoEncoder({
                output: (chunk, meta) => state.muxer.addVideoChunk(chunk, meta),
                error: e => console.error('VideoEncoder error:', e)
            });
            state.videoEncoder.configure({
                codec: codecString, 
                width: W, height: H,
                bitrate: isFast ? 5_000_000 : 12_000_000, 
                framerate: fps,
                bitrateMode: 'variable', 
                latencyMode: 'quality'   
            });

            state.isRecording = true; 

            if (state.hasAudioTrack) {
                state.audioEncoder = new AudioEncoder({
                    output: (chunk, meta) => {
                        if (firstAudioTs === null) firstAudioTs = chunk.timestamp;
                        
                        const buffer = new ArrayBuffer(chunk.byteLength);
                        chunk.copyTo(buffer);
                        
                        const chunkConfig = {
                            type: chunk.type,
                            timestamp: chunk.timestamp - firstAudioTs,
                            data: buffer
                        };
                        if (chunk.duration !== null) chunkConfig.duration = chunk.duration;
                        
                        const alignedChunk = new EncodedAudioChunk(chunkConfig);
                        state.muxer.addAudioChunk(alignedChunk, meta);
                    },
                    error: e => console.error('AudioEncoder error:', e)
                });
                state.audioEncoder.configure({
                    codec: 'mp4a.40.2', 
                    sampleRate: audioSampleRate,
                    numberOfChannels: audioChannels,
                    bitrate: 192_000 
                });

                state.audioTrackProcessor = new MediaStreamTrackProcessor({ track: audioTrack });
                state.audioReader = state.audioTrackProcessor.readable.getReader();

                const readAudio = async () => {
                    try {
                        while (state.isRecording) {
                            const { done, value } = await state.audioReader.read();
                            if (done) break;
                            if (value) {
                                if (state.audioEncoder && state.audioEncoder.state === 'configured') {
                                    state.audioEncoder.encode(value);
                                }
                                value.close(); 
                            }
                        }
                    } catch (e) { 
                    }
                };
                readAudio();
            }

        } catch (e) {
            state.isRecording = false; 
            console.error(e); 
            return showStatus('錄影引擎初始化失敗，可能是您的設備不支援此編碼規格。');
        }

        state.recordedFrames = 0;
        state.recordingStartTime = performance.now(); 
        state.recordingStartTimeReal = Date.now();
        state.lastRecordFrameTime = 0; 
        showStatus('✨ 極致畫質引擎運轉中 (錄製已開始)...');

        if (ui.recordInner && ui.recordCircle && ui.recordText) {
            ui.recordInner.classList.remove('rounded-full', 'w-4', 'h-4'); 
            ui.recordInner.classList.add('rounded-sm', 'w-6', 'h-6'); 
            ui.recordCircle.classList.add('animate-pulse');
            const btnTextSpan = ui.recordText.querySelector('span:first-child'); 
            if (btnTextSpan) btnTextSpan.textContent = '停止錄製';
        }
        
        const timerEl = document.getElementById('record-timer'); 
        if (timerEl) timerEl.classList.remove('hidden'); 
        
        state.recordingInterval = setInterval(() => {
            const elapsed = Date.now() - state.recordingStartTimeReal;
            if (elapsed >= state.maxRecordTimeMs) { 
                stopRecording(); 
                showStatus('已達最大錄製時間 (60分鐘)，系統自動停止。', 6000); 
                return; 
            }
            const secs = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0'); 
            const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
            
            let displayTime = `${mins}:${secs}`;
            if (mins >= 60) {
                const hrs = Math.floor(mins / 60); 
                const remMins = (mins % 60).toString().padStart(2, '0'); 
                displayTime = `${hrs}:${remMins}:${secs}`;
            }
            if (timerEl) timerEl.textContent = `${displayTime} / 60:00`;
        }, 1000);

        if (!state.isMicMode && state.audioBuffer && !wasPlaying) { 
            setTimeout(() => { if (playAudio) playAudio(currentOffset); }, 100); 
        }
    }

    async function stopRecording() {
        if (state.isRecording) {
            state.isRecording = false;
            
            if (ui.recordInner && ui.recordCircle && ui.recordText) {
                ui.recordInner.classList.remove('rounded-sm', 'w-6', 'h-6'); 
                ui.recordInner.classList.add('rounded-full', 'w-4', 'h-4'); 
                ui.recordCircle.classList.remove('animate-pulse');
                const btnTextSpan = ui.recordText.querySelector('span:first-child'); 
                if (btnTextSpan) btnTextSpan.textContent = '開始錄製';
            }
            
            clearInterval(state.recordingInterval); 
            const timerEl = document.getElementById('record-timer'); 
            if (timerEl) {
                timerEl.classList.add('hidden'); 
                timerEl.textContent = '00:00 / 60:00';
            }

            showStatus('正在極速封裝 MP4 (100% 前端處理)...');
            if (ui.loadingOverlay) {
                ui.loadingOverlay.classList.remove('hidden'); 
                ui.loadingOverlay.style.display = 'flex';
            }

            try {
                if (state.audioReader) { 
                    try { await state.audioReader.cancel(); } catch(e){} 
                    state.audioReader = null; 
                }
                
                if (state.videoEncoder) {
                    if (state.videoEncoder.state === 'configured') {
                        try { await state.videoEncoder.flush(); } catch(e) { console.error('Video Flush Error:', e); }
                    }
                    state.videoEncoder.close();
                }
                if (state.audioEncoder) {
                    if (state.audioEncoder.state === 'configured') {
                        try { await state.audioEncoder.flush(); } catch(e) { console.error('Audio Flush Error:', e); }
                    }
                    state.audioEncoder.close();
                }

                state.muxer.finalize();
                const buffer = state.muxer.target.buffer;
                const blob = new Blob([buffer], { type: 'video/mp4' });
                
                downloadBlob(blob, 'visualizer_pro.mp4');
                showStatus('🎉 無損高畫質 MP4 導出成功！');

            } catch (e) {
                console.error(e); 
                showStatus('封裝失敗: ' + e.message);
            } finally {
                if (ui.loadingOverlay) {
                    ui.loadingOverlay.classList.add('hidden'); 
                    ui.loadingOverlay.style.display = 'none';
                }
                state.muxer = null; 
                state.videoEncoder = null; 
                state.audioEncoder = null; 
                state.audioTrackProcessor = null;
            }
        }
    }

    function captureFrame(canvasElement) {
        if (state.isRecording && state.videoEncoder && state.videoEncoder.state === 'configured') {
            if (state.videoEncoder.encodeQueueSize > 5) return;

            const now = performance.now();
            const frameIntervalMs = 1000 / state.recordTargetFps;
            
            if (now - state.lastRecordFrameTime >= frameIntervalMs - 2) {
                state.lastRecordFrameTime = now;
                const timestampUs = Math.round((state.recordedFrames * 1000000) / state.recordTargetFps);
                
                const sw = canvasElement.width; const sh = canvasElement.height;
                const tw = state.recordCanvas.width; const th = state.recordCanvas.height;
                const sRatio = sw / sh; const tRatio = tw / th;
                let cropW = sw, cropH = sh, cropX = 0, cropY = 0;
                if (sRatio > tRatio) { cropW = sh * tRatio; cropX = (sw - cropW) / 2; } 
                else { cropH = sw / tRatio; cropY = (sh - cropH) / 2; }

                state.recordCtx.imageSmoothingEnabled = true;
                state.recordCtx.imageSmoothingQuality = 'high';
                state.recordCtx.fillStyle = 'black';
                state.recordCtx.fillRect(0, 0, tw, th);
                state.recordCtx.drawImage(canvasElement, cropX, cropY, cropW, cropH, 0, 0, tw, th);

                const frame = new VideoFrame(state.recordCanvas, { timestamp: timestampUs });
                const insertKeyframe = (state.recordedFrames % state.recordTargetFps === 0);
                
                try { state.videoEncoder.encode(frame, { keyFrame: insertKeyframe }); } 
                catch(e) { console.error('影片編碼錯誤:', e); }
                
                frame.close();
                state.recordedFrames++;
            }
        }
    }

    return {
        startRecording,
        stopRecording,
        captureFrame
    };
}
