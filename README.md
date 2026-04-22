# Audio-Visualizer-3D

這是一個完全基於前端網頁技術打造的高效能 3D 音訊視覺化工具 (3D Audio Visualizer)。本專案無需任何後端伺服器進行影音處理，直接在瀏覽器內實現即時的音樂頻譜分析、3D 特效渲染、動態歌詞顯示、內建節拍器/調音器，並支援原生的 WebCodecs 高畫質 MP4 錄影導出。

---

## 📖 第一部分：使用者操作手冊 (User Manual)

### 🚀 快速開始

由於本專案採用原生的 ES Modules 架構進行模組化，瀏覽器基於安全性限制無法直接透過 `file://` 協定執行模組碼。請務必使用本地伺服器運行：

**方法 1：使用 Python (推薦，系統通常內建)**
```bash
cd Audio-Visualizer-3D
python3 -m http.server 8042
```
然後在瀏覽器開啟：`http://localhost:8042`

**方法 2：使用 Node.js**
```bash
npx serve .
```

### 🎵 音訊輸入方式
1. **本地音樂檔案**：直接將 `.mp3`, `.wav`, 或 `.aac` 檔案拖曳進網頁畫面中，即可立即播放。
2. **現場收音 (麥克風)**：點擊左上角的「音源輸入」，選擇「開啟麥克風」，網頁將即時捕捉環境聲音或人聲進行視覺化。
3. **系統音訊**：在「音源輸入」中選擇「系統音訊擷取」，您可以分享瀏覽器分頁或是系統音效。

### 🌌 場景與特效控制
本系統內建了 **50 種**不同的 3D 視覺場景。
- **切換場景**：
  - **電腦操作**：按下鍵盤的 `←` (左) 或 `→` (右) 方向鍵。
  - **觸控裝置**：在畫面上直接進行「左右滑動」即可順滑切換。
- **特效面板 (點擊右上角「開啟設定」)**：
  - **自動模式**：勾選後系統會自動在不同場景間切換。
  - **雙指縮放與拖曳**：支援在畫面上使用雙指縮放來即時調整場景的「大小」、「旋轉」、「變色速度」、「數量多寡」。您可以在畫面下方的快速控制列鎖定要調整的參數。

### 📝 動態歌詞 (LRC)
1. 點擊上方的「📝 點擊輸入或貼上歌詞...」輸入框。
2. 貼上帶有時間軸的 `.lrc` 格式純文字（例如 `[00:15.30] 某段歌詞`）。
3. 按下 `Enter` 或點擊空白處，畫面中央就會完美同步顯示動態歌詞。
4. 您可以在「設定面板」中自訂歌詞的文字顏色與背景遮罩透明度。

### 🛠️ 實用音樂工具
- **節拍器 (Metronome)**：點擊下方選單的「節拍器」，可自訂 BPM、每小節拍數與音量。提供視覺化的 LED 閃爍燈號同步輔助。
- **調音器 (Tuner)**：點擊「調音器」後系統會自動啟動麥克風，精準計算出當前聲音的音高 (Hz)、音名 (如 C4) 以及音準偏差 (Cents)。

### 🎥 MP4 極速錄影導出
想要將酷炫的音樂特效保存下來？
1. 點擊右上角的「開始錄製」。
2. 系統會以 60 FPS 捕捉目前畫布內容，並同步錄製正在播放的音訊。
3. 再次點擊「停止錄製」，系統將透過 WebCodecs 瞬間打包出 `.mp4` 檔案並自動下載到您的電腦中！

---

## ⚙️ 第二部分：System Documentation (系統開發文件)

### 🏗️ 系統架構 (Architecture)
本專案已全面重構為**模組化 ES6 架構**，採用「依賴注入 (Dependency Injection)」模式，有效解除核心邏輯與 UI 之間的強耦合。主程式 (`index.html`) 負責協調模組與維持 Three.js 渲染迴圈，具體的商業邏輯則分散在各個特定模組中。

### 📂 核心模組解析 (Module Breakdown)

#### 1. `src/scripts/store.js`
- **職責**：全域狀態與 DOM 節點的中樞。
- **細節**：統一存放 `state` 物件（包含播放狀態、當前 BPM、視覺參數等）以及 `ui` 物件（所有的 HTML 元素參照）。各模組皆透過 import 此檔案來保持狀態同步，避免全域變數污染。

#### 2. `src/scripts/audioManager.js`
- **職責**：Web Audio API 核心引擎。
- **細節**：管理 `AudioContext` 生命週期、處理 `decodeAudioData`、建立 `AnalyserNode`。負責向其他模組提供 `playAudio`, `startLiveAudio`, `stopAudio` 等介面，並處理時鐘同步。

#### 3. `src/scripts/uiController.js`
- **職責**：使用者互動與事件綁定。
- **細節**：封裝了近 300 行的 UI 事件邏輯。包含鍵盤快捷鍵 (Hotkeys)、全螢幕控制、視窗/面板的開關、以及畫面上的觸控與拖曳事件 (Touch/Drag Events)。

#### 4. `src/scripts/videoExport.js`
- **職責**：WebCodecs 高效能錄影封裝。
- **細節**：結合了 `VideoEncoder` 與 `AudioEncoder`，並使用 `Mp4Muxer` 進行封裝。由於使用 `OffscreenCanvas` 與 Web Workers 處理影像幀，主執行緒 (Main Thread) 的渲染效能不受任何影響，實現無卡頓錄影。

#### 5. `src/scripts/lyricsParser.js`
- **職責**：LRC 歌詞解析與動態渲染。
- **細節**：利用正則表達式解析時間軸。為了在 Three.js 中高效顯示文字，此模組使用原生 Canvas 2D API 繪製文字與遮罩，並轉換為 `THREE.CanvasTexture` 套用至 `THREE.Sprite`，大幅減少 DOM 更新帶來的效能瓶頸。

#### 6. `src/scripts/sceneFactory.js` & `src/scripts/scenes/`
- **職責**：3D 場景管理與演算法工廠。
- **細節**：管理 50 個獨立的場景指令碼 (`scene01.js` ~ `scene50.js`)。每個場景模組皆需實作 `init(scene, analyser)` 與 `update(scene, analyser, deltaTime)` 介面，以實現高度動態可插拔的架構。

### 💻 核心技術棧 (Tech Stack)
- **Three.js**: WebGL 3D 渲染核心，包含後處理 (Post-Processing: UnrealBloomPass, RGBShiftShader)。
- **Web Audio API**: 音訊頻譜分析與即時訊號處理。
- **WebCodecs API**: 瀏覽器原生高硬體加速視訊與音訊編碼。
- **Tailwind CSS**: 原子化 CSS 框架，用於建構現代化、響應式的控制介面。

### 🔧 擴充與維護指南 (Extension Guide)

**Q: 如何新增一個全新的視覺場景？**
1. 在 `src/scripts/scenes/` 目錄下建立新的檔案（如 `scene51.js`）。
2. 在新檔案中匯出 `init` 與 `update` 函數，使用 `analyser` 傳入的頻譜數據來驅動您的 3D 物件幾何或材質。
3. 在 `src/scripts/sceneFactory.js` 中 `import` 該場景，並將其加入至 `scenes` 物件清單中即可，系統會自動將其加入切換輪播列。

**Q: 如何新增全域的 UI 狀態？**
1. 在 `src/scripts/store.js` 的 `state` 初始物件中新增您的變數。
2. 任何需要讀取或修改該狀態的檔案，只需引入 `import { state } from './store.js'` 即可保持雙向同步。
