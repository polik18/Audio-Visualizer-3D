
export function init(scene, analyser) {
  const geometry = new THREE.BoxGeometry(20, 20, 20);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("hsl(0, 70%, 55%)"),
    metalness: 0.2,
    roughness: 0.7,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.name = "scene40Cube";
  scene.add(cube);
  scene.userData.cube = cube;
  scene.userData.analyser = analyser;
}

export function update(scene, analyser, delta) {
  const cube = scene.getObjectByName("scene40Cube");
  if (!cube) return;
  cube.rotation.x += 0.5 * delta;
  cube.rotation.y += 0.3 * delta;
}

export default { init, update, params: {} };
