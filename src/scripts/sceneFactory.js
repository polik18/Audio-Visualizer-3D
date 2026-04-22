// src/scripts/sceneFactory.js
// Central registry for all visualizer scenes.
// Each scene module must export { init, update, params }.

import baseScene from "./scenes/baseScene.js";
// Import placeholder scenes (scene01 … scene49)
import scene01 from "./scenes/scene01.js";
import scene02 from "./scenes/scene02.js";
import scene03 from "./scenes/scene03.js";
import scene04 from "./scenes/scene04.js";
import scene05 from "./scenes/scene05.js";
import scene06 from "./scenes/scene06.js";
import scene07 from "./scenes/scene07.js";
import scene08 from "./scenes/scene08.js";
import scene09 from "./scenes/scene09.js";
import scene10 from "./scenes/scene10.js";
import scene11 from "./scenes/scene11.js";
import scene12 from "./scenes/scene12.js";
import scene13 from "./scenes/scene13.js";
import scene14 from "./scenes/scene14.js";
import scene15 from "./scenes/scene15.js";
import scene16 from "./scenes/scene16.js";
import scene17 from "./scenes/scene17.js";
import scene18 from "./scenes/scene18.js";
import scene19 from "./scenes/scene19.js";
import scene20 from "./scenes/scene20.js";
import scene21 from "./scenes/scene21.js";
import scene22 from "./scenes/scene22.js";
import scene23 from "./scenes/scene23.js";
import scene24 from "./scenes/scene24.js";
import scene25 from "./scenes/scene25.js";
import scene26 from "./scenes/scene26.js";
import scene27 from "./scenes/scene27.js";
import scene28 from "./scenes/scene28.js";
import scene29 from "./scenes/scene29.js";
import scene30 from "./scenes/scene30.js";
import scene31 from "./scenes/scene31.js";
import scene32 from "./scenes/scene32.js";
import scene33 from "./scenes/scene33.js";
import scene34 from "./scenes/scene34.js";
import scene35 from "./scenes/scene35.js";
import scene36 from "./scenes/scene36.js";
import scene37 from "./scenes/scene37.js";
import scene38 from "./scenes/scene38.js";
import scene39 from "./scenes/scene39.js";
import scene40 from "./scenes/scene40.js";
import scene41 from "./scenes/scene41.js";
import scene42 from "./scenes/scene42.js";
import scene43 from "./scenes/scene43.js";
import scene44 from "./scenes/scene44.js";
import scene45 from "./scenes/scene45.js";
import scene46 from "./scenes/scene46.js";
import scene47 from "./scenes/scene47.js";
import scene48 from "./scenes/scene48.js";
import scene49 from "./scenes/scene49.js";

const scenes = {
  base: baseScene,
  scene01,
  scene02,
  scene03,
  scene04,
  scene05,
  scene06,
  scene07,
  scene08,
  scene09,
  scene10,
  scene11,
  scene12,
  scene13,
  scene14,
  scene15,
  scene16,
  scene17,
  scene18,
  scene19,
  scene20,
  scene21,
  scene22,
  scene23,
  scene24,
  scene25,
  scene26,
  scene27,
  scene28,
  scene29,
  scene30,
  scene31,
  scene32,
  scene33,
  scene34,
  scene35,
  scene36,
  scene37,
  scene38,
  scene39,
  scene40,
  scene41,
  scene42,
  scene43,
  scene44,
  scene45,
  scene46,
  scene47,
  scene48,
  scene49,
};

let currentScene = null;
let currentThreeScene = null;
let currentAnalyser = null;
let currentSceneName = 'base';

export function loadScene(name, threeScene, analyser) {
  const module = scenes[name];
  if (!module) {
    console.warn(`Scene "${name}" not found, falling back to "base"`);
    return loadScene("base", threeScene, analyser);
  }
  // Clean up previous scene if it provides dispose
  if (currentScene && currentScene.dispose) currentScene.dispose();
  // Store references for update loop
  currentScene = module;
  currentThreeScene = threeScene;
  currentAnalyser = analyser;
  currentSceneName = name;
  // Initialise new scene
  module.init(threeScene, analyser);
}

export function updateCurrentScene(delta) {
  if (currentScene && currentScene.update) {
    currentScene.update(currentThreeScene, currentAnalyser, delta);
  }
}

export function getSceneNames() {
  return Object.keys(scenes);
}

export function getCurrentSceneName() {
  return currentSceneName;
}

export default { loadScene, updateCurrentScene, getSceneNames, getCurrentSceneName };

