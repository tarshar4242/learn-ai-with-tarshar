import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Tarshar Q版公仔：深棕色自然分線中長髮、圓框眼鏡、橫條紋上衣、牛仔背心、牛仔褲、白鞋、鼠尾草綠斜背包。
// 全程式幾何，靜態部位依 vertex color 合併。drawcalls = 頭 + 軀幹 + 四肢 = 6。

const C = {
  skin: 0xf6d3b8, skinDeep: 0xe9b79a, blush: 0xf2a39a,
  hair: 0x59463e, hairDark: 0x40322d, hairLight: 0x665148,
  eye: 0x2b1810, white: 0xffffff, mouth: 0x8e3b36, frame: 0x5b3a2a,
  cream: 0xf5eddd, navy: 0x26334f,
  vest: 0x426da3, vestLight: 0x5f8bbd, jeans: 0x5081b5, cuff: 0x7aa2cc,
  shoe: 0xf8f5ee, sole: 0xd8d2c4, shoeAccent: 0xa9c0d8,
  sage: 0x9db9a3, sageLight: 0xb7cfba, button: 0xf3ecd8,
};

const NECK_Y = 0.64;
const HEAD = {cx: 0, cy: 0.84, cz: 0, rx: 0.22, ry: 0.205, rz: 0.2};
const _col = new THREE.Color();
const _m = new THREE.Matrix4();
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const _z = new THREE.Vector3(0, 0, 1);

function bucket() { return []; }

// 把 geometry 套矩陣、上 vertex color，轉成無 index、無 uv 以便合併
function put(list, geo, color, o = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  geo.dispose();
  g.deleteAttribute('uv');
  const q = o.q || _q.setFromEuler(_e.set(...(o.r || [0, 0, 0])));
  _m.compose(_v.set(...(o.p || [0, 0, 0])), q, _s.set(...(o.s || [1, 1, 1])));
  g.applyMatrix4(_m);
  _col.set(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = _col.r; arr[i * 3 + 1] = _col.g; arr[i * 3 + 2] = _col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  list.push(g);
}

function sph(list, color, p, s, o = {}) {
  const g = new THREE.SphereGeometry(1, o.w || 12, o.h || 8, o.phiS || 0, o.phiL || Math.PI * 2, o.thS || 0, o.thL || Math.PI);
  put(list, g, color, {p, s: typeof s === 'number' ? [s, s, s] : s, r: o.r, q: o.q});
}

function tube(list, color, pts, radius, tub = 16, rad = 4, closed = false) {
  const curve = new THREE.CatmullRomCurve3(pts.map(a => new THREE.Vector3(...a)), closed);
  put(list, new THREE.TubeGeometry(curve, tub, radius, rad, closed), color);
}

// 水平橢圓環（條紋、袖口、領口）
function ring(list, color, y, rx, rz, r, seg = 18, cx = 0, cz = 0) {
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, y, cz + Math.sin(a) * rz]);
  }
  tube(list, color, pts, r, seg, 4, true);
}

// 橢球表面某點（x,y 為相對中心偏移）：回傳位置與朝外法線的旋轉
function onEllipsoid(c, x, y, off = 0) {
  const nx = x / (c.rx * c.rx), ny = y / (c.ry * c.ry);
  let t = 1 - (x / c.rx) ** 2 - (y / c.ry) ** 2;
  const z = c.rz * Math.sqrt(Math.max(t, 0.0001));
  const nz = z / (c.rz * c.rz);
  const n = new THREE.Vector3(nx, ny, nz).normalize();
  const p = [c.cx + x + n.x * off, c.cy + y + n.y * off, c.cz + z + n.z * off];
  return {p, q: new THREE.Quaternion().setFromUnitVectors(_z, n)};
}

function buildHead() {
  const L = bucket();
  const H = HEAD;
  // 臉
  sph(L, C.skin, [H.cx, H.cy, H.cz], [H.rx, H.ry, H.rz], {w: 32, h: 24});
  // 眼睛（深棕＋雙白亮點）
  for (const sx of [-1, 1]) {
    const e = onEllipsoid(H, sx * 0.076, -0.018, 0.0);
    sph(L, C.eye, e.p, [0.03, 0.039, 0.012], {q: e.q, w: 14, h: 10});
    const h1 = onEllipsoid(H, sx * 0.076 + 0.009, -0.002, 0.009);
    sph(L, C.white, h1.p, [0.0095, 0.0095, 0.006], {q: h1.q, w: 8, h: 6});
    const h2 = onEllipsoid(H, sx * 0.076 - 0.01, -0.03, 0.008);
    sph(L, C.white, h2.p, [0.0055, 0.0055, 0.004], {q: h2.q, w: 6, h: 5});
    // 臉頰
    const ch = onEllipsoid(H, sx * 0.125, -0.07, 0.0);
    sph(L, C.blush, ch.p, [0.03, 0.019, 0.007], {q: ch.q, w: 10, h: 6});
    // 圓框眼鏡（細 torus，鏡片留空不遮眼）
    const gp = [sx * 0.078, H.cy - 0.012, 0.207];
    put(L, new THREE.TorusGeometry(0.052, 0.0042, 6, 28), C.frame, {p: gp});
    // 鏡腳往後
    tube(L, C.frame, [[sx * 0.13, H.cy - 0.005, 0.2], [sx * 0.175, H.cy + 0.005, 0.15], [sx * 0.212, H.cy + 0.01, 0.06]], 0.0035, 8, 4);
  }
  // 鼻樑橋
  tube(L, C.frame, [[-0.028, H.cy + 0.002, 0.209], [0, H.cy + 0.012, 0.213], [0.028, H.cy + 0.002, 0.209]], 0.0038, 8, 4);
  // 小鼻子
  const nz = onEllipsoid(H, 0, -0.065, 0.001);
  sph(L, C.skinDeep, nz.p, [0.012, 0.009, 0.008], {q: nz.q, w: 8, h: 6});
  // 彎月笑嘴
  const mp = [];
  for (let i = 0; i <= 8; i++) {
    const u = (i / 8) * 2 - 1;
    const x = u * 0.044;
    const y = -0.113 + 0.02 * u * u;
    const s = onEllipsoid(H, x, y, 0.003);
    mp.push(s.p);
  }
  tube(L, C.mouth, mp, 0.0062, 14, 5);
  // 嘴角小酒窩
  for (const sx of [-1, 1]) {
    const d = onEllipsoid(H, sx * 0.052, -0.095, 0.002);
    sph(L, C.skinDeep, d.p, [0.006, 0.006, 0.004], {q: d.q, w: 6, h: 4});
  }

  // 一整片順髮外殼；依本人要求移除兩條獨立垂髮，髮量只留在後側。
  // 不用髮絲管線、頂部球塊或珠串捲髮，保持手機近看輪廓乾淨。
  const hairPositions = [], hairIndices = [], hairColors = [];
  const hairSegments = 64, hairRows = 32;
  for (let row = 0; row <= hairRows; row++) {
    const u = row / hairRows;
    for (let col = 0; col <= hairSegments; col++) {
      const phi = col / hairSegments * Math.PI * 2;
      const front = Math.max(0, Math.cos(phi));
      const maxTheta = 2.62 - 1.75 * Math.pow(front, 1.15);
      const theta = u * maxTheta;
      const sinT = Math.sin(theta);
      // 肩線以下向內收；只留寬廣、平滑的髮尾弧度。
      const end = THREE.MathUtils.smoothstep(theta, 1.7, 2.62);
      const width = theta > Math.PI / 2 ? 1 - 0.10 * end : sinT;
      const x = Math.sin(phi) * width * 0.239;
      const y = 0.837 + Math.cos(theta) * (0.23 + 0.065 * end);
      const z = -0.012 + Math.cos(phi) * width * (0.222 - 0.025 * end);
      // 分線以很淺的凹痕形成，沒有貼在頭頂的凸起線條。
      const part = Math.exp(-Math.pow(x / 0.019, 2)) * THREE.MathUtils.smoothstep(y, 0.985, 1.05);
      hairPositions.push(x, y - part * 0.008, z);
      const shade = new THREE.Color(C.hair).lerp(new THREE.Color(C.hairLight), Math.max(0, Math.sin(phi + 0.4)) * 0.15);
      hairColors.push(shade.r, shade.g, shade.b);
      if (row < hairRows && col < hairSegments) {
        const i = row * (hairSegments + 1) + col, j = i + hairSegments + 1;
        hairIndices.push(i, j, i + 1, j, j + 1, i + 1);
      }
    }
  }
  const hair = new THREE.BufferGeometry();
  hair.setAttribute('position', new THREE.Float32BufferAttribute(hairPositions, 3));
  hair.setIndex(hairIndices);
  hair.computeVertexNormals();
  // 上色與其餘頭部合併，維持原本 6 個公仔 draw calls。
  const smoothHair = hair.toNonIndexed();
  const colorValues = [];
  for (const i of hairIndices) colorValues.push(...hairColors.slice(i * 3, i * 3 + 3));
  smoothHair.setAttribute('color', new THREE.Float32BufferAttribute(colorValues, 3));
  L.push(smoothHair); hair.dispose();
  // 耳朵（藏在髮下，只露一點）
  for (const sx of [-1, 1]) sph(L, C.skin, [sx * 0.213, 0.82, 0.0], [0.014, 0.03, 0.022], {w: 6, h: 6});

  const geo = mergeGeometries(L, false);
  L.forEach(g => g.dispose());
  geo.translate(0, -NECK_Y, 0);
  return geo;
}

function buildBody() {
  const L = bucket();
  const cy = 0.43;
  // 上衣（奶油底）＋頸
  sph(L, C.cream, [0, cy, 0], [0.15, 0.19, 0.12], {w: 24, h: 16});
  sph(L, C.skin, [0, 0.638, 0.002], [0.05, 0.04, 0.05], {w: 10, h: 8});
  // 領口
  ring(L, C.cream, 0.603, 0.071, 0.058, 0.01, 16);
  // 橫條紋（深藍）
  for (const y of [0.32, 0.37, 0.42, 0.47, 0.52, 0.57]) {
    const t = (y - cy) / 0.19, s = Math.sqrt(1 - t * t);
    ring(L, C.navy, y, 0.15 * s + 0.003, 0.12 * s + 0.003, 0.0085, 20);
  }
  // 牛仔背心：開前襟的外殼，露出中央條紋
  sph(L, C.vest, [0, cy + 0.005, -0.002], [0.16, 0.2, 0.13], {w: 28, h: 16, phiS: Math.PI / 2 + 0.5, phiL: Math.PI * 2 - 1.0, thS: 0.5, thL: Math.PI - 0.5 - 0.45});
  // 口袋
  const vc = {cx: 0, cy: cy + 0.005, cz: -0.002, rx: 0.16, ry: 0.2, rz: 0.13};
  for (const sx of [-1, 1]) {
    const p = onEllipsoid(vc, sx * 0.095, 0.045, 0.002);
    sph(L, C.vestLight, p.p, [0.034, 0.028, 0.008], {q: p.q, w: 10, h: 6});
    const f = onEllipsoid(vc, sx * 0.095, 0.067, 0.004);
    sph(L, C.cuff, f.p, [0.034, 0.008, 0.008], {q: f.q, w: 8, h: 5});
    // 前襟邊線
    const edge = [];
    for (let j = 0; j <= 8; j++) {
      const y = 0.36 + j * 0.032;
      const t = (y - vc.cy) / vc.ry, s = Math.sqrt(Math.max(1 - t * t, 0.01));
      const x = sx * 0.045 * (1 + (1 - s) * 0.5);
      edge.push(onEllipsoid(vc, x, y - vc.cy, 0.002).p);
    }
    tube(L, C.vestLight, edge, 0.004, 10, 4);
  }
  // 褲腰／骨盆
  sph(L, C.jeans, [0, 0.245, 0], [0.138, 0.062, 0.108], {w: 20, h: 10});
  // 肩（袖根）
  for (const sx of [-1, 1]) sph(L, C.cream, [sx * 0.158, 0.55, 0], 0.045, {w: 10, h: 8});
  // 斜背帶（鼠尾草綠）
  tube(L, C.sage, [
    [-0.088, 0.605, 0.065], [-0.04, 0.52, 0.128], [0.03, 0.42, 0.142], [0.1, 0.335, 0.108], [0.14, 0.29, 0.05],
    [0.148, 0.31, -0.05], [0.08, 0.4, -0.13], [-0.02, 0.5, -0.145], [-0.09, 0.6, -0.06],
  ], 0.011, 44, 5, true);
  // 側背包
  sph(L, C.sage, [0.142, 0.235, -0.02], [0.032, 0.054, 0.062], {w: 12, h: 9});
  sph(L, C.sageLight, [0.145, 0.262, -0.02], [0.034, 0.03, 0.064], {w: 12, h: 8, thL: Math.PI * 0.75});
  sph(L, C.button, [0.176, 0.245, -0.02], 0.009, {w: 6, h: 5});

  const geo = mergeGeometries(L, false);
  L.forEach(g => g.dispose());
  return geo;
}

// 手臂：原點在肩膀，向下延伸
function buildArm() {
  const L = bucket();
  put(L, new THREE.CapsuleGeometry(0.036, 0.1, 4, 12), C.cream, {p: [0, -0.095, 0]});
  for (const y of [-0.045, -0.085, -0.125, -0.165]) ring(L, C.navy, y, 0.0385, 0.0385, 0.0075, 12);
  ring(L, C.cream, -0.172, 0.04, 0.04, 0.008, 12);
  sph(L, C.skin, [0, -0.215, 0.004], 0.04, {w: 12, h: 9});
  sph(L, C.skin, [0.0, -0.228, 0.036], [0.013, 0.013, 0.013], {w: 6, h: 5}); // 拇指
  const geo = mergeGeometries(L, false);
  L.forEach(g => g.dispose());
  return geo;
}

// 腿：原點在髖，向下 0.24 為地面
function buildLeg() {
  const L = bucket();
  put(L, new THREE.CapsuleGeometry(0.054, 0.1, 4, 12), C.jeans, {p: [0, -0.085, 0]});
  ring(L, C.cuff, -0.163, 0.059, 0.059, 0.009, 14);
  // 白鞋＋鞋底＋鞋頭
  sph(L, C.shoe, [0, -0.2, 0.026], [0.06, 0.04, 0.09], {w: 14, h: 10});
  sph(L, C.sole, [0, -0.232, 0.026], [0.062, 0.012, 0.092], {w: 14, h: 6});
  sph(L, C.shoeAccent, [0, -0.19, 0.075], [0.04, 0.022, 0.035], {w: 8, h: 6});
  const geo = mergeGeometries(L, false);
  L.forEach(g => g.dispose());
  return geo;
}

export function createTarsharAvatar(profile = {}) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
  });
  const geos = [];
  const mk = (geo) => {
    geos.push(geo);
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    return m;
  };

  const group = new THREE.Group();
  group.name = 'TarsharAvatar';
  const bodyRoot = new THREE.Group(); // 上半身（輕起伏）
  group.add(bodyRoot);

  bodyRoot.add(mk(buildBody()));
  const headPivot = new THREE.Group();
  headPivot.position.set(0, NECK_Y, 0);
  headPivot.add(mk(buildHead()));
  bodyRoot.add(headPivot);

  const armGeo = buildArm();
  const legGeo = buildLeg();
  const armL = mk(armGeo), armR = mk(armGeo.clone()); geos.push(armR.geometry);
  const legL = mk(legGeo), legR = mk(legGeo.clone()); geos.push(legR.geometry);
  armL.position.set(0.175, 0.55, 0); armL.rotation.z = 0.1;
  armR.position.set(-0.175, 0.55, 0); armR.rotation.z = -0.1;
  legL.position.set(0.065, 0.24, 0);
  legR.position.set(-0.065, 0.24, 0);
  bodyRoot.add(armL, armR);
  group.add(legL, legR);

  let phase = 0, amp = 0, last = null, idle = 0;

  function step(time, walking = true) {
    const dt = last === null ? 0 : Math.min(Math.max(time - last, 0), 0.1);
    last = time;
    amp += ((walking ? 1 : 0) - amp) * Math.min(1, dt * 10);
    phase += dt * 7.5 * amp;
    idle = time;
    const s = Math.sin(phase);
    const swingL = s * 0.65 * amp, swingA = s * 0.55 * amp;
    legL.rotation.x = -swingL;
    legR.rotation.x = swingL;
    armL.rotation.x = swingA;
    armR.rotation.x = -swingA;
    const breathe = Math.sin(idle * 2) * 0.003 * (1 - amp);
    bodyRoot.position.y = Math.abs(Math.cos(phase)) * 0.014 * amp + breathe;
    bodyRoot.rotation.z = Math.cos(phase) * 0.025 * amp;
    headPivot.rotation.z = -Math.cos(phase) * 0.03 * amp;
    headPivot.rotation.x = Math.sin(phase * 2) * 0.02 * amp;
  }

  function dispose() {
    geos.forEach(g => g.dispose());
    material.dispose();
  }

  step(0, false);
  return {group, height: 1.07, step, dispose, bodyRoot};
}
