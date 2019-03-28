let renderer, wireframeScene, camera, controls;
let raymarchingScene, raymarchingMaterial, raymarchingScreen;
let cube, cylinder, sphere;

var config = {
  wireframe: false,
  cubeScale: 1.0,
  cubePositionX: 0,
  cubePositionY: 0,
  cubePositionZ: 0,
  cubeRotationX: 0,
  cubeRotationY: 0,
  cubeRotationZ: 0,
  cylinderScale: 1.0,
  cylinderPositionX: 0,
  cylinderPositionY: 0,
  cylinderPositionZ: 0,
  cylinderRotationX: 0,
  cylinderRotationY: 0,
  cylinderRotationZ: 0,
  sphereScale: 1.2,
  spherePositionX: 0,
  spherePositionY: 0,
  spherePositionZ: 0
};

function init() {
  renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
  renderer.autoClearColor = false;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild( renderer.domElement );
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
  camera.position.z = 5;
  controls = new THREE.OrbitControls( camera, renderer.domElement );

  // GUI
  var gui = new dat.GUI();
  gui.add(config, 'wireframe').name('Wireframe');
  var cubeFolder = gui.addFolder('Cube');
  cubeFolder.add(config, 'cubeScale', 0.5, 2);
  cubeFolder.add(config, 'cubePositionX', -2, 2);
  cubeFolder.add(config, 'cubePositionY', -2, 2);
  cubeFolder.add(config, 'cubePositionZ', -2, 2);
  cubeFolder.add(config, 'cubeRotationX', -Math.PI/2, Math.PI/2);
  cubeFolder.add(config, 'cubeRotationY', -Math.PI/2, Math.PI/2);
  cubeFolder.add(config, 'cubeRotationZ', -Math.PI/2, Math.PI/2);
  var cylinderFolder = gui.addFolder('Cylinder');
  cylinderFolder.add(config, 'cylinderScale', 0.5, 2);
  cylinderFolder.add(config, 'cylinderPositionX', -2, 2);
  cylinderFolder.add(config, 'cylinderPositionY', -2, 2);
  cylinderFolder.add(config, 'cylinderPositionZ', -2, 2);
  cylinderFolder.add(config, 'cylinderRotationX', -Math.PI/2, Math.PI/2);
  cylinderFolder.add(config, 'cylinderRotationY', -Math.PI/2, Math.PI/2);
  cylinderFolder.add(config, 'cylinderRotationZ', -Math.PI/2, Math.PI/2);
  var sphereFolder = gui.addFolder('Sphere');
  sphereFolder.add(config, 'sphereScale', 0.5, 2);
  sphereFolder.add(config, 'spherePositionX', -2, 2);
  sphereFolder.add(config, 'spherePositionY', -2, 2);
  sphereFolder.add(config, 'spherePositionZ', -2, 2);

  initWireframe();
  initRaymarching();
}

function initWireframe() {
  wireframeScene = new THREE.Scene();

  var color = new THREE.Color(1, 1, 1);
  color.alpha = 0.5;
  var material = new THREE.MeshBasicMaterial({color: color, wireframe:true, transparent:true, opacity:0.2});

  var cubeGeom = new THREE.BoxGeometry(2, 2, 2);
  cube = new THREE.Mesh(cubeGeom, material);
  cube.rotation.order = "ZYX";
  wireframeScene.add( cube );

  var cylinderGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 16, 1, true);
  cylinder = new THREE.Mesh(cylinderGeom, material);
  cylinder.rotation.order = "ZYX";
  wireframeScene.add( cylinder );

  var sphereGeom = new THREE.SphereGeometry(1, 16 ,8);
  sphere = new THREE.Mesh(sphereGeom, material);
  sphere.rotation.order = "ZYX";
  wireframeScene.add(sphere);
}

function initRaymarching() {
  let geometry = new THREE.PlaneBufferGeometry(2.0, 2.0);
  raymarchingMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      va: { value: [new THREE.Vector3(0.8, 0, 0), new THREE.Vector3(2, 0, 0), new THREE.Vector3(2, 0, 0)] },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      cameraWorldMatrix: { value: camera.matrixWorld },
      cameraProjectionMatrixInverse: { value: new THREE.Matrix4().getInverse(camera.projectionMatrix) },
      spherePosition: { value: new THREE.Vector3(0, 0, 0) },
      sphereRotation: { value: new THREE.Vector3(0, 0, 0) },
      sphereScale: { value: 1.0 },
      cubePosition: { value: new THREE.Vector3(0, 0, 0) },
      cubeRotation: { value: new THREE.Vector3(0, 0, 0) },
      cubeScale: { value: 1.0 },
      cylinderPosition: { value: new THREE.Vector3(0, 0, 0) },
      cylinderRotation: { value: new THREE.Vector3(0, 0, 0) },
      cylinderScale: { value: 1.0 }
    },
    vertexShader: vshader,
    fragmentShader: fshader
  });
  raymarchingScreen = new THREE.Mesh(geometry, raymarchingMaterial);
  raymarchingScreen.frustumCulled = false;

  raymarchingScene = new THREE.Scene();
  raymarchingScene.add(raymarchingScreen);
}

function render() {
  requestAnimationFrame( render );

  controls.update();

  cube.position.set(config.cubePositionX, config.cubePositionY, config.cubePositionZ);
  cube.rotation.set(config.cubeRotationX, config.cubeRotationY, config.cubeRotationZ);
  cube.scale.set(config.cubeScale, config.cubeScale, config.cubeScale);
  cylinder.position.set(config.cylinderPositionX, config.cylinderPositionY, config.cylinderPositionZ);
  cylinder.rotation.set(config.cylinderRotationX, config.cylinderRotationY, config.cylinderRotationZ);
  cylinder.scale.set(config.cylinderScale, config.cylinderScale, config.cylinderScale);
  sphere.position.set(config.spherePositionX, config.spherePositionY, config.spherePositionZ);
  sphere.scale.set(config.sphereScale, config.sphereScale, config.sphereScale);

  raymarchingMaterial.uniforms.cubePosition.value = cube.position;
  raymarchingMaterial.uniforms.cubeRotation.value = cube.rotation;
  raymarchingMaterial.uniforms.cubeScale.value = cube.scale.x;
  raymarchingMaterial.uniforms.cylinderPosition.value = cylinder.position;
  raymarchingMaterial.uniforms.cylinderRotation.value = cylinder.rotation;
  raymarchingMaterial.uniforms.cylinderScale.value = cylinder.scale.x;
  raymarchingMaterial.uniforms.spherePosition.value = sphere.position;
  raymarchingMaterial.uniforms.sphereScale.value = sphere.scale.x;

  raymarchingMaterial.uniforms.needsUpdate = true;

  renderer.clear();
  renderer.render( raymarchingScene, camera );
  if (config.wireframe) {
    renderer.render( wireframeScene, camera );
  }
};
