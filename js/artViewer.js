import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createArtViewer(container, options) {
  options = options || {};
  var glbUrl = options.glbUrl || null;
  var fallbackGeometry = options.fallbackGeometry || 'torus';
  var backgroundColor = options.backgroundColor || 0x0a0a0a;
  var parallaxIntensity = options.parallaxIntensity || 0.35;
  var autoRotate = options.autoRotate !== undefined ? options.autoRotate : true;
  var zoomOnStart = options.zoomOnStart || false;
  var defaultZoom = options.defaultZoom || 3;
  var onLoad = options.onLoad || null;

  var scene, camera, renderer, model, animationId;
  var raycaster = new THREE.Raycaster();
  var mouseVec = new THREE.Vector2();
  var mouseX = 0, mouseY = 0;
  var targetRotX = 0, targetRotY = 0;
  var currentRotX = 0, currentRotY = 0;
  var isHovering = false;
  var baseRotY = 0;
  var targetZoom = defaultZoom;
  var currentZoom = zoomOnStart ? 12 : defaultZoom;
  var isZoomedIn = false;
  var zoomDefault = defaultZoom;
  var zoomedIn = 1.5;
  var targetCamX = 0, targetCamY = 0;
  var currentCamX = 0, currentCamY = 0;
  var modelBaseX = 0, modelBaseY = 0;
  var targetModelX = 0, targetModelY = 0;
  var currentModelX = 0, currentModelY = 0;

  function init() {
    scene = new THREE.Scene();

    var rect = container.getBoundingClientRect();
    var w = rect.width || 400;
    var h = rect.height || 400;

    camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    camera.position.z = currentZoom;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(backgroundColor);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var keyLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    var fillLight = new THREE.DirectionalLight(0xc9a96e, 0.4);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    var rimLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    rimLight.position.set(0, -3, -5);
    scene.add(rimLight);

    if (glbUrl) {
      loadGLB(glbUrl);
    } else {
      createFallbackModel();
    }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseenter', function() { isHovering = true; });
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onMouseLeave);
    container.addEventListener('click', onToggleZoom);

    window.addEventListener('resize', onResize);

    animate();
  }

  function loadGLB(url) {
    var loader = new GLTFLoader();
    loader.load(url, function(gltf) {
      model = gltf.scene;

      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = 2.5 / maxDim;

      model.position.sub(center);
      model.position.y -= size.y * scale * 0.3;
      model.scale.setScalar(scale);

      modelBaseX = model.position.x;
      modelBaseY = model.position.y;
      targetModelX = modelBaseX;
      targetModelY = modelBaseY;
      currentModelX = modelBaseX;
      currentModelY = modelBaseY;

      scene.add(model);
      hideLoader();
      if (onLoad) onLoad();
    }, undefined, function(err) {
      console.warn('GLB load failed, using fallback:', err);
      createFallbackModel();
    });
  }

  function createFallbackModel() {
    var geometry;
    if (fallbackGeometry === 'sphere') {
      geometry = new THREE.IcosahedronGeometry(1.2, 4);
    } else if (fallbackGeometry === 'torus') {
      geometry = new THREE.TorusKnotGeometry(0.9, 0.35, 128, 32);
    } else if (fallbackGeometry === 'abstract') {
      geometry = new THREE.DodecahedronGeometry(1.2, 1);
    } else {
      geometry = new THREE.TorusKnotGeometry(0.9, 0.35, 128, 32);
    }

    var material = new THREE.MeshStandardMaterial({
      color: 0xc9a96e,
      metalness: 0.3,
      roughness: 0.4,
      flatShading: fallbackGeometry === 'abstract'
    });

      model = new THREE.Mesh(geometry, material);
      model.position.y = -0.7;
      scene.add(model);

      modelBaseX = model.position.x;
      modelBaseY = model.position.y;
      targetModelX = modelBaseX;
      targetModelY = modelBaseY;
      currentModelX = modelBaseX;
      currentModelY = modelBaseY;

    hideLoader();
    if (onLoad) onLoad();
  }

  function hideLoader() {
    var loader = container.querySelector('.hero__loader');
    if (loader) loader.classList.add('hidden');
  }

  function onMouseMove(e) {
    var rect = container.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function onTouchMove(e) {
    if (!e.touches.length) return;
    isHovering = true;
    var rect = container.getBoundingClientRect();
    mouseX = ((e.touches[0].clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.touches[0].clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function onMouseLeave() {
    isHovering = false;
    mouseX = 0;
    mouseY = 0;
  }

  function onToggleZoom(e) {
    isZoomedIn = !isZoomedIn;

    if (isZoomedIn && model) {
      var rect = container.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      var intersects = raycaster.intersectObject(model, true);

      if (intersects.length > 0) {
        var point = intersects[0].point;
        targetModelX = modelBaseX - point.x;
        targetModelY = modelBaseY - point.y;
      } else {
        targetModelX = modelBaseX + mouseVec.x * 1.5;
        targetModelY = modelBaseY - mouseVec.y * 1.5;
      }

      targetZoom = zoomedIn;
      renderer.domElement.classList.add('zoomed');
    } else {
      targetModelX = modelBaseX;
      targetModelY = modelBaseY;
      targetZoom = zoomDefault;
      renderer.domElement.classList.remove('zoomed');
    }
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    currentZoom += (targetZoom - currentZoom) * 0.04;
    currentModelX += (targetModelX - currentModelX) * 0.04;
    currentModelY += (targetModelY - currentModelY) * 0.04;
    camera.position.set(0, 0, currentZoom);
    camera.lookAt(0, 0, 0);

    if (model) {
      model.position.x = currentModelX;
      model.position.y = currentModelY;
      if (isHovering) {
        targetRotY = mouseX * parallaxIntensity * Math.PI;
        targetRotX = -mouseY * parallaxIntensity * Math.PI * 0.6;
      } else {
        targetRotX = 0;
        targetRotY = 0;
      }

      currentRotX += (targetRotX - currentRotX) * 0.06;
      currentRotY += (targetRotY - currentRotY) * 0.06;

      model.rotation.x = currentRotX;
      model.rotation.y = currentRotY;

      if (autoRotate && !isHovering) {
        model.rotation.y += 0.003;
        currentRotY = model.rotation.y;
      }
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    var rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
  }

  function destroy() {
    cancelAnimationFrame(animationId);
    container.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('mouseleave', onMouseLeave);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onMouseLeave);
    container.removeEventListener('click', onToggleZoom);
    window.removeEventListener('resize', onResize);

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    if (model) {
      model.traverse(function(child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(function(m) { m.dispose(); });
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }

  init();

  return {
    destroy: destroy,
    resize: onResize
  };
}
