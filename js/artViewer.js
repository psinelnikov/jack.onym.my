import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

var _resizeListeners = [];
var _resizeScheduled = false;

var _maxContexts = isMobile ? 1 : 8;
var _activeContexts = 0;
var _contextQueue = [];
function _globalResize() {
  if (_resizeScheduled) return;
  _resizeScheduled = true;
  requestAnimationFrame(function() {
    _resizeScheduled = false;
    _resizeListeners.forEach(function(fn) { fn(); });
  });
}
window.addEventListener('resize', _globalResize, { passive: true });

export function createThumbnailSnapshot(glbUrl, fallbackGeometry, backgroundColor, callback) {
  var size = 400;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.z = 3;

  var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setSize(size, size);
  renderer.setPixelRatio(1);
  renderer.setClearColor(backgroundColor || 0x141414);
  renderer.toneMapping = THREE.NoToneMapping;

  var ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  var key = new THREE.DirectionalLight(0xfff5e6, 1.2);
  key.position.set(5, 5, 5);
  scene.add(key);

  function capture(model) {
    scene.add(model);
    renderer.render(scene, camera);
    var dataUrl = renderer.domElement.toDataURL('image/jpeg', 0.85);
    renderer.dispose();
    callback(dataUrl);
  }

  if (glbUrl) {
    var loader = new GLTFLoader();
    loader.load(glbUrl, function(gltf) {
      var model = gltf.scene;
      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size3 = box.getSize(new THREE.Vector3());
      var scale = 2.5 / Math.max(size3.x, size3.y, size3.z);
      model.position.sub(center);
      model.position.y -= size3.y * scale * 0.3;
      model.scale.setScalar(scale);
      capture(model);
    }, undefined, function() {
      var geo = new THREE.TorusKnotGeometry(0.9, 0.35, 64, 16);
      var mat = new THREE.MeshPhongMaterial({ color: 0xc9a96e, shininess: 60 });
      capture(new THREE.Mesh(geo, mat));
    });
  } else {
    var geo = new THREE.TorusKnotGeometry(0.9, 0.35, 64, 16);
    var mat = new THREE.MeshPhongMaterial({ color: 0xc9a96e, shininess: 60 });
    capture(new THREE.Mesh(geo, mat));
  }
}

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
  var isThumbnail = options.isThumbnail || false;
  var modelOffsetY = options.modelOffsetY || 0;

  var scene, camera, renderer, model, animationId, visibilityObserver;
  var cancelled = false;
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
  var needsRender = true;

  function init() {
    if (cancelled) return;
    if (isThumbnail) {
      if (_activeContexts >= _maxContexts) {
        _contextQueue.push(init);
        return;
      }
      _activeContexts++;
    }

    scene = new THREE.Scene();

    var rect = container.getBoundingClientRect();
    var w = rect.width || 400;
    var h = rect.height || 400;

    camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
    camera.position.z = currentZoom;

    var useAntialias = !(isMobile && isThumbnail);
    var maxDpr = (isMobile && isThumbnail) ? 1 : 2;
    renderer = new THREE.WebGLRenderer({ antialias: useAntialias, alpha: true, premultipliedAlpha: false, powerPreference: isMobile ? 'low-power' : 'default' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    renderer.setClearColor(backgroundColor, 0);
    renderer.toneMapping = isThumbnail ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    var ambientLight = new THREE.AmbientLight(0xffffff, isThumbnail ? 0.8 : 0.5);
    scene.add(ambientLight);

    var keyLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    if (!isThumbnail) {
      var fillLight = new THREE.DirectionalLight(0xc9a96e, 0.4);
      fillLight.position.set(-3, 2, -2);
      scene.add(fillLight);

      var rimLight = new THREE.DirectionalLight(0x8888ff, 0.3);
      rimLight.position.set(0, -3, -5);
      scene.add(rimLight);
    }

    if (glbUrl) {
      loadGLB(glbUrl);
    } else {
      createFallbackModel();
    }

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseenter', function() { isHovering = true; });
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onMouseLeave);
    container.addEventListener('click', onToggleZoom);

    _resizeListeners.push(onResize);

    if (isThumbnail) {
      visibilityObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            if (!animationId) animate();
          } else {
            if (animationId) {
              cancelAnimationFrame(animationId);
              animationId = null;
            }
          }
        });
      }, { rootMargin: '100px' });
      visibilityObserver.observe(container);
    } else {
      animate();
    }
  }

  function applyChromaKey(object) {
    object.traverse(function(child) {
      if (!child.isMesh) return;
      var mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(function(mat) {
        mat.transparent = true;
        mat.alphaTest = 0.5;
        mat.side = THREE.DoubleSide;
        mat.onBeforeCompile = function(shader) {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <alphatest_fragment>',
            [
              'float r = diffuseColor.r;',
              'float g = diffuseColor.g;',
              'float b = diffuseColor.b;',
              'float brightness = (r + g + b) / 3.0;',
              'float maxCh = max(r, max(g, b));',
              'float minCh = min(r, min(g, b));',
              'float sat = (maxCh > 0.001) ? (maxCh - minCh) / maxCh : 0.0;',
              'if (brightness > 0.92 && sat < 0.06) { diffuseColor.a = 0.0; }',
              '#include <alphatest_fragment>'
            ].join('\n')
          );
        };
        mat.needsUpdate = true;
      });
    });
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
      model.position.y -= modelOffsetY;
      model.scale.setScalar(scale);

      modelBaseX = model.position.x;
      modelBaseY = model.position.y;
      targetModelX = modelBaseX;
      targetModelY = modelBaseY;
      currentModelX = modelBaseX;
      currentModelY = modelBaseY;

      applyChromaKey(model);
      scene.add(model);
      hideLoader();
      if (onLoad) onLoad();
    }, undefined, function(err) {
      console.warn('GLB load failed, using fallback:', err);
      createFallbackModel();
    });
  }

  function createFallbackModel() {
    var torusSegs = (isMobile && isThumbnail) ? 64 : 128;
    var geometry;
    if (fallbackGeometry === 'sphere') {
      geometry = new THREE.IcosahedronGeometry(1.2, isThumbnail ? 2 : 4);
    } else if (fallbackGeometry === 'torus') {
      geometry = new THREE.TorusKnotGeometry(0.9, 0.35, torusSegs, 16);
    } else if (fallbackGeometry === 'abstract') {
      geometry = new THREE.DodecahedronGeometry(1.2, 1);
    } else {
      geometry = new THREE.TorusKnotGeometry(0.9, 0.35, torusSegs, 16);
    }

    var material = isThumbnail
      ? new THREE.MeshPhongMaterial({ color: 0xc9a96e, shininess: 60, flatShading: fallbackGeometry === 'abstract' })
      : new THREE.MeshStandardMaterial({ color: 0xc9a96e, metalness: 0.3, roughness: 0.4, flatShading: fallbackGeometry === 'abstract' });

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
    e.preventDefault();
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

  var EPS = 0.0001;

  function animate() {
    animationId = requestAnimationFrame(animate);

    var dzoom = (targetZoom - currentZoom) * 0.04;
    var dmx   = (targetModelX - currentModelX) * 0.04;
    var dmy   = (targetModelY - currentModelY) * 0.04;
    currentZoom   += dzoom;
    currentModelX += dmx;
    currentModelY += dmy;
    camera.position.set(0, 0, currentZoom);
    camera.lookAt(0, 0, 0);

    var changed = Math.abs(dzoom) > EPS || Math.abs(dmx) > EPS || Math.abs(dmy) > EPS;

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

      var drx = (targetRotX - currentRotX) * 0.06;
      var dry = (targetRotY - currentRotY) * 0.06;
      currentRotX += drx;
      currentRotY += dry;

      model.rotation.x = currentRotX;
      model.rotation.y = currentRotY;

      if (autoRotate && !isHovering) {
        model.rotation.y += 0.003;
        currentRotY = model.rotation.y;
        changed = true;
      } else {
        changed = changed || Math.abs(drx) > EPS || Math.abs(dry) > EPS;
      }
    }

    if (changed || needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  }

  function onResize() {
    var rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height);
    needsRender = true;
  }

  function pause() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function resume() {
    if (!animationId) animate();
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    container.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('mouseleave', onMouseLeave);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onMouseLeave);
    container.removeEventListener('click', onToggleZoom);
    var idx = _resizeListeners.indexOf(onResize);
    if (idx !== -1) _resizeListeners.splice(idx, 1);
    if (visibilityObserver) visibilityObserver.disconnect();

    cancelled = true;
    if (renderer) {
      if (isThumbnail) _activeContexts = Math.max(0, _activeContexts - 1);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
      if (_contextQueue.length > 0) {
        var next = _contextQueue.shift();
        next();
      }
    } else {
      var qi = _contextQueue.indexOf(init);
      if (qi !== -1) _contextQueue.splice(qi, 1);
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
    resize: onResize,
    pause: pause,
    resume: resume,
    isAlive: function() { return !cancelled; }
  };
}
