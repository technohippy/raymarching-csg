var dolly, camera, scene, renderer;
var geometry, material, mesh;
var stats;
var fshader;

var config = {
  saveImage: function () {
    renderer.render(scene, camera);
    window.open(canvas.toDataURL());
  },
  resolution: '512',
  modelData: ''
};

function init() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(config.resolution, config.resolution);

  window.addEventListener('resize', onWindowResize);

  // Scene
  scene = new THREE.Scene();

  dolly = new THREE.Group();
  scene.add(dolly);

  camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, -1000, 3000);
  camera.position.z = 2;
  /*
  camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0, 1000);
  camera.position.z = 10;
  */
  dolly.add(camera);

  updateMesh(fshader);

  // Controls
  var controls = new THREE.OrbitControls(camera, canvas);

  // GUI
  var gui = new dat.GUI();
  gui.add(config, 'saveImage').name('Save Image');
  gui.add(config, 'resolution', [ '256', '512', '800', 'full' ]).name('Resolution').onChange(onWindowResize);
  gui.add(config, 'modelData', [ '', 'CN17YC4201_3d.json', 'BN178P3201_3d.json', 'UN177P0201_3d.json' ]).name('ModelData').onChange(onModelChanged);

  stats = new Stats();
  document.body.appendChild(stats.dom);

}

function updateMesh(fshader) {
  if (mesh) {
    scene.remove(mesh);
    geometry.dispose();
    material.dispose();
  }

  geometry = new THREE.PlaneBufferGeometry(2.0, 2.0);
  material = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2(canvas.width, canvas.height) },
      cameraWorldMatrix: { value: camera.matrixWorld },
      cameraProjectionMatrixInverse: { value: new THREE.Matrix4().getInverse(camera.projectionMatrix) }
    },
    vertexShader: document.getElementById('vertex_shader').textContent,
    fragmentShader: fshader
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);
}

function toVec3(xyz, scale=1) {
  x = xyz.x.value ? xyz.x.value : xyz.x;
  y = xyz.y.value ? xyz.y.value : xyz.y;
  z = xyz.z.value ? xyz.z.value : xyz.z;
  return `vec3(${x*scale}, ${y*scale}, ${z*scale})`;
}

function transRotFS(target, move, scale) {
  rot = move.rotation;
  trans = move.position || move.trans;
  return translateFS(rotateFS(target, rot), trans, scale)
}

function translateFS(target, trans, scale) {
  if (trans && (trans.x != 0 || trans.y != 0 || trans.z != 0)) {
    return `translate(${target}, ${toVec3(trans, scale)})`
  }
  return target;
}

function rotateFS(target, rotation) {
  if (rotation && (rotation.x != 0 || rotation.y != 0 || rotation.z != 0)) {
    return `rotate(${target}, ${toVec3(rotation)})`
  }
  return target;
}

function toFS(model, target="p") {
  const SCALE = 0.005;
  originalTarget = target;

  if (model.type === "purge") {
    p = toFS(model.children.shift(), target);
    m = toFS(model.children.shift(), target);
    console.log(model.children);
    model.children.forEach(c => {
      cfs = toFS(c, target);
      if (cfs) {
        m = `merge(${m}, ${cfs})`
      }
    });
    return `difference(${p}, ${m})`;
    //return `intersection(${p}, ${m})`;
    //return m;
  }
  else {
    if (model.type === "box") {
      if (model.id === "/purge/boundingbox") { // TODO
        target = transRotFS(target, model, SCALE)
        return `boxDist(${target}, ${toVec3(model.size, SCALE)})`
      }
      else {
        target = transRotFS(target, model, SCALE)
        return `boxDist(${target}, ${toVec3(model.size, SCALE * 1.2)})`
      }
    }
    else if (model.type === "cylinder") {
      target = transRotFS(target, model, SCALE)
      return `cylinderDist(${target}, ${model.radius_top.value * SCALE}, ${model.height.value * SCALE})`;
    }
    else if (model.type === "component") {
      props = {};
      model.properties.forEach(kv => {props[kv.key] = kv.value});
      if (model.kind === "step2hole") {
        step1Pos = {x:model.position.x, y:model.position.y, z:model.position.z};
        step1Pos.y -= props["step1_depth"] / 2;
        step2Pos = {x:model.position.x, y:model.position.y, z:model.position.z};
        step2Pos.y -= props["step1_depth"] + props["step2_depth"] / 2;
        target1 = `translate(${originalTarget}, ${toVec3(step1Pos, SCALE)})`
        target2 = `translate(${originalTarget}, ${toVec3(step2Pos, SCALE)})`
        return `merge(
          cylinderDist(
            ${target1},
            ${props["step1_radius"] * SCALE},
            ${props["step1_depth"] * SCALE}),
          cylinderDist(
            ${target2},
            ${props["step2_radius"] * SCALE},
            ${props["step2_depth"] * SCALE}))`;
      }
      else if (model.kind === "tappedhole") {
        //target = transRotFS(originalTarget, model, SCALE)
        target1 = originalTarget;
        target2 = originalTarget;
        target1 = `translate(${target1}, ${toVec3(model.position, SCALE)})`
        target2 = `translate(${target2}, ${toVec3(model.position, SCALE)})`
        if (model.rotation && (model.rotation.x != 0 || model.rotation.y != 0 || model.rotation.z != 0)) {
          console.log(model.rotation);
          if (model.rotation.z === 180) { // TODO: なぜ？
            model.rotation.z = 0;
          }
          target1 = `rotate(${target1}, ${toVec3(model.rotation)})`
          target2 = `rotate(${target2}, ${toVec3(model.rotation)})`
        }
        target1 = `translate(${target1}, vec3(0.0, ${-props["thread_depth"] / 2 * SCALE}, 0.0))`
        target2 = `translate(${target2}, vec3(0.0, ${-props["thread_depth"] * 1.2 / 2 * SCALE}, 0.0))`

        return `merge(
          cylinderDist(
            ${target1},
            ${props["thread_radius"] * SCALE},
            ${props["thread_depth"] * SCALE}),
          cylinderDist(
            ${target2},
            ${props["thread_radius"] * 0.9 * SCALE},
            ${props["thread_depth"] * 1.2 * SCALE}))`;
      }
    }
    return null;
  }
}

function onModelChanged() {
  if (config.modelData === "") {
      updateMesh(getFShader(`
        float c1 = cylinderDist(p, 0.4, 2.0);
        float c2 = cylinderDist(rotate(p, vec3(0, 90, 0)), 0.4, 2.0);
        float s2 = sphereDist(p, 0.3);
        float b1 = boxDist(p, vec3(1., 1., 1.));
        float b2 = boxDist(p, vec3(5.5, 0.5, 0.5));
        return merge(difference(b1, merge(c1, c2)), s2);
      `));
  }
  else {
    fetch(`data/${config.modelData}`).then(resp => resp.json()).then(json => {
      model = json.model;
      fs = toFS(model);
      console.log(model);

      updateMesh(getFShader(`return ${fs};`));
    });
  }
}

function onWindowResize() {
  if (config.resolution === 'full') {
    renderer.setSize(window.innerWidth, window.innerHeight);
  } else {
    renderer.setSize(config.resolution, config.resolution);
  }

  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();

  material.uniforms.resolution.value.set(canvas.width, canvas.height);
  material.uniforms.cameraProjectionMatrixInverse.value.getInverse(camera.projectionMatrix);
}

function render(time) {
  stats.begin();
  //dolly.position.z = - time / 1000;
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(render);
}

