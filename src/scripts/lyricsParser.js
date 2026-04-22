import { state, ui } from './store.js';

export function setupLyricsParser(context) {
    const {
        textCanvas, textCtx, textTexture, textSprite,
        bgMaskCanvas, bgMaskCtx, bgMaskTexture, bgMaskSprite,
        showStatus
    } = context;

    function drawLrcMask() {
        bgMaskCanvas.width = 2048; bgMaskCanvas.height = 1024;
        bgMaskCtx.clearRect(0, 0, 2048, 1024);
        const cx = 1024; const cy = 512;
        
        bgMaskCtx.save();
        bgMaskCtx.translate(cx, cy);
        bgMaskCtx.scale(1, 0.2); 
        
        const rGrad = bgMaskCtx.createRadialGradient(0, 0, 0, 0, 800);
        rGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        rGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        rGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        bgMaskCtx.fillStyle = rGrad;
        bgMaskCtx.fillRect(-1024, -2560, 2048, 5120); 
        bgMaskCtx.restore();
        bgMaskTexture.needsUpdate = true;
    }

    function drawPlainMask(startY, height) {
        bgMaskCanvas.width = 2048; bgMaskCanvas.height = Math.max(1024, height + 1024);
        bgMaskCtx.clearRect(0, 0, bgMaskCanvas.width, bgMaskCanvas.height);
        
        const cx = 1024;
        const hGrad = bgMaskCtx.createLinearGradient(cx - 900, 0, cx + 900, 0);
        hGrad.addColorStop(0, 'rgba(255,255,255,0)');
        hGrad.addColorStop(0.3, 'rgba(255,255,255,1)');
        hGrad.addColorStop(0.7, 'rgba(255,255,255,1)');
        hGrad.addColorStop(1, 'rgba(255,255,255,0)');
        
        bgMaskCtx.fillStyle = hGrad;
        bgMaskCtx.filter = 'blur(40px)'; 
        bgMaskCtx.fillRect(cx - 900, startY - 100, 1800, height + 200);
        bgMaskCtx.filter = 'none';
        bgMaskTexture.needsUpdate = true;
    }

    function parseLyrics(text) {
        state.isPureTextDrawn = false;
        if(text.trim() === '') {
            state.parsedLyrics = null; state.lrcLines = []; state.isLrcMode = false;
            textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height); textTexture.needsUpdate = true;
            bgMaskCtx.clearRect(0, 0, bgMaskCanvas.width, bgMaskCanvas.height); bgMaskTexture.needsUpdate = true;
            return;
        }

        const lrcRegex = /\\[(\\d{2,}):(\\d{2})(?:\\.(\\d{2,3}))?\\]/; 
        state.isLrcMode = lrcRegex.test(text); 
        let plainTextForFallback = text;

        if (state.isLrcMode) {
            state.lrcLines = []; const lines = text.split('\\n'); const cleanLines = [];
            lines.forEach(line => {
                const match = line.match(/\\[(\\d{2,}):(\\d{2})(?:\\.(\\d{2,3}))?\\]/);
                if (match) {
                    const mins = parseInt(match[1]), secs = parseInt(match[2]), ms = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
                    const timeInSeconds = mins * 60 + secs + ms / 1000; const content = line.replace(/\\[.*?\\]/g, '').trim();
                    if (content) state.lrcLines.push({ time: timeInSeconds, text: content });
                }
                const clean = line.replace(/\\[.*?\\]/g, '').trim(); if (clean) cleanLines.push(clean);
            });
            state.lrcLines.sort((a, b) => a.time - b.time); state.lrcScrollY = 0; plainTextForFallback = cleanLines.join('\\n');
            textCanvas.height = 1024; textTexture.repeat.set(1, 1); textTexture.offset.y = 0; textSprite.scale.set(100, 50, 1); state.textDirty = true;
            
            drawLrcMask(); 
            if (showStatus) showStatus('LRC 動態歌詞解析成功！'); return;
        }

        const fontSize = 60, titleFontSize = 90, maxWidth = textCanvas.width * 0.85, lineHeightFactor = 1.4; 
        const originalLines = plainTextForFallback.split('\\n'); const titleStr = originalLines[0] || ''; const lyricsStrs = originalLines.slice(1);
        const parsedLines = []; let currentOffsetY = 0;

        function wrapText(str, size, isTitle) {
            textCtx.font = `bold ${size}px 'Segoe UI', sans-serif`; let currentLine = '';
            for (let i = 0; i < str.length; i++) {
                const char = str[i]; const testLine = currentLine + char;
                if (textCtx.measureText(testLine).width > maxWidth && currentLine !== '') {
                    parsedLines.push({ text: currentLine, size: size, isTitle: isTitle, offsetY: currentOffsetY });
                    currentOffsetY += size * lineHeightFactor; currentLine = char;
                } else currentLine = testLine;
            }
            if (currentLine !== '') { parsedLines.push({ text: currentLine, size: size, isTitle: isTitle, offsetY: currentOffsetY }); currentOffsetY += size * lineHeightFactor; }
        }

        if (titleStr) { wrapText(titleStr, titleFontSize, true); currentOffsetY += 30; }
        for (const line of lyricsStrs) { if (line.trim() === '') { currentOffsetY += fontSize * lineHeightFactor; continue; } wrapText(line, fontSize, false); }
        parsedLines.forEach(line => { line.offsetY += (line.size * lineHeightFactor) / 2; });

        const visibleHeight = 1024, topPadding = visibleHeight * 0.4, bottomPadding = visibleHeight * 0.8;
        const requiredHeight = currentOffsetY + topPadding + bottomPadding; let actualHeight = 1024, contentScale = 1;

        if (state.isMicMode) { actualHeight = visibleHeight; if (currentOffsetY > visibleHeight * 0.85) contentScale = (visibleHeight * 0.85) / currentOffsetY; } 
        else { actualHeight = Math.min(8192, requiredHeight); if (requiredHeight > 8192) contentScale = 8192 / requiredHeight; }

        textCanvas.width = 2048; textCanvas.height = actualHeight;
        const repeatY = visibleHeight / actualHeight; textTexture.repeat.set(1, repeatY); textTexture.offset.y = state.isMicMode ? 0 : (1.0 - repeatY); state.textTextureRatio = repeatY;
        textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

        textCtx.textAlign = "center"; 
        textCtx.textBaseline = "middle";

        let baseStartY = state.isMicMode ? (actualHeight - (currentOffsetY * contentScale)) / 2 : topPadding * contentScale;
        state.plainTextStartY = baseStartY; state.plainTextHeight = currentOffsetY * contentScale;
        
        drawPlainMask(state.plainTextStartY, state.plainTextHeight); 
        bgMaskTexture.repeat.copy(textTexture.repeat); bgMaskTexture.offset.copy(textTexture.offset); 

        for (const line of parsedLines) {
            const actualOffsetY = line.offsetY * contentScale; const y = baseStartY + actualOffsetY; const scaledSize = line.size * contentScale;
            textCtx.font = `bold ${scaledSize}px 'Segoe UI', sans-serif`;
            textCtx.shadowColor = 'rgba(0, 0, 0, 0.9)'; textCtx.shadowBlur = scaledSize * 0.2; textCtx.lineWidth = scaledSize * 0.12; textCtx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
            textCtx.strokeText(line.text, textCanvas.width / 2, y); textCtx.shadowBlur = 0; 
            textCtx.fillStyle = '#ffffff'; 
            textCtx.fillText(line.text, textCanvas.width / 2, y);
        }
        textTexture.needsUpdate = true; state.isPureTextDrawn = true; 
        if (showStatus) showStatus('純文字歌詞已載入 (單次渲染極速模式 ⚡)');
    }

    function renderVisibleLyrics(currentTime = 0) {
        if (!state.isLrcMode || state.lrcLines.length === 0 || state.isMicMode) return;
        const canvasCenterY = textCanvas.height / 2; let activeIdx = -1;
        for (let i = state.lrcLines.length - 1; i >= 0; i--) { if (currentTime >= state.lrcLines[i].time) { activeIdx = i; break; } }
        state.targetLrcScrollY = activeIdx >= 0 ? activeIdx * 120 : 0; state.lrcScrollY += (state.targetLrcScrollY - state.lrcScrollY) * 0.1;
        let popScale = 1;
        if (activeIdx >= 0) { const timeSinceStart = currentTime - state.lrcLines[activeIdx].time; if (timeSinceStart < 0.15 && timeSinceStart >= 0) popScale = 1 + (0.15 - timeSinceStart) * 1.5; }

        const needsRedraw = state.textDirty || activeIdx !== state.lastRenderActiveIdx || Math.abs(state.lrcScrollY - state.lastRenderLrcScrollY) > 0.5 || Math.abs(popScale - state.lastRenderPopScale) > 0.01;
        if (!needsRedraw) return; 

        state.lastRenderActiveIdx = activeIdx; state.lastRenderLrcScrollY = state.lrcScrollY; state.lastRenderPopScale = popScale; state.textDirty = false;
        textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
        textCtx.textAlign = "center"; textCtx.textBaseline = "middle";

        for (let i = 0; i < state.lrcLines.length; i++) {
            const line = state.lrcLines[i]; const yOffset = (i * 120) - state.lrcScrollY; const y = canvasCenterY + yOffset;
            if (y > -150 && y < textCanvas.height + 150) {
                const dist = Math.abs(i - activeIdx); const isActive = (i === activeIdx);
                let currentPopScale = isActive ? popScale : 1; let fontSize = isActive ? 80 * currentPopScale : Math.max(40, 60 - dist * 5);
                let opacity = isActive ? 1 : Math.max(0.1, 0.5 - dist * 0.1);
                textCtx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`; textCtx.shadowColor = `rgba(0, 0, 0, ${opacity})`; textCtx.shadowBlur = 20; textCtx.lineWidth = fontSize * 0.15;
                textCtx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.95})`; textCtx.strokeText(line.text, textCanvas.width / 2, y); textCtx.shadowBlur = 0;
                textCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`; 
                textCtx.fillText(line.text, textCanvas.width / 2, y);
            }
        }
        textTexture.needsUpdate = true; 
    }

    return {
        parseLyrics,
        renderVisibleLyrics
    };
}
