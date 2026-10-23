// 五島論文智能島：溫暖黏土微縮 3D 場景（茜茜 Claude 實作，Codex 負責 HTML/CSS/資料）
import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {makeWalkNetwork, makeTour, sampleTour, ringPoint, WALK_Y} from './walk-network.js?v=space-1023';
import {createTarsharAvatar} from './tarshar-avatar.js?v=hair-1023';
import {ISLAND_RADIUS as R, PATH_WIDTH, BRIDGE_WIDTH, islandPosition} from './world-layout.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';

const TOP = 0.65, WATER_Y = -0.18, GY = TOP + 0.05;
const SQ3 = Math.sqrt(3);
const C = {coral: '#f08a74', cream: '#fbf0da', sage: '#a9c9a0', lilac: '#c3b1e1', wood: '#c99a6b', woodD: '#9a6b45',
  stone: '#efe4d0', gold: '#f3c46b', glass: '#d6edf2', warm: '#ffd88a', mustard: '#f2c879', dark: '#6e5a4a', white: '#fffaf0'};
const GREENS = ['#8fb98a', '#a5c79a', '#7aab84', '#b3d1a0'];
const BOOKS = ['#f08a74', '#c3b1e1', '#f2c879', '#a9c9a0', '#fbf0da', '#e59aa8', '#8fb6c9'];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
const clamp = THREE.MathUtils.clamp;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

const T = (h) => new THREE.Color(h);
const TOD = {
  dawn: {sunCol: T('#ffb894'), sunI: 2.3, sunPos: new THREE.Vector3(-11, 6, 5), hemiSky: T('#ffd0b8'), hemiGround: T('#8a7a8e'), hemiI: 0.95,
    exposure: 1.0, shallow: T('#a8dbd0'), deep: T('#82a9c6'), foam: T('#fff1e6'), glow: 0.8, cloud: T('#ffe3d6')},
  day: {sunCol: T('#fff1d6'), sunI: 2.9, sunPos: new THREE.Vector3(-7, 12, 7), hemiSky: T('#fff4e0'), hemiGround: T('#b8a98e'), hemiI: 1.05,
    exposure: 1.05, shallow: T('#93e2d3'), deep: T('#62b6d0'), foam: T('#ffffff'), glow: 0.7, cloud: T('#ffffff')},
  dusk: {sunCol: T('#ff9a6a'), sunI: 2.1, sunPos: new THREE.Vector3(12, 5, 6), hemiSky: T('#ffb9a0'), hemiGround: T('#6b5a7a'), hemiI: 0.85,
    exposure: 1.0, shallow: T('#93b9c6'), deep: T('#5c719c'), foam: T('#ffe6d6'), glow: 0.95, cloud: T('#ffc3a8')},
  night: {sunCol: T('#9db4ff'), sunI: 0.6, sunPos: new THREE.Vector3(6, 10, -4), hemiSky: T('#97a9d4'), hemiGround: T('#726682'), hemiI: 1.65,
    exposure: 0.95, shallow: T('#3d6389'), deep: T('#1f3156'), foam: T('#b9c8e8'), glow: 1.0, cloud: T('#7f8cb8')},
};
const cloneState = (s) => { const o = {}; for (const k in s) o[k] = s[k].clone ? s[k].clone() : s[k]; return o; };
const lerpState = (out, a, b, k) => {
  for (const key in a) out[key] = a[key].isColor || a[key].isVector3 ? (out[key] || a[key].clone()).copy(a[key]).lerp(b[key], k) : a[key] + (b[key] - a[key]) * k;
};

// ---------- 幾何與材質（全部單位尺寸，靠矩陣縮放） ----------
function makeGeos() {
  const prism = new THREE.CylinderGeometry(1, 1, 1, 3); prism.rotateX(-Math.PI / 2); prism.translate(0, 0.5, 0);
  const pyr = new THREE.ConeGeometry(1, 1, 4); pyr.rotateY(Math.PI / 4); pyr.translate(0, 0.5, 0);
  const torus = new THREE.TorusGeometry(1, 0.14, 8, 28); torus.rotateX(Math.PI / 2);
  return {
    rbox: new RoundedBoxGeometry(1, 1, 1, 2, 0.12), box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 24), cone: new THREE.ConeGeometry(1, 1, 20), cone6: new THREE.ConeGeometry(1, 1, 6),
    sph: new THREE.SphereGeometry(1, 16, 12), hex: new THREE.CylinderGeometry(1, 1, 1, 6), hexT: new THREE.CylinderGeometry(1, 2.08 / 2.02, 1, 6),
    hexS: new THREE.CylinderGeometry(1, 0.78, 1, 6), prism, pyr, torus,
  };
}
function makeMats() {
  return {
    clay: new THREE.MeshStandardMaterial({roughness: 0.88, metalness: 0}),
    glass: new THREE.MeshStandardMaterial({roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.5, depthWrite: false}),
    glow: new THREE.MeshBasicMaterial({color: 0xffffff}),
  };
}

// ---------- 零件收集器：所有靜態物件最後合併成 InstancedMesh ----------
const _o = new THREE.Object3D();
function B(list, own, base) {
  const part = (g, m, x, y, z, sx, sy, sz, ry, col, rx, rz) => {
    _o.position.set(x, y, z); _o.rotation.set(rx || 0, ry || 0, rz || 0); _o.scale.set(sx, sy, sz); _o.updateMatrix();
    list.push({g, m, mat: base ? base.clone().multiply(_o.matrix) : _o.matrix.clone(), col: new THREE.Color(col), own});
  };
  return {
    part,
    box: (x, y, z, w, h, d, c, ry, m) => part('rbox', m || 'clay', x, y + h / 2, z, w, h, d, ry, c),
    slab: (x, y, z, w, h, d, c, ry, rx, rz) => part('box', 'clay', x, y + h / 2, z, w, h, d, ry, c, rx, rz),
    cyl: (x, y, z, r, h, c, m, g) => part(g || 'cyl', m || 'clay', x, y + h / 2, z, r, h, r, 0, c),
    cone: (x, y, z, r, h, c, g) => part(g || 'cone', 'clay', x, y + h / 2, z, r, h, r, 0, c),
    sph: (x, y, z, r, c, m, sy) => part('sph', m || 'clay', x, y, z, r, r * (sy || 1), r, 0, c),
    roof: (x, y, z, w, h, d, c, ry) => part('prism', 'clay', x, y, z, w / 1.732, h / 1.5, d, ry, c),
    pyr: (x, y, z, w, h, d, c, ry) => part('pyr', 'clay', x, y, z, w / 1.414, h, d / 1.414, ry, c),
    win: (x, y, z, w, h, ry) => part('box', 'glow', x, y + h / 2, z, w, h, 0.03, ry, C.warm),
    glassBox: (x, y, z, w, h, d) => part('box', 'glass', x, y + h / 2, z, w, h, d, 0, C.glass),
    torus: (x, y, z, r, c) => part('torus', 'clay', x, y, z, r, r, r, 0, c),
  };
}

// ---------- 建物模型：腳印半徑約 0.6，正面朝 +z ----------
const MODELS = {
  lighthouse(b, rng, a) {
    b.cyl(0, 0, 0, 0.5, 0.12, C.stone);
    b.cyl(0, 0.12, 0, 0.34, 0.5, C.cream); b.cyl(0, 0.62, 0, 0.3, 0.45, a); b.cyl(0, 1.07, 0, 0.27, 0.45, C.cream); b.cyl(0, 1.52, 0, 0.24, 0.3, a);
    b.cyl(0, 1.82, 0, 0.37, 0.06, C.wood); b.torus(0, 1.92, 0, 0.35, C.dark);
    b.cyl(0, 1.88, 0, 0.2, 0.34, C.glass, 'glass'); b.sph(0, 2.04, 0, 0.11, C.warm, 'glow');
    b.cone(0, 2.22, 0, 0.3, 0.34, a); b.sph(0, 2.6, 0, 0.05, C.gold);
    b.box(0, 0.12, 0.31, 0.15, 0.24, 0.06, C.woodD); b.win(0, 0.75, 0.292, 0.08, 0.14); b.win(0, 1.2, 0.262, 0.08, 0.14);
  },
  books(b, rng, a) {
    b.box(0, 0, 0, 1.1, 0.2, 0.78, C.coral, 0.08); b.box(0.03, 0.2, -0.02, 1.0, 0.18, 0.72, C.sage, -0.1);
    b.box(-0.04, 0.38, 0.02, 0.92, 0.2, 0.68, C.lilac, 0.12); b.box(0, 0.58, 0, 0.84, 0.16, 0.6, C.mustard, -0.05);
    b.part('rbox', 'clay', -0.2, 0.78, 0, 0.4, 0.04, 0.5, 0, C.cream, 0, 0.14); b.part('rbox', 'clay', 0.2, 0.78, 0, 0.4, 0.04, 0.5, 0, C.cream, 0, -0.14);
    b.box(0, 0.74, 0, 0.06, 0.05, 0.5, a);
    b.box(0.72, 0, -0.05, 0.14, 0.8, 0.5, a, 0.1); b.box(0.88, 0, -0.02, 0.12, 0.7, 0.46, C.lilac, 0.05);
    b.part('cyl', 'clay', -0.1, 0.9, 0.34, 0.025, 0.4, 0.025, 0, C.gold, 0, Math.PI / 2);
    b.sph(-0.7, 0.1, 0.4, 0.11, C.sage, 'clay', 0.7); b.sph(-0.62, 0.1, 0.48, 0.08, C.sage, 'clay', 0.7);
  },
  lab(b, rng, a) {
    b.box(0, 0, 0, 1.1, 0.7, 0.8, C.cream); b.box(-0.15, 0.7, 0, 0.7, 0.45, 0.6, C.lilac);
    b.sph(0.4, 0.74, 0, 0.33, C.glass, 'glass', 0.9); b.sph(0.4, 0.8, 0, 0.1, C.coral);
    b.box(0, 0, 0.4, 0.22, 0.38, 0.05, a); b.win(-0.35, 0.2, 0.405, 0.2, 0.2); b.win(0.35, 0.2, 0.405, 0.2, 0.2); b.win(-0.15, 0.85, 0.305, 0.24, 0.2);
    b.cyl(-0.45, 1.1, -0.1, 0.09, 0.4, a); b.sph(-0.45, 1.62, -0.1, 0.1, C.white); b.sph(-0.38, 1.82, -0.05, 0.13, C.white);
    for (const [x, c] of [[0.66, C.lilac], [0.82, C.coral]]) { b.sph(x, 0.12, 0.38, 0.12, C.glass, 'glass'); b.sph(x, 0.08, 0.38, 0.09, c); b.cyl(x, 0.2, 0.38, 0.04, 0.12, C.glass, 'glass'); }
  },
  desk(b, rng, a) {
    b.box(0, 0.45, 0, 1.3, 0.1, 0.7, C.wood);
    for (const [x, z] of [[-0.55, -0.25], [-0.55, 0.25], [0.55, -0.25]]) b.box(x, 0, z, 0.09, 0.45, 0.09, C.woodD);
    b.box(0.43, 0, 0, 0.42, 0.45, 0.62, C.woodD); b.cyl(0.43, 0.2, 0.32, 0.03, 0.04, C.gold);
    b.cyl(-0.5, 0.55, -0.15, 0.1, 0.04, C.dark); b.cyl(-0.5, 0.59, -0.15, 0.02, 0.4, C.dark); b.cone(-0.5, 0.93, -0.1, 0.13, 0.14, a); b.sph(-0.5, 0.92, -0.1, 0.05, C.warm, 'glow');
    b.box(-0.05, 0.55, 0.05, 0.42, 0.025, 0.3, '#d8d3e0'); b.slab(-0.05, 0.56, -0.12, 0.42, 0.28, 0.025, C.lilac, 0, -0.25); b.win(-0.05, 0.6, -0.1, 0.34, 0.2, 0);
    b.cyl(0.33, 0.55, 0.22, 0.06, 0.1, C.cream); b.box(0.2, 0.55, -0.15, 0.2, 0.03, 0.26, C.white, 0.2);
    b.cyl(0.55, 0.55, 0.2, 0.07, 0.1, a); b.sph(0.55, 0.7, 0.2, 0.09, C.sage); b.sph(0.6, 0.76, 0.17, 0.06, C.sage);
    b.box(-0.05, 0.28, 0.6, 0.42, 0.07, 0.4, C.lilac); b.box(-0.05, 0.35, 0.8, 0.42, 0.35, 0.06, C.lilac);
    for (const [x, z] of [[-0.22, 0.45], [0.12, 0.45], [-0.22, 0.75], [0.12, 0.75]]) b.cyl(x, 0, z, 0.025, 0.28, C.woodD);
  },
  pavilion(b, rng, a) {
    b.cyl(0, 0, 0, 0.85, 0.05, C.stone, 'clay', 'hex'); b.cyl(0, 0.05, 0, 0.75, 0.07, C.cream, 'clay', 'hex');
    for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3; b.cyl(Math.sin(t) * 0.62, 0.12, Math.cos(t) * 0.62, 0.045, 0.8, C.cream); }
    b.cyl(0, 0.92, 0, 0.72, 0.07, C.wood, 'clay', 'hex'); b.cone(0, 0.99, 0, 0.92, 0.55, a, 'cone6'); b.sph(0, 1.57, 0, 0.06, C.gold);
    b.cyl(0, 0.76, 0, 0.012, 0.16, C.dark); b.sph(0, 0.72, 0, 0.07, C.warm, 'glow');
    b.cyl(0, 0.12, 0, 0.2, 0.22, C.wood); b.box(0, 0.34, 0, 0.26, 0.05, 0.18, C.lilac, 0.3); b.box(0.02, 0.39, 0, 0.2, 0.04, 0.14, C.mustard, -0.2);
  },
  bookshelf(b, rng, a) {
    b.box(-0.62, 0, 0, 0.1, 1.7, 0.4, C.wood); b.box(0.62, 0, 0, 0.1, 1.7, 0.4, C.wood); b.box(0, 0, -0.17, 1.3, 1.7, 0.06, C.woodD);
    for (const y of [0, 0.55, 1.1, 1.63]) b.box(0, y, 0, 1.3, 0.07, 0.4, C.wood);
    for (const y of [0.07, 0.62, 1.17]) {
      let x = -0.54;
      while (x < 0.5) {
        const w = 0.07 + rng() * 0.05, h = 0.3 + rng() * 0.17;
        if (rng() > 0.15) b.box(x + w / 2, y, 0.02, w, h, 0.26, BOOKS[Math.floor(rng() * BOOKS.length)]);
        x += w + 0.01;
      }
    }
    b.roof(0, 1.7, 0, 1.5, 0.32, 0.46, a); b.sph(0, 2.05, 0.2, 0.05, C.gold);
    b.slab(0.82, 0, 0.1, 0.04, 1.3, 0.05, C.woodD, 0, 0, -0.18); b.slab(0.9, 0, 0.1, 0.04, 1.3, 0.05, C.woodD, 0, 0, -0.18);
    for (let i = 0; i < 4; i++) b.slab(0.86 - i * 0.045, 0.2 + i * 0.28, 0.1, 0.12, 0.03, 0.04, C.wood);
  },
  dock(b, rng, a) {
    for (let i = 0; i < 8; i++) b.slab(0, 0.04, 0.55 - i * 0.15, 0.62, 0.05, 0.13, i % 2 ? C.wood : '#d6a97a');
    for (const [x, z] of [[-0.3, 0.55], [0.3, 0.55], [-0.3, -0.35], [0.3, -0.35]]) b.cyl(x, 0, z, 0.045, 0.28, C.woodD);
    b.cyl(-0.7, 0, -0.1, 0.05, 0.9, C.woodD); b.slab(-0.45, 0.85, -0.1, 0.8, 0.06, 0.06, C.woodD); b.cyl(-0.12, 0.45, -0.1, 0.012, 0.4, C.dark); b.box(-0.12, 0.38, -0.1, 0.12, 0.08, 0.12, a);
    b.box(0.62, 0, -0.35, 0.3, 0.28, 0.3, C.wood); b.box(0.66, 0.28, -0.35, 0.24, 0.22, 0.24, '#d6a97a', 0.3); b.cyl(0.62, 0, 0.0, 0.12, 0.3, C.woodD);
    b.box(0.35, 0, -0.65, 0.7, 0.5, 0.45, C.cream); b.roof(0.35, 0.5, -0.65, 0.88, 0.3, 0.6, a); b.win(0.35, 0.22, -0.425, 0.16, 0.16);
    b.sph(-0.35, 0.12, 0.7, 0.07, C.coral); b.sph(0.2, 0.1, 0.62, 0.06, C.white);
  },
  compass(b, rng, a) {
    b.cyl(0, 0, 0, 0.72, 0.1, C.stone); b.cyl(0, 0.1, 0, 0.6, 0.06, C.cream); b.torus(0, 0.18, 0, 0.6, a);
    const dirs = [[0, -1, -Math.PI / 2, 0, a], [0, 1, Math.PI / 2, 0, C.lilac], [1, 0, 0, -Math.PI / 2, C.sage], [-1, 0, 0, Math.PI / 2, C.mustard]];
    for (const [dx, dz, rx, rz, c] of dirs) b.part('cone', 'clay', dx * 0.3, 0.24, dz * 0.3, 0.1, 0.5, 0.1, 0, c, rx, rz);
    b.sph(0, 0.25, 0, 0.1, C.gold);
    b.cyl(0.52, 0.1, -0.5, 0.03, 0.95, C.woodD); b.box(0.52, 0.72, -0.5, 0.42, 0.12, 0.04, C.wood, 0.3); b.box(0.5, 0.52, -0.46, 0.38, 0.1, 0.04, a, -0.4);
    b.sph(0.52, 1.07, -0.5, 0.05, C.gold);
  },
  house(b, rng, a) {
    b.box(0, 0, 0, 0.95, 0.6, 0.75, C.cream); b.roof(0, 0.58, 0, 1.15, 0.45, 0.95, a);
    b.box(0, 0, 0.375, 0.18, 0.34, 0.05, C.lilac); b.win(-0.3, 0.25, 0.385, 0.17, 0.17); b.win(0.3, 0.25, 0.385, 0.17, 0.17);
    b.box(-0.3, 0.2, 0.39, 0.22, 0.03, 0.05, C.woodD); b.box(0.3, 0.2, 0.39, 0.22, 0.03, 0.05, C.woodD);
    b.box(0.3, 0.85, -0.1, 0.12, 0.35, 0.12, C.stone); b.box(0, 0, 0.55, 0.4, 0.05, 0.25, C.stone);
    b.sph(-0.55, 0.12, 0.2, 0.12, C.sage); b.sph(-0.5, 0.1, 0.34, 0.09, C.sage);
  },
};
const MODEL_SCALE = {lighthouse: 0.85, bookshelf: 0.8, books: 1.05, pavilion: 1.0};
const modelFn = (m) => MODELS[String(m || '').toLowerCase()] || MODELS.house;
const modelKey = (m) => (MODELS[String(m || '').toLowerCase()] ? String(m).toLowerCase() : 'house');

// ---------- 場景組裝 ----------
const hexv = (x, z) => Math.max(Math.abs(x), 0.5 * Math.abs(x) + 0.866 * Math.abs(z));
const hexDist = (a, b) => { const dq = a.axial[0] - b.axial[0], dr = a.axial[1] - b.axial[1]; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };
const SLOTS = [[-1.4, .55], [1.4, .55], [0, 1.5], [-1.15, -1.2], [1.15, -1.2], [0, -1.6]];

function xf(x, y, z, ry, s) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry || 0, 0)), new THREE.Vector3(s, s, s));
}

function buildIsland(L, isl, i, all) {
  const rng = mulberry32(1023 + i * 97), own = i, {x: cx, z: cz} = isl;
  const base = B(L, own, xf(cx, 0, cz, 0, 1));
  const ic = new THREE.Color(isl.color);
  const grass = mix(C.sage, isl.color, 0.14);
  base.part('hexS', 'clay', 0, -0.3, 0, R+.06, 0.6, R+.06, 0, mix('#c9a98a', isl.color, 0.1));
  base.part('hexT', 'clay', 0, 0.325, 0, R, 0.65, R, 0, mix('#efdcbc', isl.color, 0.22));
  base.part('hex', 'clay', 0, 0.2, 0, R+.045, 0.05, R+.045, 0, mix('#f6e9cf', isl.color, 0.45));
  base.part('hex', 'clay', 0, 0.6, 0, R+.03, 0.1, R+.03, 0, ic);
  base.part('hex', 'clay', 0, TOP + 0.025, 0, R-.12, 0.05, R-.12, 0, grass);

  const occ = [], free = (x, z, r) => occ.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r);
  const loc = (x, z, ry, s) => B(L, own, xf(cx + x, GY, cz + z, ry, s));
  const bridges = all.filter((o, j) => j !== i && hexDist(isl, o) === 1).map((o) => {
    const dx = o.x - cx, dz = o.z - cz, d = Math.hypot(dx, dz); return {x: dx / d, z: dz / d, o};
  });
  const ends = bridges.map((b2) => [b2.x * Math.hypot(ringPoint(1).x,ringPoint(1).z), b2.z * Math.hypot(ringPoint(1).x,ringPoint(1).z)]);
  ends.forEach(([x, z]) => occ.push({x, z, r: 0.45}));

  // 主建物 + 最多三個不同造型的小細節
  const items = isl.items || [];
  const mainModel = modelKey(items[0] && items[0].model);
  const ms = 1.4 * (MODEL_SCALE[mainModel] || 1);
  modelFn(mainModel)(loc(0, -0.65, 0, ms), rng, ic);
  const bld = [{x: 0, z: -0.65, r: 1.05}]; occ.push(bld[0]);
  const used = new Set([mainModel]), secs = [];
  for (const it of items) { const k = modelKey(it.model); if (!used.has(k) && secs.length < 3) { used.add(k); secs.push(k); } }
  const taken = new Set();
  secs.forEach((k) => {
    let best = -1, bs = -1e9;
    SLOTS.forEach((s, j) => {
      if (taken.has(j) || !free(s[0],s[1],.55)) return;
      const sc = Math.min(9, ...ends.map((e) => Math.hypot(e[0] - s[0], e[1] - s[1]))) - j * 0.05;
      if (sc > bs) { bs = sc; best = j; }
    });
    if(best<0)return;
    taken.add(best);
    const [sx, sz] = SLOTS[best], s = 0.65 * (MODEL_SCALE[k] || 1);
    modelFn(k)(loc(sx, sz, Math.atan2(-sx, 3) * 0.6, s), rng, ic);
    const c = {x: sx, z: sz, r: 0.55}; occ.push(c); bld.push(c);
  });

  // Twelve path nodes: six vertices and six bridge-facing midpoints.
  for(let k=0;k<12;k++) {
    const a=ringPoint(k),b=ringPoint((k+1)%12),length=Math.hypot(b.x-a.x,b.z-a.z);
    base.part('box','clay',(a.x+b.x)/2,WALK_Y-.025,(a.z+b.z)/2,PATH_WIDTH,.05,length+.018,Math.atan2(b.x-a.x,b.z-a.z),'#f0debd');
    base.cyl(a.x,WALK_Y-.048,a.z,PATH_WIDTH/2,.048,'#f0debd');
  }
  // 廣場與六角步道
  const plaza = [0, 1.22];
  base.part('hex', 'clay', plaza[0], GY + 0.015, plaza[1], 0.85, 0.03, 0.85, 0, C.stone);
  base.part('hex', 'clay', plaza[0], GY + 0.03, plaza[1], 0.58, 0.02, 0.58, 0, '#f7eedd');
  const targets = ends.concat(secs.length ? SLOTS.filter((s, j) => taken.has(j)) : []);
  targets.forEach(([tx, tz]) => {
    const vx = tx - plaza[0], vz = tz - plaza[1], len = Math.hypot(vx, vz);
    for (let d = 0.6; d < len - 0.25; d += 0.4) {
      const x = plaza[0] + (vx / len) * d, z = plaza[1] + (vz / len) * d;
      if (bld.some((o) => Math.hypot(o.x - x, o.z - z) < o.r - 0.05)) continue;
      base.part('hex', 'clay', x, GY + 0.01, z, 0.16, 0.025, 0.16, 0, mix(C.stone, '#e2d3bb', rng() * 0.6));
    }
  });

  // 小路燈、長椅、樹、花
  const lamp = (x, z) => {
    const b = loc(x, z, 0, 1); occ.push({x, z, r: 0.12});
    b.cyl(0, 0, 0, 0.06, 0.05, C.dark); b.cyl(0, 0.05, 0, 0.022, 0.5, C.dark); b.sph(0, 0.58, 0, 0.065, C.warm, 'glow'); b.cone(0, 0.62, 0, 0.09, 0.07, C.dark);
  };
  lamp(-0.9, 1.5); lamp(0.9, 1.5);
  ends.slice(0, 2).forEach(([x, z]) => lamp(x * 0.8 + z * 0.2, z * 0.8 - x * 0.2));
  const place = (n, rmin, hexMax, r, fn) => {
    for (let t = 0, d = 0; d < n && t < 80; t++) {
      const a = rng() * 6.283, rad = rmin + rng() * (1.88 - rmin), x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      if (hexv(x, z) > hexMax || hexv(x,z)+r>2.03 || !free(x, z, r)) continue;
      occ.push({x, z, r}); fn(x, z); d++;
    }
  };
  place(2, 1.1, 1.88, 0.3, (x, z) => {
    const b = loc(x, z, Math.atan2(-x, -z), 1);
    b.box(0, 0.16, 0, 0.5, 0.05, 0.17, C.wood); b.box(0, 0.22, -0.08, 0.5, 0.18, 0.035, C.wood); b.box(-0.2, 0, 0, 0.05, 0.16, 0.15, C.woodD); b.box(0.2, 0, 0, 0.05, 0.16, 0.15, C.woodD);
  });
  place(5 + Math.floor(rng() * 2), 1.35, 1.88, 0.38, (x, z) => {
    const b = loc(x, z, rng() * 6, 0.85 + rng() * 0.45), pine = rng() < 0.3, blossom = !pine && rng() < 0.25;
    b.cyl(0, 0, 0, 0.05, 0.3, C.woodD);
    if (pine) { b.cone(0, 0.2, 0, 0.26, 0.4, GREENS[2]); b.cone(0, 0.45, 0, 0.2, 0.36, GREENS[0]); b.cone(0, 0.68, 0, 0.13, 0.28, GREENS[1]); }
    else { const g = blossom ? '#f2a99a' : GREENS[Math.floor(rng() * 4)]; b.sph(0, 0.45, 0, 0.28, g); b.sph(0.1, 0.68, 0.03, 0.2, mix(g, '#ffffff', 0.15)); }
  });
  const FL = [C.coral, C.lilac, C.cream, C.mustard, '#e59aa8'];
  place(9, 1.0, 1.88, 0.1, (x, z) => {
    const b = loc(x, z, 0, 1);
    b.sph(0, 0.02, 0, 0.07, C.sage, 'clay', 0.5); b.sph(0, 0.07, 0, 0.045, FL[Math.floor(rng() * FL.length)]);
  });
  // 彩旗
  const fb = loc(0, 1.9, 0, .8), fc = [C.coral, C.cream, C.lilac, ic];
  fb.cyl(-0.95, 0, 0, 0.025, 0.58, C.dark); fb.cyl(0.95, 0, 0, 0.025, 0.58, C.dark);
  for (let k = 1; k < 9; k++) {
    const u = k / 9, y = 0.56 - 0.13 * 4 * u * (1 - u);
    fb.part('prism', 'clay', -0.95 + u * 1.9, y, 0, 0.09, 0.11, 0.02, 0, fc[k % 4], Math.PI);
  }
  occ.push({x: 0, z: 1.2, r: 0.1});
  return {bridges, ends};
}

function buildBridges(L, islands) {
  const network=makeWalkNetwork(islands);
  for(const edge of network.edges.filter(e=>e.kind==='bridge')) {
    const a=network.nodes[edge.a],b=network.nodes[edge.b],dx=b.x-a.x,dz=b.z-a.z,ry=Math.atan2(dx,dz),ux=dx/edge.length,uz=dz/edge.length;
    const bl=B(L,Math.floor(edge.a/12),null);
    for(let k=0;k<9;k++) {
      const t=(k+.5)/9,y=WALK_Y+.1*Math.sin(t*Math.PI);
      bl.part('box','clay',a.x+dx*t,y-.025,a.z+dz*t,BRIDGE_WIDTH,.05,edge.length/9+.012,ry,k%2?C.wood:'#d6a97a');
    }
    for(const side of [-1,1]) {
      const px=-uz*side*(BRIDGE_WIDTH/2+.035),pz=ux*side*(BRIDGE_WIDTH/2+.035);
      for(const t of [0,1])bl.cyl(a.x+dx*t+px,WALK_Y,a.z+dz*t+pz,.025,.28,C.woodD);
      bl.part('box','clay',(a.x+b.x)/2+px,WALK_Y+.27,(a.z+b.z)/2+pz,.025,.025,edge.length,ry,C.dark);
    }
  }
}

function buildFar(L, rng, center) {
  [[-2.5, 19], [-1.0, 24], [0.5, 22], [2.3, 20], [3.6, 26]].forEach(([a, r], k) => {
    const x = center.x + Math.cos(a) * r, z = center.z + Math.sin(a) * r * 0.9, s = 0.8 + (k % 3) * 0.25, b = B(L, -1, xf(x, 0, z, k, s));
    b.part('hexS', 'clay', 0, -0.2, 0, 1.3, 0.4, 1.3, 0, '#d4b896'); b.part('hex', 'clay', 0, 0.2, 0, 1.3 * 0.78, 0.4, 1.3 * 0.78, 0, '#e8d6b6');
    b.part('hex', 'clay', 0, 0.42, 0, 1.0, 0.05, 1.0, 0, C.sage);
    b.sph(0.1, 0.78, 0, 0.3, GREENS[k % 4]); b.cyl(0.1, 0.45, 0, 0.05, 0.3, C.woodD);
    if (k % 2) b.cone(-0.4, 0.45, 0.2, 0.2, 0.55, GREENS[2]);
  });
}

// ---------- 主入口 ----------
export async function createIslandScene({container, data, onSelect, onError, onFollowChange}) {
  const noop = () => {};
  const stub = {select: noop, reset: noop, setTime: noop, setMotion: noop, setFlows: noop, setVisible: noop, dispose: noop, getStats: () => ({error: true})};
  let renderer;
  const isMobile = matchMedia('(pointer: coarse)').matches || container.clientWidth < 700;
  try {
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
  } catch (e) { throw e; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.4 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
  canvas.tabIndex = 0; canvas.setAttribute('aria-label', '論文智能島 3D 場景，可用方向鍵旋轉視角');
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 220);
  const rng0 = mulberry32(1023);

  // 島位置
  const islands = data.islands.map((d) => ({...d, ...islandPosition(d.axial)}));
  const byId = new Map(islands.map((d, i) => [d.id, i]));
  const bb = new THREE.Box3();
  islands.forEach((d) => bb.expandByPoint(new THREE.Vector3(d.x - R-.1, -0.3, d.z - R-.1)).expandByPoint(new THREE.Vector3(d.x + R+.1, 3.7, d.z + R+.1)));
  const center = bb.getCenter(new THREE.Vector3()), extentR = Math.max(...islands.map((d) => Math.hypot(d.x - center.x, d.z - center.z))) + R+.1;

  // 光
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.castShadow = true; sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  const sc = sun.shadow.camera, sr = extentR + 1.5;
  sc.left = -sr; sc.right = sr; sc.top = sr; sc.bottom = -sr; sc.near = 1; sc.far = 80;
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
  sun.target.position.set(center.x, 0, center.z);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
  scene.add(sun, sun.target, hemi);

  // 零件 → InstancedMesh
  const L = [];
  islands.forEach((d, i) => buildIsland(L, d, i, islands));
  buildBridges(L, islands);
  buildFar(L, rng0, center);
  const geos = makeGeos(), mats = makeMats(), groups = new Map();
  L.forEach((p) => { const k = p.g + '|' + p.m; (groups.get(k) || groups.set(k, []).get(k)).push(p); });
  const pickables = [];
  let totalInst = 0;
  groups.forEach((arr, k) => {
    const [g, m] = k.split('|'), im = new THREE.InstancedMesh(geos[g], mats[m], arr.length);
    arr.forEach((p, n) => { im.setMatrixAt(n, p.mat); im.setColorAt(n, p.col); });
    im.userData.owner = arr.map((p) => p.own);
    im.castShadow = m !== 'glow' && m !== 'glass'; im.receiveShadow = m === 'clay';
    if (m === 'glass') im.renderOrder = 2;
    im.frustumCulled = false; scene.add(im); pickables.push(im); totalInst += arr.length;
  });

  // 水面（shader：深淺漸層、波紋、淺水環、泡沫、外緣淡出）
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {uTime: {value: 0}, uShallow: {value: new THREE.Color()}, uDeep: {value: new THREE.Color()}, uFoam: {value: new THREE.Color()},
      uC: {value: Array.from({length:8}, (_,i) => new THREE.Vector2(islands[i]?.x || 0, islands[i]?.z || 0))}, uN: {value: islands.length}, uRadius: {value:R}, uMid: {value: new THREE.Vector2(center.x, center.z)}, uFade: {value: 62}},
    vertexShader: 'varying vec2 vXZ; void main(){ vec4 w = modelMatrix*vec4(position,1.); vXZ = w.xz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float uTime,uFade,uRadius; uniform vec3 uShallow,uDeep,uFoam; uniform vec2 uC[8],uMid; uniform int uN; varying vec2 vXZ;
      float hexd(vec2 p){ p=abs(p); return max(p.x, p.x*.5+p.y*.8660254); }
      void main(){
        float h=100.; for(int i=0;i<8;i++){ if(i>=uN) break; h=min(h,hexd(vXZ-uC[i])); }
        float sh=1.-smoothstep(uRadius*.82,uRadius+1.4,h), r=length(vXZ-uMid), t=uTime;
        vec3 col=mix(uDeep,uShallow,max(sh,.35*(1.-smoothstep(5.,30.,r))));
        float w=sin(vXZ.x*1.3+t*.7+sin(vXZ.y*.8+t*.5)*1.4)+sin(vXZ.y*1.7-t*.6+sin(vXZ.x*.7-t*.4)*1.2);
        col=mix(col,vec3(1.),smoothstep(1.55,1.95,w)*.16);
        float f=(1.-smoothstep(0.,.09,abs(h-(uRadius*.94+.04*sin(t*1.3+vXZ.x*3.+vXZ.y*2.)))))*.75
               +(1.-smoothstep(0.,.05,abs(h-uRadius*1.08-.05*sin(t*1.1+vXZ.y*2.))))*.3*sh;
        col=mix(col,uFoam,clamp(f,0.,1.));
        gl_FragColor=vec4(col,(1.-smoothstep(uFade*.55,uFade,r))*.96);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(center.x, WATER_Y, center.z); water.renderOrder = -1; scene.add(water);

  // 選取光環
  const ringMat = new THREE.MeshBasicMaterial({color: 0xfff0b8, transparent: true, opacity: 0.6, depthWrite: false});
  const ring = new THREE.Mesh(new THREE.RingGeometry(R+.18, R+.48, 6, 1, Math.PI / 2), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 1; scene.add(ring);

  // 小船、雲、小人（少量獨立 mesh，供動畫）
  const disp = [], sphG = new THREE.SphereGeometry(1, 14, 10); disp.push(sphG);
  const stdMat = (c, o) => { const m = new THREE.MeshStandardMaterial({color: c, roughness: 0.9, ...o}); disp.push(m); return m; };
  const boats = [], order = islands.map((d, i) => i).sort((a, b) => Math.hypot(islands[b].x - center.x, islands[b].z - center.z) - Math.hypot(islands[a].x - center.x, islands[a].z - center.z)).slice(0, 3);
  order.forEach((i, k) => {
    const d = islands[i], ox = d.x - center.x, oz = d.z - center.z, l = Math.hypot(ox, oz) || 1, g = new THREE.Group();
    const hull = new THREE.Mesh(geos.rbox, stdMat([C.coral, C.lilac, C.mustard][k])); hull.scale.set(0.5, 0.1, 0.2); hull.position.y = 0.05;
    const mast = new THREE.Mesh(geos.cyl, stdMat(C.woodD)); mast.scale.set(0.012, 0.4, 0.012); mast.position.y = 0.3;
    const sail = new THREE.Mesh(geos.prism, stdMat(C.cream)); sail.scale.set(0.07, 0.28, 0.01); sail.position.set(0.02, 0.12, 0); sail.rotation.y = 0;
    g.add(hull, mast, sail); g.userData = {base: new THREE.Vector3(d.x + (ox / l) * (R+.85), WATER_Y + 0.03, d.z + (oz / l) * (R+.85)), tan: new THREE.Vector3(-oz / l, 0, ox / l), ph: k * 2};
    g.position.copy(g.userData.base); g.traverse((o) => { o.castShadow = true; }); scene.add(g); boats.push(g);
  });
  const cloudMat = stdMat('#ffffff', {transparent: true, opacity: 0.85, depthWrite: false}), clouds = [];
  for (let k = 0; k < 5; k++) {
    const g = new THREE.Group(), back = k < 3;
    [[0, 0, 0, 1.1], [1, 0.1, 0.2, 0.85], [-1, 0, -0.1, 0.8], [0.3, 0.45, 0, 0.7]].forEach(([x, y, z, s]) => { const m = new THREE.Mesh(sphG, cloudMat); m.scale.set(s, s * 0.6, s * 0.8); m.position.set(x * 1.1, y, z); g.add(m); });
    g.position.set(center.x + (k * 9.3 % 36) - 18, back ? 6 + (k % 2) : 3.6, center.z + (back ? -(extentR + 5 + k) : extentR + 4 + k)); g.scale.setScalar(1 + (k % 3) * 0.35);
    g.userData.speed = 0.25 + (k % 3) * 0.08; scene.add(g); clouds.push(g);
  }
  const network = makeWalkNetwork(islands);
  const tour = makeTour(network,islands,data.avatar.route);
  const avatar = createTarsharAvatar(data.avatar);
  const avatarScale = data.avatar.scale || 1;
  avatar.group.scale.setScalar(avatarScale);scene.add(avatar.group);
  let walkingDistance = 0, walkerSample=sampleTour(network,tour,0), following=false, followDistance=6;
  avatar.group.position.set(walkerSample.x,walkerSample.y,walkerSample.z);
  avatar.group.rotation.y=walkerSample.heading;
  const walkerBadge=document.createElement('button');
  walkerBadge.type='button';walkerBadge.className='walker-name';walkerBadge.textContent=data.avatar.name;
  walkerBadge.setAttribute('aria-label','跟著 '+data.avatar.name+' 散步');
  walkerBadge.addEventListener('click',()=>api.followWalker(true));
  container.appendChild(walkerBadge);
  function followState(value) { following=value; if(onFollowChange)onFollowChange(following); }
  const lookAtWalker=new THREE.Vector3();

  // 島間彎曲虛線示意（InstancedMesh 小短棒）
  const curves = (data.flows || []).filter(f => byId.has(f.from) && byId.has(f.to)).map(f => {
    const a = islands[byId.get(f.from)], b = islands[byId.get(f.to)], p0 = new THREE.Vector3(a.x, 2.0, a.z), p2 = new THREE.Vector3(b.x, 2.0, b.z), mid = p0.clone().add(p2).multiplyScalar(0.5);
    const side = new THREE.Vector3(-(p2.z - p0.z), 0, p2.x - p0.x).normalize().multiplyScalar(0.7);
    return new THREE.QuadraticBezierCurve3(p0, mid.add(new THREE.Vector3(0, 1.6, 0)).add(side), p2);
  });
  const DASH = 22, flowMat = new THREE.MeshBasicMaterial({color: 0xfff0c8, transparent: true, opacity: 0.9});
  const flowMesh = new THREE.InstancedMesh(geos.box, flowMat, Math.max(1, curves.length * DASH)); flowMesh.frustumCulled = false; flowMesh.visible = false; scene.add(flowMesh);
  const _q = new THREE.Quaternion(), _s = new THREE.Vector3(0.16, 0.05, 0.05), _fz = new THREE.Vector3(1, 0, 0), _mm = new THREE.Matrix4();
  function updateFlow(off) {
    curves.forEach((c, ci) => { for (let k = 0; k < DASH; k++) {
      const u = (k / DASH + off) % 1; _q.setFromUnitVectors(_fz, c.getTangent(u)); _mm.compose(c.getPoint(u), _q, _s); flowMesh.setMatrixAt(ci * DASH + k, _mm);
    } });
    flowMesh.instanceMatrix.needsUpdate = true;
  }
  updateFlow(0);

  // 標籤（普通 HTML button，每幀投影；pointer-events:none 不擋拖曳，鍵盤可聚焦、Enter 觸發）
  const overlay = document.createElement('div');
  overlay.className = 'island-labels'; overlay.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
  container.appendChild(overlay);
  const labels = islands.map((d) => {
    const bt = document.createElement('button');
    bt.type = 'button'; bt.className = 'island-label'; bt.dataset.island = d.id; bt.textContent = d.title; bt.title = d.title; bt.setAttribute('aria-label', d.title); bt.setAttribute('aria-pressed', 'false');
    bt.style.cssText = `position:absolute;left:0;top:0;pointer-events:auto;white-space:nowrap;cursor:pointer;font:600 13px/1.2 system-ui,'PingFang TC','Noto Sans TC',sans-serif;color:#5a4636;background:rgba(255,248,235,.94);border:2px solid ${d.color};border-radius:999px;padding:4px 11px;box-shadow:0 3px 8px rgba(90,70,54,.25)`;
    bt.addEventListener('click', () => { onSelect && onSelect(d.id); });
    overlay.appendChild(bt); return bt;
  });

  // 狀態
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mqReduce.matches, motion = data.avatar.autoWalk !== false, flows = false, visible = true, disposed = false, lost = false, selected = null, userMoved = false, arriving = true;
  let raf = 0, last = 0, simT = 0, frames = 0, flight = null, active = [], todName = 'day', todTween = null;
  const cur = cloneState(TOD.day);
  const effMotion = () => motion && !reduced && visible && !document.hidden;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reduced; controls.dampingFactor = 0.07; controls.enablePan = true; controls.screenSpacePanning = false; controls.panSpeed = .8;
  controls.minPolarAngle = THREE.MathUtils.degToRad(25); controls.maxPolarAngle = THREE.MathUtils.degToRad(70); controls.minDistance = 2.8; controls.maxDistance = 65;

  const DIR0 = new THREE.Vector3(0.24, 0.65, 0.87).normalize(), home = {target: new THREE.Vector3(center.x, 1.1, center.z), dist: 30};
  function computeHome(w, h) {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), aspect = w / h, m = w < 600 ? 0.94 : 0.84;
    const right = new THREE.Vector3().crossVectors(DIR0.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, DIR0.clone().negate());
    let d = 0;
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
      const r = new THREE.Vector3(x, y, z).sub(home.target);
      d = Math.max(d, Math.abs(r.dot(right)) / (t * aspect * m) + r.dot(DIR0), Math.abs(r.dot(up)) / (t * m) + r.dot(DIR0));
    }
    home.dist = Math.max(14, d); controls.maxDistance = Math.max(65, home.dist * 1.05);
  }
  function applyView(target, dir, dist) { controls.target.copy(target); camera.position.copy(target).addScaledVector(dir, dist); camera.lookAt(target); controls.update(); }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    computeHome(w, h);
    if (!userMoved && !selected && !flight) {
      if(w<700 && arriving){const start=islands[byId.get('chapters') ?? 0];const distance=Math.max(16,(R+.5)/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*(w/h)*.93)+2);applyView(new THREE.Vector3(start.x,1.1,start.z),DIR0,distance);}
      else applyView(home.target, DIR0, home.dist);
    }
    labels.forEach((l,i) => { l.textContent = w < 600 ? String(i+1).padStart(2,'0') : islands[i].title; l.style.fontSize = w < 600 ? '12px' : '13px'; });
    requestRender();
  }

  // 時間
  function applyTod() {
    sun.color.copy(cur.sunCol); sun.intensity = cur.sunI; sun.position.copy(center).addScaledVector(cur.sunPos.clone().normalize(), 32);
    hemi.color.copy(cur.hemiSky); hemi.groundColor.copy(cur.hemiGround); hemi.intensity = cur.hemiI; renderer.toneMappingExposure = cur.exposure;
    waterMat.uniforms.uShallow.value.copy(cur.shallow); waterMat.uniforms.uDeep.value.copy(cur.deep); waterMat.uniforms.uFoam.value.copy(cur.foam);
    mats.glow.color.setScalar(cur.glow); cloudMat.color.copy(cur.cloud);
  }
  applyTod();

  function selectIsland(id) {
    followState(false);
    const i = byId.get(id);
    selected = i === undefined ? null : id;
    labels.forEach((l, k) => { const on = k === i; l.setAttribute('aria-pressed', on ? 'true' : 'false'); l.classList.toggle('is-selected', on); l.style.background = on ? islands[k].color : 'rgba(255,248,235,.94)'; l.style.color = on ? '#fff' : '#5a4636'; });
    ring.visible = i !== undefined;
    if (i !== undefined) { ring.position.set(islands[i].x, WATER_Y + 0.03, islands[i].z); ringMat.color.set(0xfff0b8); }
    const to = i === undefined ? null : new THREE.Vector3(islands[i].x, 0.9, islands[i].z);
    flyTo(to || home.target, i === undefined ? null : Math.max(12, home.dist * 0.32), i === undefined);
  }
  function flyTo(target, dist, toHomeDir, customDir=null) {
    const dirNow = camera.position.clone().sub(controls.target).normalize(), toDir = customDir || (toHomeDir ? DIR0.clone() : dirNow.clone()), toD = dist || home.dist;
    if (reduced) { flight = null; applyView(target, toDir, toD); requestRender(); return; }
    flight = {t0: performance.now(), dur: 800, fromT: controls.target.clone(), toT: target.clone(), fromDir: dirNow, toDir, fromD: camera.position.distanceTo(controls.target), toD};
    requestRender();
  }

  // 繪製迴圈：靜止時不排程 RAF
  function requestRender() { if (!raf && visible && !document.hidden && !disposed && !lost) raf = requestAnimationFrame(frame); }
  const _p = new THREE.Vector3(), _sp = new THREE.Spherical();
  function frame(now) {
    raf = 0;
    if (disposed || !visible || document.hidden || lost) return;
    const dt = Math.min(0.08, last ? (now - last) / 1000 : 0.016); last = now;
    active = [];
    if (flight) {
      const k = clamp((now - flight.t0) / flight.dur, 0, 1), e = ease(k);
      const dir = flight.fromDir.clone().lerp(flight.toDir, e).normalize();
      applyView(new THREE.Vector3().lerpVectors(flight.fromT, flight.toT, e), dir, THREE.MathUtils.lerp(flight.fromD, flight.toD, e));
      active.push('flight'); if (k >= 1) flight = null;
    }
    if (todTween) {
      todTween.k = Math.min(1, todTween.k + dt / 0.6); lerpState(cur, todTween.from, TOD[todName], ease(todTween.k)); applyTod(); active.push('time');
      if (todTween.k >= 1) todTween = null;
    }
    const em = effMotion();
    if (em) {
      simT += dt; active.push('motion'); waterMat.uniforms.uTime.value = simT;
      boats.forEach((g) => { const u = g.userData; g.position.copy(u.base).addScaledVector(u.tan, Math.sin(simT * 0.3 + u.ph) * 0.35); g.position.y += Math.sin(simT * 1.6 + u.ph) * 0.02; g.rotation.set(0, Math.atan2(-u.tan.z, u.tan.x), Math.sin(simT * 1.3 + u.ph) * 0.05); });
      clouds.forEach((c) => { c.position.x += c.userData.speed * dt; if (c.position.x > center.x + extentR + 18) c.position.x = center.x - extentR - 18; });
      walkingDistance += dt*(data.avatar.speed || .48);
      walkerSample=sampleTour(network,tour,walkingDistance);
      avatar.group.position.set(walkerSample.x,walkerSample.y,walkerSample.z);
      let angle=walkerSample.heading-avatar.group.rotation.y;
      angle=Math.atan2(Math.sin(angle),Math.cos(angle));
      avatar.group.rotation.y+=angle*Math.min(1,dt*12);
      avatar.step(simT,true);
      if (flows) updateFlow((simT * 0.06) % 1);
      if (selected) ringMat.opacity = 0.5 + Math.sin(simT * 3) * 0.15;
    }
    if(following && !flight) {
      lookAtWalker.copy(avatar.group.position).add(new THREE.Vector3(0,avatar.height*avatarScale*.5,0));
      const heading=avatar.group.rotation.y;
      const dir=new THREE.Vector3(Math.sin(heading)*.85+Math.cos(heading)*.22,.58,Math.cos(heading)*.85-Math.sin(heading)*.22).normalize();
      const next=lookAtWalker.clone().addScaledVector(dir,followDistance);
      controls.target.copy(lookAtWalker);camera.position.lerp(next,Math.min(1,dt*5));
    }
    const damping = controls.update();
    // Keep panning near the islands; reset always restores the whole archipelago.
    const bounded=controls.target.clone();bounded.x=clamp(bounded.x,bb.min.x-3,bb.max.x+3);bounded.z=clamp(bounded.z,bb.min.z-3,bb.max.z+3);bounded.y=clamp(bounded.y,.5,3);
    camera.position.add(bounded.clone().sub(controls.target));controls.target.copy(bounded);
    if (damping) active.push('damping');
    try { renderer.render(scene, camera); frames++; } catch (error) { lost = true; onError && onError(error); return; }
    updateLabels();
    updateWalkerBadge();
    if (flight || todTween || em || damping) requestRender();
  }
  function updateLabels() {
    const w = container.clientWidth, h = container.clientHeight;
    islands.forEach((d, i) => {
      _p.set(d.x, 3.0, d.z).project(camera);
      const bt = labels[i], px = (_p.x * .5 + .5) * w, py = (-_p.y * .5 + .5) * h;
      const half = bt.offsetWidth / 2;
      const vis = _p.z < 1 && px > half + 8 && px < w - half - 8 && py > 110 && py < h - 105 && !(px>w-88 && py<285);
      bt.style.visibility = vis ? 'visible' : 'hidden';
      if (vis) { bt.style.transform = `translate3d(${((_p.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-_p.y * 0.5 + 0.5) * h).toFixed(1)}px,0) translate(-50%,-100%)`; bt.style.zIndex = String(Math.round((1 - _p.z) * 1000)); }
    });
  }

  function updateWalkerBadge() {
    _p.copy(avatar.group.position);_p.y+=avatar.height*avatarScale+.17;_p.project(camera);
    const w=container.clientWidth,h=container.clientHeight,x=(_p.x*.5+.5)*w,y=(-_p.y*.5+.5)*h;
    const vis=visible&&_p.z<1&&x>25&&x<w-25&&y>75&&y<h-85&&!(x>w-88&&y<285);
    walkerBadge.hidden=!vis;
    if(vis)walkerBadge.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
  }
  // 互動：拖曳旋轉由 OrbitControls；點擊（位移 <=6px）才做 raycast
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(pickables, false)) { const o = h.object.userData.owner[h.instanceId]; if (o >= 0) return islands[o].id; }
    return null;
  }
  let down = null, lastHover = 0; const pointers = new Set();
  const onDown = (e) => { pointers.add(e.pointerId); down = pointers.size === 1 ? {id: e.pointerId, x: e.clientX, y: e.clientY, moved:false} : null; flight = null; followState(false); userMoved = true; requestRender(); };
  const onUp = (e) => {
    const d = down; down = null; pointers.delete(e.pointerId);
    if (!d || d.moved || pointers.size || d.id !== e.pointerId || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
    const id = pick(e.clientX, e.clientY);
    if (id) { onSelect && onSelect(id); }
  };
  const onCancel = (e) => { down = null; pointers.delete(e.pointerId); };
  const onMove = (e) => {
    if(down && Math.hypot(e.clientX-down.x,e.clientY-down.y)>6) down.moved=true;
    if (e.pointerType !== 'mouse' || e.buttons || performance.now() - lastHover < 60) return;
    lastHover = performance.now(); canvas.style.cursor = pick(e.clientX, e.clientY) ? 'pointer' : 'grab';
  };
  const onKey = (e) => {
    if(['+','=','-'].includes(e.key)){e.preventDefault();api.zoom(e.key==='-'?1.25:.8);return;}
    const m = {ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08]}[e.key];
    if (!m) return;
    e.preventDefault(); flight = null; followState(false); userMoved = true;
    const off = camera.position.clone().sub(controls.target); _sp.setFromVector3(off);
    _sp.theta += m[0]; _sp.phi = clamp(_sp.phi + m[1], controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(off.setFromSpherical(_sp)); camera.lookAt(controls.target); controls.update(); requestRender();
  };
  const onLost = (e) => { e.preventDefault(); lost = true; if (raf) cancelAnimationFrame(raf); raf = 0; onError && onError(new Error('WebGL context lost')); };
  const onVis = () => { last = 0; if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; } else requestRender(); };
  const onReduce = () => { reduced = mqReduce.matches; controls.enableDamping = !reduced; if (reduced) { if(flight) applyView(flight.toT, flight.toDir, flight.toD); flight = null; if(todTween) { Object.assign(cur,cloneState(TOD[todName])); applyTod(); todTween=null; } } last = 0; requestRender(); };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('keydown', onKey); canvas.addEventListener('webglcontextlost', onLost);
  controls.addEventListener('change', requestRender); controls.addEventListener('start', () => { followState(false); userMoved = true; flight = null; requestRender(); });
  document.addEventListener('visibilitychange', onVis); mqReduce.addEventListener && mqReduce.addEventListener('change', onReduce);
  const ro = new ResizeObserver(resize); ro.observe(container);

  const api = {
    select(id) { if (!disposed) selectIsland(id); },
    reset() { if (disposed) return; userMoved=false;arriving=false;selectIsland(null); },
    setTime(name) {
      if (!TOD[name] || disposed) return;
      todName = name;
      if (reduced) { Object.assign(cur, cloneState(TOD[name])); applyTod(); todTween = null; } else todTween = {from: cloneState(cur), k: 0};
      requestRender();
    },
    setMotion(v) { motion = !!v; if(!motion)avatar.step(simT,false); last = 0; requestRender(); },
    followWalker(value=true) { userMoved=true;followDistance=6;followState(value); if(value) { const t=avatar.group.position.clone();t.y+=avatar.height*avatarScale*.5;const h=avatar.group.rotation.y;const dir=new THREE.Vector3(Math.sin(h)*.85+Math.cos(h)*.22,.58,Math.cos(h)*.85-Math.sin(h)*.22).normalize();flyTo(t,followDistance,false,dir); } requestRender(); },
    zoom(factor) { if(disposed)return;userMoved=true;const distance=clamp(camera.position.distanceTo(controls.target)*factor,following?3.5:controls.minDistance,controls.maxDistance);if(following)followDistance=distance;flyTo(controls.target,distance,false); },
    setFlows(v) { flows = !!v; flowMesh.visible = flows; if (flows) updateFlow(0); requestRender(); },
    setVisible(v) { visible = !!v; if (visible) { last = 0; resize(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    getStats() {
      const i = renderer.info;
      return {drawCalls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, revision: THREE.REVISION, instances: totalInst, instancedMeshes: pickables.length,
        layout:{radius:R,pathWidth:PATH_WIDTH,bridgeWidth:BRIDGE_WIDTH,panEnabled:controls.enablePan},cameraDistance:camera.position.distanceTo(controls.target),cameraPosition: camera.position.toArray(), cameraTarget: controls.target.toArray(), walker:{name:data.avatar.name,distance:walkingDistance,position:avatar.group.position.toArray(),kind:walkerSample.kind,from:walkerSample.from,to:walkerSample.to,routeLength:tour.length,following,routeNodes:network.nodes.length}, frames, motion: effMotion(), reducedMotion: reduced, flows, time: todName, selected, visible, activeAnimations: active.slice(), pixelRatio: renderer.getPixelRatio(), contextLost: lost};
    },
    dispose() {
      if (disposed) return; disposed = true;
      if (raf) cancelAnimationFrame(raf); raf = 0; ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('keydown', onKey); canvas.removeEventListener('webglcontextlost', onLost);
      document.removeEventListener('visibilitychange', onVis); mqReduce.removeEventListener && mqReduce.removeEventListener('change', onReduce);
      controls.dispose();
      pickables.forEach((m) => m.dispose()); flowMesh.dispose();
      Object.values(geos).forEach((g) => g.dispose()); Object.values(mats).forEach((m) => m.dispose());
      disp.forEach((o) => o.dispose()); waterMat.dispose(); water.geometry.dispose(); ring.geometry.dispose(); ringMat.dispose(); flowMat.dispose();
      avatar.dispose();walkerBadge.remove();renderer.dispose(); canvas.remove(); overlay.remove();
    },
  };

  resize();
  if (frames === 0) requestRender();
  return api;
}
