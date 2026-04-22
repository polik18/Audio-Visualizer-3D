import { state, ui } from './store.js';

export function setupUIControls(callbacks) {
    const { 
        showStatus, parseLyrics, switchScene, startLiveAudio, 
        initAudioContext, playAudio, stopAudio 
    } = callbacks;

    let isUICollapsed = false;
    let idleTimer = null;

    function setUICollapseState(collapse) {
        isUICollapsed = collapse;
        if (collapse) {
            ui.mainHeader.classList.add('-translate-y-[150%]', 'opacity-0');
            ui.footerContainer.classList.add('translate-y-40'); 
            ui.mainToolbar.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
            ui.toggleUiIcon.classList.add('rotate-180');
            ui.toggleUiBtn.classList.add('bg-purple-600/80', 'border-purple-400');
            ui.toggleUiBtn.classList.remove('bg-gray-900/80', 'border-white/20');
        } else {
            ui.mainHeader.classList.remove('-translate-y-[150%]', 'opacity-0');
            ui.footerContainer.classList.remove('translate-y-40');
            ui.mainToolbar.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
            ui.toggleUiIcon.classList.remove('rotate-180');
            ui.toggleUiBtn.classList.remove('bg-purple-600/80', 'border-purple-400');
            ui.toggleUiBtn.classList.add('bg-gray-900/80', 'border-white/20');
            wakeUI();
        }
    }

    if (ui.toggleUiBtn) ui.toggleUiBtn.addEventListener('click', () => setUICollapseState(!isUICollapsed));

    function wakeUI() {
        if (isUICollapsed) return; 
        if (ui.mainHeader) ui.mainHeader.classList.remove('opacity-30');
        if (ui.footerContainer) ui.footerContainer.classList.remove('opacity-30');
        document.body.style.cursor = 'default';
        clearTimeout(idleTimer);
        if (state.isPlaying) {
            idleTimer = setTimeout(() => {
                if (ui.mainHeader) ui.mainHeader.classList.add('opacity-30');
                if (ui.footerContainer) ui.footerContainer.classList.add('opacity-30');
            }, 2500); 
        }
    }

    window.addEventListener('mousemove', wakeUI);
    window.addEventListener('touchstart', wakeUI, { passive: true });
    window.addEventListener('keydown', wakeUI);
    window.addEventListener('click', wakeUI);

    function showPlayPauseOverlay(isPlaying) {
        if (isPlaying) {
            if (ui.overlayIconPlay) ui.overlayIconPlay.classList.remove('hidden'); 
            if (ui.overlayIconPause) ui.overlayIconPause.classList.add('hidden');
        } else {
            if (ui.overlayIconPlay) ui.overlayIconPlay.classList.add('hidden'); 
            if (ui.overlayIconPause) ui.overlayIconPause.classList.remove('hidden');
        }
        if (ui.playPauseOverlay) {
            ui.playPauseOverlay.classList.remove('opacity-0', 'scale-50');
            ui.playPauseOverlay.classList.add('opacity-100', 'scale-100');
            if (state.overlayTimer) clearTimeout(state.overlayTimer);
            state.overlayTimer = setTimeout(() => {
                ui.playPauseOverlay.classList.remove('opacity-100', 'scale-100');
                ui.playPauseOverlay.classList.add('opacity-0', 'scale-50');
            }, 800);
        }
    }

    function unlockAudioContext() {
        if (initAudioContext) initAudioContext();
        window.removeEventListener('click', unlockAudioContext, true);
        window.removeEventListener('touchstart', unlockAudioContext, { passive: true, capture: true });
    }
    window.addEventListener('click', unlockAudioContext, true);
    window.addEventListener('touchstart', unlockAudioContext, { passive: true, capture: true });

    function handleEscape() {
        let acted = false;
        if (document.activeElement && (document.activeElement === ui.lyricsInput || document.activeElement.tagName === 'INPUT')) {
            document.activeElement.blur(); acted = true;
        }
        if (ui.dropZone && !ui.dropZone.classList.contains('hidden')) { ui.closeDropZone.click(); acted = true; }
        if (ui.audioSourceModal && !ui.audioSourceModal.classList.contains('hidden')) { ui.closeAudioModal.click(); acted = true; }
        if (ui.fxModal && !ui.fxModal.classList.contains('hidden')) { ui.closeFxModal.click(); acted = true; }
        if (ui.tunerModal && !ui.tunerModal.classList.contains('hidden')) { ui.closeTunerModal.click(); acted = true; }
        if (ui.metroModal && !ui.metroModal.classList.contains('hidden')) { ui.closeMetroModal.click(); acted = true; }
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            acted = true;
        }
        return acted;
    }

    const slScale = document.getElementById('slider-scale');
    const slRotation = document.getElementById('slider-rotation');
    const slColor = document.getElementById('slider-color');
    const slDensity = document.getElementById('slider-density');
    const slBpm = document.getElementById('slider-bpm');
    const chkAutoScene = document.getElementById('toggle-auto-scene');
    const inputLrcColor = document.getElementById('input-lrc-color');
    const chkLrcAutoColor = document.getElementById('toggle-lrc-auto-color');
    const inputLrcBgColor = document.getElementById('input-lrc-bg-color');
    const chkLrcBgAutoColor = document.getElementById('toggle-lrc-bg-auto-color');
    const slLrcBgOpacity = document.getElementById('slider-lrc-bg-opacity');

    function syncFXPanel() {
        if (slScale) { slScale.value = state.vScale; document.getElementById('val-scale').textContent = Math.round(state.vScale * 100) + '%'; }
        if (slRotation) { slRotation.value = state.vRotation; document.getElementById('val-rotation').textContent = Math.round(state.vRotation * 100) + '%'; }
        if (slColor) { slColor.value = state.vColorSpeed; document.getElementById('val-color').textContent = Math.round(state.vColorSpeed * 100) + '%'; }
        if (slDensity) { slDensity.value = state.vDensity; document.getElementById('val-density').textContent = Math.round(state.vDensity * 100) + '%'; }
        if (slBpm) { slBpm.value = state.bpm; document.getElementById('val-bpm').textContent = state.bpm; }
        if (chkAutoScene) chkAutoScene.checked = state.isAutoMode;
        
        if (inputLrcColor) {
            inputLrcColor.value = state.lrcColor;
            inputLrcColor.disabled = state.isLrcAutoColor;
            inputLrcColor.style.opacity = state.isLrcAutoColor ? '0.4' : '1';
        }
        if (chkLrcAutoColor) chkLrcAutoColor.checked = state.isLrcAutoColor;
        
        if (inputLrcBgColor) {
            inputLrcBgColor.value = state.lrcBgColor;
            inputLrcBgColor.disabled = state.isLrcBgAutoColor;
            inputLrcBgColor.style.opacity = state.isLrcBgAutoColor ? '0.4' : '1';
        }
        if (chkLrcBgAutoColor) chkLrcBgAutoColor.checked = state.isLrcBgAutoColor;
        
        if (slLrcBgOpacity) {
            slLrcBgOpacity.value = Math.round(state.lrcBgOpacity * 100); 
            const valEl = document.getElementById('val-lrc-bg-opacity');
            if (valEl) valEl.textContent = Math.round(state.lrcBgOpacity * 100) + '%';
        }
    }
    syncFXPanel();

    if (ui.fxBtn) ui.fxBtn.addEventListener('click', () => { syncFXPanel(); ui.fxModal.classList.remove('hidden'); });
    if (ui.closeFxModal) ui.closeFxModal.addEventListener('click', () => ui.fxModal.classList.add('hidden'));

    if (ui.fullscreenBtn) {
        ui.fullscreenBtn.addEventListener('click', () => {
            const docElm = document.documentElement;
            const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
            if (!isFullscreen) {
                if (docElm.requestFullscreen) docElm.requestFullscreen();
                else if (docElm.webkitRequestFullscreen) docElm.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        });
    }

    function updateFullscreenUI() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        if (isFullscreen) {
            if (ui.iconFullscreenEnter) ui.iconFullscreenEnter.classList.add('hidden'); 
            if (ui.iconFullscreenExit) ui.iconFullscreenExit.classList.remove('hidden'); 
            if (ui.fullscreenText) ui.fullscreenText.textContent = '還原';
        } else {
            if (ui.iconFullscreenEnter) ui.iconFullscreenEnter.classList.remove('hidden'); 
            if (ui.iconFullscreenExit) ui.iconFullscreenExit.classList.add('hidden'); 
            if (ui.fullscreenText) ui.fullscreenText.textContent = '全螢幕';
        }
    }
    document.addEventListener('fullscreenchange', updateFullscreenUI);
    document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

    if (ui.openTunerBtn) {
        ui.openTunerBtn.addEventListener('click', () => {
            ui.tunerModal.classList.remove('hidden'); state.tunerIsActive = true;
            if (!state.isPlaying && !state.isMicMode) {
                if (startLiveAudio) startLiveAudio('mic');
            }
        });
    }
    if (ui.closeTunerModal) {
        ui.closeTunerModal.addEventListener('click', () => {
            ui.tunerModal.classList.add('hidden'); state.tunerIsActive = false;
            if (ui.tunerFreq) ui.tunerFreq.textContent = '-- Hz'; 
            if (ui.tunerIndicator) {
                ui.tunerIndicator.style.left = '50%';
                ui.tunerIndicator.className = 'absolute top-0 bottom-0 w-2 bg-gray-500 transform -translate-x-1/2 transition-all duration-75';
            }
            if (ui.tunerNote) ui.tunerNote.className = 'text-7xl font-bold text-gray-600 transition-colors duration-150 drop-shadow-lg'; 
            if (ui.tunerOctave) ui.tunerOctave.textContent = '';
        });
    }

    if (slScale) slScale.addEventListener('input', (e) => { state.vScale = parseFloat(e.target.value); syncFXPanel(); });
    if (slRotation) slRotation.addEventListener('input', (e) => { state.vRotation = parseFloat(e.target.value); syncFXPanel(); });
    if (slColor) slColor.addEventListener('input', (e) => { state.vColorSpeed = parseFloat(e.target.value); syncFXPanel(); });
    if (slDensity) slDensity.addEventListener('input', (e) => { state.vDensity = parseFloat(e.target.value); syncFXPanel(); });
    if (slBpm) slBpm.addEventListener('input', (e) => { state.bpm = parseInt(e.target.value); syncFXPanel(); });
    
    if (inputLrcColor) inputLrcColor.addEventListener('input', (e) => {
        state.lrcColor = e.target.value; state.textDirty = true;
        if (!state.isLrcMode && ui.lyricsInput && ui.lyricsInput.value.trim() !== '' && parseLyrics) parseLyrics(ui.lyricsInput.value);
    });
    if (chkLrcAutoColor) chkLrcAutoColor.addEventListener('change', (e) => {
        state.isLrcAutoColor = e.target.checked; syncFXPanel(); state.textDirty = true;
        if (!state.isLrcMode && ui.lyricsInput && ui.lyricsInput.value.trim() !== '' && parseLyrics) parseLyrics(ui.lyricsInput.value);
    });
    
    if (inputLrcBgColor) inputLrcBgColor.addEventListener('input', (e) => {
        state.lrcBgColor = e.target.value; state.textDirty = true;
        if (!state.isLrcMode && ui.lyricsInput && ui.lyricsInput.value.trim() !== '' && parseLyrics) parseLyrics(ui.lyricsInput.value);
    });
    if (chkLrcBgAutoColor) chkLrcBgAutoColor.addEventListener('change', (e) => {
        state.isLrcBgAutoColor = e.target.checked; syncFXPanel(); state.textDirty = true;
        if (!state.isLrcMode && ui.lyricsInput && ui.lyricsInput.value.trim() !== '' && parseLyrics) parseLyrics(ui.lyricsInput.value);
    });
    if (slLrcBgOpacity) slLrcBgOpacity.addEventListener('input', (e) => {
        state.lrcBgOpacity = parseInt(e.target.value) / 100;
        const valEl = document.getElementById('val-lrc-bg-opacity');
        if (valEl) valEl.textContent = e.target.value + '%';
        state.textDirty = true;
        if (!state.isLrcMode && ui.lyricsInput && ui.lyricsInput.value.trim() !== '' && parseLyrics) parseLyrics(ui.lyricsInput.value);
    });
    
    if (chkAutoScene) chkAutoScene.addEventListener('change', (e) => { state.isAutoMode = e.target.checked; if(showStatus) showStatus(state.isAutoMode ? '自動模式開啟' : '手動模式開啟'); });
    const btnPrevScene = document.getElementById('btn-prev-scene');
    if (btnPrevScene) btnPrevScene.addEventListener('click', () => { state.isAutoMode = false; syncFXPanel(); if(switchScene) switchScene(state.currentScene - 1); });
    const btnNextScene = document.getElementById('btn-next-scene');
    if (btnNextScene) btnNextScene.addEventListener('click', () => { state.isAutoMode = false; syncFXPanel(); if(switchScene) switchScene(state.currentScene + 1); });

    const ctrlItems = document.querySelectorAll('.ctrl-item');
    ctrlItems.forEach(item => {
        item.addEventListener('click', () => {
            if (document.activeElement) document.activeElement.blur(); 
            ctrlItems.forEach(i => { i.classList.remove('bg-purple-500/30', 'border-purple-500'); i.querySelector('.name').classList.replace('text-white', 'text-gray-400'); });
            item.classList.add('bg-purple-500/30', 'border-purple-500'); item.querySelector('.name').classList.replace('text-gray-400', 'text-white');
            state.activeControl = item.getAttribute('data-target'); if(showStatus) showStatus(`已鎖定控制：${item.querySelector('.name').innerText} (請使用方向鍵 ↑↓ 或雙指縮放調整)`);
        });
    });

    const btnHotkeyC = document.getElementById('btn-hotkey-c');
    if (btnHotkeyC) btnHotkeyC.addEventListener('click', () => { state.isAutoMode = !state.isAutoMode; if(showStatus) showStatus(state.isAutoMode ? '自動模式開啟' : '手動模式開啟'); syncFXPanel(); });
    const btnHotkeySpace = document.getElementById('btn-hotkey-space');
    if (btnHotkeySpace && ui.playBtn) btnHotkeySpace.addEventListener('click', () => { ui.playBtn.click(); });
    const btnHotkeyEnter = document.getElementById('btn-hotkey-enter');
    if (btnHotkeyEnter) btnHotkeyEnter.addEventListener('click', () => { setUICollapseState(!isUICollapsed); });
    const btnHotkeyEsc = document.getElementById('btn-hotkey-esc');
    if (btnHotkeyEsc) btnHotkeyEsc.addEventListener('click', () => { handleEscape(); });

    return {
        setUICollapseState,
        wakeUI,
        showPlayPauseOverlay,
        handleEscape,
        syncFXPanel
    };
}
