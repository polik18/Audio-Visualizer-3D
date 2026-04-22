// src/scripts/scenes/baseScene.js
// Scene definition for the default visualizer.
// Exported as an object containing init, update, and optional params.


function init(scene, analyser) {
  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);
  scene.add(camera);
  scene.userData.camera = camera;

  // Ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  // Simple cube visual
  const geometry = new THREE.BoxGeometry(20, 20, 20);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(210, 70%, 55%)"),
    metalness: 0.3,
    roughness: 0.5,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.name = "visualCube";
  scene.add(cube);
  scene.userData.cube = cube;

  // Store analyser for later use
  scene.userData.analyser = analyser;
}

function update(scene, analyser, delta) {
  const cube = scene.getObjectByName("visualCube");
  if (!cube) return;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  const scale = THREE.MathUtils.lerp(1, 3, avg / 255);
  cube.scale.set(scale, scale, scale);

  const hue = THREE.MathUtils.lerp(210, 260, avg / 255);
  cube.material.color.setHSL(hue / 360, 0.7, 0.55);
}

export default {
  init,
  update,
  params: {}
};
