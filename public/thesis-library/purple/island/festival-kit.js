// Tarshar 研究同樂島：草地園區的佈景、攤位與地標（純示意佈置，不代表任何研究進度或結果）
import * as THREE from './vendor/three.module.js';

export const FEST = {
  cream: '#fff1d4', paper: '#fffaf0', coral: '#f2866b', orange: '#f6a35d', berry: '#b3507f', mint: '#8fd3b6',
  gold: '#f6c555', violet: '#b79bd8', wood: '#c99a6b', woodD: '#9a6b45', dark: '#6e5a4a', warm: '#ffd88a',
  skin: '#f6d3b8', lawn: '#a9d18a', path: '#f8e6c4', stone: '#efe4d0',
};
const POP = [FEST.coral, FEST.gold, FEST.berry, FEST.mint, FEST.violet, FEST.orange];
const GREENS = ['#7fb878', '#93c685', '#6aa675', '#a6d08f'];
const AWN = [[FEST.coral, FEST.cream], [FEST.berry, FEST.cream], [FEST.mint, FEST.paper], [FEST.gold, FEST.paper], [FEST.violet, FEST.cream], [FEST.orange, FEST.cream]];

export const GROUND_Y = 0.70;
export const CARPET_Y = 0.715;
export const LAWN = {x: 0, z: 2, rx: 13.6, rz: 11};
export const ARCH = {x: 0, z: 11.0};
export const WHEEL = {x: -11, z: 0.8, ry: 0.5, r: 1.6, hub: 3.0};
export const STAGE = {x: 0, z: -6, r: 2.35, deck: GROUND_Y + 0.42};
export const BOOTH_SLOTS = [[-1.25, -0.85], [1.25, -0.85], [-1.25, 1.05], [1.25, 1.05], [0, -1.55], [0, 1.6]];
// 舊 MODELS 縮小成展示物（目標高度約 0.6）
export const BOOTH_SCALE = {lighthouse: 0.21, bookshelf: 0.27, books: 0.44, lab: 0.3, desk: 0.42, pavilion: 0.33, dock: 0.36, compass: 0.42, house: 0.4};
export const FESTIVAL_BOUNDS = {min: [-13.9, 0, -9.3], max: [13.9, 7.0, 13.2]};

const rnd = (r) => r();

export function buildFestival(ctx) {
  const {L, B, xf, mix, mulberry32, modelFn, modelKey, islands, network, WALK_Y, PATH_WIDTH, BRIDGE_WIDTH, ringPoint} = ctx;
  const rng = mulberry32(2026);
  const W = B(L, -1, null);
  const occ = [];
  const free = (x, z, r) => occ.every((o) => Math.hypot(o.x - x, o.z - z) > o.r + r);
  const inLawn = (x, z, k) => ((x - LAWN.x) / LAWN.rx) ** 2 + ((z - LAWN.z) / LAWN.rz) ** 2 < k * k;
  const local = (x, y, z, ry, s, own = -1, item = null) => B(L, own, xf(x, y, z, ry, s), item);
  const disc = (b, x, top, z, rx, rz, h, col, g) => b.part(g || 'disc', 'clay', x, top - h / 2, z, rx, h, rz, 0, col);
  const pennant = (b, x, y, z, w, h, ry, col) => b.part('prism', 'clay', x, y, z, w / 1.732, h / 1.5, 0.02, ry, col, Math.PI);
  const balloon = (b, x, y, z, r, col) => { b.sph(x, y, z, r, col, 'clay', 1.2); b.sph(x - r * 0.3, y + r * 0.35, z + r * 0.5, r * 0.22, '#ffffff'); };
  const P = CARPET_Y;

  // ---------- 大地：連續草地展場（橢圓丘 + 柔和階地 + 外圍草原與丘陵） ----------
  const {x: lx, z: lz, rx: LRX, rz: LRZ} = LAWN;
  W.part('disc', 'clay', lx, -0.06, lz, 130, 0.12, 130, 0, '#b6dc9d');
  W.part('mound', 'clay', lx, 0.07, lz, LRX * 1.3, 0.14, LRZ * 1.3, 0, '#a9d391');
  W.part('mound', 'clay', lx, 0.18, lz, LRX * 1.16, 0.36, LRZ * 1.16, 0, '#9ccb83');
  W.part('mound', 'clay', lx, 0.35, lz, LRX, 0.70, LRZ, 0, FEST.lawn);
  // 草地上的淡色大塊花紋（高度略有差異避免重疊閃爍）
  [[-3.5, 8.2, 5.2, 3.0, '#b7da97'], [4.6, -3.6, 3.6, 2.4, '#b2d792'], [-9.4, 5.4, 3.0, 2.2, '#b9db9a'], [9.2, 5.8, 3.2, 2.2, '#b4d894']].forEach(([x, z, rx, rz, c], k) =>
    disc(W, x, GROUND_Y + 0.004 + k * 0.001, z, rx, rz, 0.01, c));
  // 遠景丘陵與樹林背景
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2 + rnd(rng) * 0.2, d = 1.55 + (k % 3) * 0.22 + rnd(rng) * 0.12;
    const hx = lx + Math.cos(a) * LRX * d, hz = lz + Math.sin(a) * LRZ * d;
    const sy = 2.6 + rnd(rng) * 3.4, col = ['#b4d79c', '#a3cc98', '#9fc7a6', '#b9d9ae'][k % 4];
    W.part('hillS', 'clay', hx, -sy * 0.25, hz, 8 + rnd(rng) * 6, sy, 7 + rnd(rng) * 5, 0, col);
  }
  const tree = (x, z, s, y, kind) => {
    W.cyl(x, y, z, 0.06 * s, 0.34 * s, FEST.woodD);
    if (kind === 1) {
      W.cone(x, y + 0.2 * s, z, 0.3 * s, 0.5 * s, GREENS[2]); W.cone(x, y + 0.5 * s, z, 0.23 * s, 0.42 * s, GREENS[0]); W.cone(x, y + 0.78 * s, z, 0.15 * s, 0.32 * s, GREENS[1]);
    } else {
      const g = kind === 2 ? '#f2a99a' : GREENS[Math.floor(rnd(rng) * 4)];
      W.sph(x, y + 0.6 * s, z, 0.32 * s, g); W.sph(x + 0.12 * s, y + 0.85 * s, z + 0.03 * s, 0.22 * s, mix(g, '#ffffff', 0.15));
    }
  };
  // 草地外的樹林帶
  for (let k = 0; k < 78; k++) {
    const t = (k / 78) * Math.PI * 2 + (rnd(rng) - 0.5) * 0.05, f = 1.2 + rnd(rng) * 0.4;
    tree(lx + Math.cos(t) * LRX * f, lz + Math.sin(t) * LRZ * f, 2.2 + rnd(rng) * 1.6, 0, rnd(rng) < 0.35 ? 1 : 0);
  }

  // ---------- 規劃占位（避免亂撒物件擋路） ----------
  islands.forEach((d) => occ.push({x: d.x, z: d.z, r: 3.4}));
  occ.push({x: STAGE.x, z: STAGE.z, r: 3.7}, {x: WHEEL.x, z: WHEEL.z, r: 3.2}, {x: ARCH.x, z: ARCH.z, r: 2.8}, {x: 0, z: 9, r: 1.5}, {x: 0, z: 7, r: 1.3});

  // ---------- 五區：地毯色塊、步道、圓形接點（不再有六角地基） ----------
  const booths = [];
  let gi = 0;
  islands.forEach((isl, i) => {
    const own = i, ic = new THREE.Color(isl.color), zb = B(L, own, xf(isl.x, 0, isl.z, 0, 1), null), r2 = mulberry32(1023 + i * 97);
    disc(zb, 0, GROUND_Y + 0.008 + i * 0.0015, 0, 3.05, 3.0, 0.02, mix(FEST.lawn, isl.color, 0.2));
    disc(zb, 0, GROUND_Y + 0.0125 + i * 0.0015, 0, 2.45, 2.4, 0.02, mix('#cfe6ad', isl.color, 0.1));
    // 步道（沿用舊 12 點拓撲）
    for (let k = 0; k < 12; k++) {
      const a = ringPoint(k), b = ringPoint((k + 1) % 12), len = Math.hypot(b.x - a.x, b.z - a.z);
      zb.part('box', 'clay', (a.x + b.x) / 2, (GROUND_Y + WALK_Y) / 2, (a.z + b.z) / 2, PATH_WIDTH + 0.1, WALK_Y - GROUND_Y, len + 0.02, Math.atan2(b.x - a.x, b.z - a.z), FEST.path);
      disc(zb, a.x, WALK_Y - 0.003, a.z, (PATH_WIDTH + 0.1) / 2, (PATH_WIDTH + 0.1) / 2, 0.06, FEST.path);
      if (k % 2 === 0) { // 圓形花飾接點 + 彩燈柱
        disc(zb, a.x, WALK_Y + 0.004, a.z, 0.5, 0.5, 0.05, isl.color);
        disc(zb, a.x, WALK_Y + 0.008, a.z, 0.33, 0.33, 0.03, FEST.paper);
        disc(zb, a.x, WALK_Y + 0.012, a.z, 0.12, 0.12, 0.03, FEST.gold);
        const ox = a.x * 1.13, oz = a.z * 1.13;
        zb.cyl(ox, GROUND_Y, oz, 0.022, 0.62, FEST.dark);
        zb.sph(ox, GROUND_Y + 0.66, oz, 0.06, POP[(k / 2 + i) % 6], 'glow');
      }
    }
    // 中心花壇與彩旗
    disc(zb, 0, P + 0.01, 0, 0.5, 0.5, 0.04, mix(FEST.coral, isl.color, 0.4));
    disc(zb, 0, P + 0.02, 0, 0.36, 0.36, 0.04, FEST.cream);
    zb.cyl(0, P, 0, 0.018, 1.45, FEST.dark); zb.sph(0, P + 1.48, 0, 0.05, FEST.gold);
    [0, 1, 2, 3].forEach((q) => pennant(zb, 0.02, P + 1.38 - q * 0.17, 0, 0.3 - q * 0.03, 0.16, Math.PI / 2, [isl.color, FEST.cream, FEST.gold, FEST.coral][q]));
    for (let q = 0; q < 8; q++) { const t = q * Math.PI / 4; zb.sph(Math.cos(t) * 0.42, P + 0.06, Math.sin(t) * 0.42, 0.06, POP[(q + i) % 6]); }

    // 15 項各自獨立的展示攤位
    (isl.items || []).forEach((it, n) => {
      const [sx, sz] = BOOTH_SLOTS[n % BOOTH_SLOTS.length], wx = isl.x + sx, wz = isl.z + sz, ry = Math.atan2(-sx, 3) * 0.6;
      const type = gi % 3, [c1, c2] = AWN[gi % AWN.length], plat = mix(FEST.cream, c1, 0.18);
      gi++;
      const bb = local(wx, P, wz, ry, 1, own, it.id);
      bb.box(0, 0, 0, 0.78, 0.04, 0.72, plat);
      bb.cyl(0, 0.04, -0.03, 0.26, 0.09, FEST.cream); bb.cyl(0, 0.13, -0.03, 0.22, 0.015, c1);
      const mk = modelKey(it.model), s = BOOTH_SCALE[mk] || 0.38;
      modelFn(mk)(B(L, own, xf(wx, P + 0.145, wz - 0.03 * Math.cos(ry), ry, s), it.id), r2, ic);
      bb.box(0, 0.04, 0.3, 0.6, 0.15, 0.15, c1); bb.sph(-0.12, 0.2, 0.3, 0.035, FEST.gold); bb.sph(0.1, 0.2, 0.3, 0.035, c2);
      balloon(bb, 0.34, 0.5, 0.3, 0.08, POP[(gi + 2) % 6]); bb.cyl(0.34, 0.04, 0.3, 0.004, 0.4, FEST.dark);
      if (type === 2) { // 陽傘型
        bb.cyl(0, 0.04, -0.3, 0.018, 0.8, FEST.dark);
        [[0.55, 0.1, 0.84, c1], [0.473, 0.08, 0.94, c2], [0.407, 0.07, 1.02, c1]].forEach(([r, h, y, c]) => bb.part('band', 'clay', 0, y + h / 2, -0.05, r, h, r, 0, c));
        bb.sph(0, 1.1, -0.05, 0.035, FEST.gold);
      } else {
        for (const [px, pz] of [[-0.34, -0.3], [0.34, -0.3], [-0.34, 0.3], [0.34, 0.3]]) bb.cyl(px, 0.04, pz, 0.018, 0.78, FEST.woodD);
        if (type === 0) { // 斜面條紋遮棚
          for (let k = 0; k < 6; k++) {
            const c = k % 2 ? c2 : c1, x = -0.3 + 0.06 + k * 0.12;
            bb.slab(x, 0.86, -0.02, 0.12, 0.025, 0.78, c, 0, 0.22);
            bb.slab(x, 0.7, 0.365, 0.12, 0.08, 0.02, k % 2 ? c1 : c2);
          }
        } else { // 山形條紋遮棚
          for (let k = 0; k < 6; k++) {
            const c = k % 2 ? c2 : c1, z = -0.375 + 0.0625 + k * 0.125;
            bb.slab(-0.18, 0.88, z, 0.4, 0.025, 0.125, c, 0, 0, 0.45); bb.slab(0.18, 0.88, z, 0.4, 0.025, 0.125, c, 0, 0, -0.45);
          }
          bb.sph(0, 0.99, 0, 0.03, FEST.gold);
        }
        for (const bx of [-0.27, -0.09, 0.09, 0.27]) bb.sph(bx, 0.75, 0.37, 0.016, FEST.warm, 'glow');
      }
      // 掛牌（標題由 DOM 顯示，這裡只做空白牌）
      bb.box(0, 0.58, 0.36, 0.34, 0.12, 0.025, FEST.paper); bb.box(0, 0.58, 0.372, 0.3, 0.012, 0.005, c1); bb.sph(0, 0.64, 0.375, 0.022, FEST.gold);
      bb.cyl(-0.12, 0.7, 0.36, 0.005, 0.1, FEST.dark); bb.cyl(0.12, 0.7, 0.36, 0.005, 0.1, FEST.dark);
      booths.push({id: it.id, islandId: isl.id, x: wx, y: P + 1.25, z: wz, groundY: P});
    });
  });

  // ---------- 連接路（舊橋邊）：鋪色的人行路，不跨海 ----------
  for (const edge of network.edges.filter((e) => e.kind === 'bridge')) {
    const a = network.nodes[edge.a], b = network.nodes[edge.b], dx = b.x - a.x, dz = b.z - a.z, ry = Math.atan2(dx, dz), bl = B(L, Math.floor(edge.a / 12), null);
    for (let k = 0; k < 9; k++) {
      const t = (k + 0.5) / 9, top = WALK_Y - 0.004 + 0.1 * Math.sin(t * Math.PI), h = top - GROUND_Y;
      bl.part('box', 'clay', a.x + dx * t, GROUND_Y + h / 2, a.z + dz * t, BRIDGE_WIDTH, h, edge.length / 9 + 0.012, ry, k % 2 ? '#f6c9a6' : '#fff0cf');
    }
    for (const n of [a, b]) disc(bl, n.x, WALK_Y - 0.008, n.z, BRIDGE_WIDTH / 2 + 0.02, BRIDGE_WIDTH / 2 + 0.02, 0.06, '#f6c9a6');
  }

  // ---------- 入口：迎賓步道、拱門、燈串 ----------
  for (let k = 0; k < 11; k++) W.slab(0, GROUND_Y, 11.0 - 0.25 - k * 0.5, 0.84, 0.026, 0.5, k % 2 ? '#fbd9b8' : FEST.cream);
  for (const sg of [-1, 1]) {
    const ax = ARCH.x + sg * 2.15, az = ARCH.z;
    W.cyl(ax, GROUND_Y, az, 0.42, 0.14, FEST.stone);
    for (let k = 0; k < 8; k++) W.box(ax, GROUND_Y + 0.14 + k * 0.4, az, 0.5, 0.4, 0.5, k % 2 ? FEST.cream : FEST.coral);
    W.sph(ax, GROUND_Y + 3.45, az, 0.2, FEST.gold); W.cyl(ax, GROUND_Y + 3.4, az, 0.28, 0.06, FEST.berry);
    W.cyl(sg * 4.6 + ARCH.x, GROUND_Y, 9.4, 0.03, 2.0, FEST.dark); W.sph(sg * 4.6 + ARCH.x, GROUND_Y + 2.04, 9.4, 0.07, FEST.warm, 'glow');
    for (let k = 1; k < 8; k++) { // 拱門柱頂到燈柱的燈串
      const u = k / 8, x = ax + (sg * 4.6 + ARCH.x - ax) * u, z = az + (9.4 - az) * u, y = GROUND_Y + 3.3 + (2.0 - 3.3) * u - 0.35 * 4 * u * (1 - u);
      W.sph(x, y, z, 0.045, POP[k % 6], 'glow');
    }
  }
  W.box(ARCH.x, GROUND_Y + 2.1, ARCH.z, 4.3, 1.2, 0.24, FEST.coral);
  W.box(ARCH.x, GROUND_Y + 3.3, ARCH.z, 4.6, 0.12, 0.32, FEST.gold);
  for (let k = 0; k < 17; k++) { // 氣球拱
    const t = Math.PI * (k / 16), x = ARCH.x + Math.cos(t) * 2.2, y = GROUND_Y + 3.5 + Math.sin(t) * 0.95 + (k % 2) * 0.12;
    balloon(W, x, y, ARCH.z, 0.24, POP[k % 6]);
  }

  // ---------- 後方大舞台（彩色條紋大頂） ----------
  const {x: sx0, z: sz0, r: sr0, deck} = STAGE;
  W.part('disc', 'clay', sx0, GROUND_Y + 0.2, sz0, sr0 + 0.1, 0.4, sr0 + 0.1, 0, FEST.coral);
  W.part('disc', 'clay', sx0, deck - 0.01, sz0, sr0 - 0.12, 0.04, sr0 - 0.12, 0, FEST.cream);
  W.part('disc', 'clay', sx0, deck + 0.004, sz0, sr0 - 0.55, 0.012, sr0 - 0.55, 0, '#f9dcae');
  W.box(sx0, GROUND_Y, sz0 + sr0 + 0.28, 1.6, 0.2, 0.5, FEST.gold); W.box(sx0, GROUND_Y, sz0 + sr0 + 0.05, 1.4, 0.32, 0.4, FEST.cream);
  const eave = deck + 1.75;
  for (let k = 0; k < 6; k++) {
    const t = k * Math.PI / 3 + Math.PI / 6, px = sx0 + Math.sin(t) * (sr0 - 0.25), pz = sz0 + Math.cos(t) * (sr0 - 0.25);
    W.cyl(px, deck, pz, 0.075, eave - deck, k % 2 ? FEST.cream : FEST.coral); W.sph(px, eave + 0.03, pz, 0.1, FEST.gold);
  }
  let rr = 3.0, yy = eave;
  for (let k = 0; k < 5; k++) { const h = rr * 0.22; W.part('band', 'clay', sx0, yy + h / 2, sz0, rr, h, rr, 0, k % 2 ? FEST.cream : FEST.coral); yy += h; rr *= 0.86; }
  W.cone(sx0, yy, sz0, rr, 0.7, FEST.berry); W.cyl(sx0, yy + 0.7, sz0, 0.025, 0.55, FEST.dark);
  pennant(W, sx0 + 0.22, yy + 1.2, sz0, 0.4, 0.22, Math.PI / 2, FEST.gold);
  for (let k = 0; k < 22; k++) { const t = k * Math.PI * 2 / 22; pennant(W, sx0 + Math.sin(t) * 2.95, eave - 0.02, sz0 + Math.cos(t) * 2.95, 0.22, 0.25, t, POP[k % 6]); }
  W.box(sx0, deck, sz0 - sr0 + 0.4, 3.6, 1.45, 0.12, FEST.mint);
  W.part('cyl', 'clay', sx0, deck + 0.8, sz0 - sr0 + 0.5, 0.9, 0.05, 0.9, 0, FEST.gold, Math.PI / 2);
  W.part('cyl', 'clay', sx0, deck + 0.8, sz0 - sr0 + 0.54, 0.55, 0.05, 0.55, 0, FEST.coral, Math.PI / 2);
  for (const sg of [-1, 1]) { W.box(sx0 + sg * 1.75, deck, sz0 - 0.8, 0.42, 0.75, 0.36, FEST.dark); W.sph(sx0 + sg * 1.75, deck + 0.35, sz0 - 0.62, 0.11, '#a89684'); W.box(sx0 + sg * 1.1, deck, sz0 - 1.5, 0.3, 0.3, 0.3, FEST.violet); }
  W.cyl(sx0, deck, sz0 + 0.55, 0.012, 0.6, FEST.dark); W.sph(sx0, deck + 0.64, sz0 + 0.55, 0.04, FEST.dark);
  W.cyl(sx0, eave - 0.45, sz0 - 0.4, 0.008, 0.45, FEST.dark); W.sph(sx0, eave - 0.52, sz0 - 0.4, 0.2, FEST.gold, 'glow');
  for (let k = 0; k < 5; k++) W.sph(sx0 - 1.2 + k * 0.6, eave - 0.12, sz0 + 1.4, 0.05, POP[k % 6], 'glow');
  // 台上小表演者（示意）
  [[-0.6, 0], [0.6, 0.2], [0, -0.7]].forEach(([gx, gz], k) => { const g = local(sx0 + gx, deck, sz0 + gz, 0.2 * (k - 1), 1.3); g.cyl(0, 0, 0, 0.09, 0.2, POP[(k + 2) % 6]); g.sph(0, 0.31, 0, 0.075, FEST.skin); g.sph(0, 0.34, -0.012, 0.08, '#59463e', 'clay', 0.75); });

  // ---------- 摩天輪（靜態部分；旋轉輪體在 createFestivalLandmarks） ----------
  const wb = local(WHEEL.x, GROUND_Y, WHEEL.z, WHEEL.ry, 1), H = WHEEL.hub - GROUND_Y, foot = 1.25, legL = Math.hypot(foot, H);
  for (const zz of [-0.3, 0.3]) for (const sg of [-1, 1]) wb.part('box', 'clay', sg * foot / 2, H / 2, zz, 0.1, legL, 0.1, 0, FEST.coral, 0, sg * Math.atan(foot / H));
  wb.box(0, 0, 0.1, 3.4, 0.08, 1.6, FEST.cream); wb.box(0, 0.08, 1.15, 1.2, 0.1, 0.4, FEST.gold);
  wb.box(-1.6, 0.08, 0.7, 0.6, 0.55, 0.5, FEST.mint); wb.roof(-1.6, 0.63, 0.7, 0.8, 0.3, 0.65, FEST.coral);
  for (let k = 0; k < 6; k++) wb.sph(-1.55 + k * 0.62, 0.4, 0.95, 0.04, POP[k % 6], 'glow');

  // ---------- 咖啡車、野餐桌、氣球花束 ----------
  const cart = local(-5.4, GROUND_Y, 10.0, 0.15, 1);
  cart.box(0, 0.12, 0, 1.3, 0.55, 0.7, FEST.mint); cart.box(0, 0.67, 0, 1.34, 0.05, 0.74, FEST.cream);
  cart.win(0, 0.3, 0.355, 0.8, 0.22);
  for (const sg of [-1, 1]) { cart.part('cyl', 'clay', sg * 0.66, 0.14, 0, 0.14, 0.06, 0.14, 0, FEST.dark, 0, Math.PI / 2); cart.cyl(sg * 0.6, 0.67, 0.3, 0.018, 0.55, FEST.woodD); }
  for (let k = 0; k < 7; k++) cart.slab(-0.6 + 0.1 + k * 0.2, 1.22, 0, 0.2, 0.025, 0.85, k % 2 ? FEST.cream : FEST.coral, 0, 0.18);
  cart.cyl(0.4, 0.72, 0.34, 0.06, 0.1, FEST.paper); cart.cyl(0.25, 0.72, 0.34, 0.06, 0.1, FEST.paper); cart.sph(-0.4, 0.8, 0.3, 0.08, FEST.berry);
  occ.push({x: -5.4, z: 10, r: 1.0});
  const table = (x, z, ry, k) => {
    const t = local(x, GROUND_Y, z, ry, 1), c = POP[k % 6];
    t.box(0, 0.26, 0, 1.0, 0.05, 0.52, FEST.wood); t.box(0, 0.31, 0, 0.5, 0.012, 0.52, c);
    for (const sg of [-1, 1]) { t.box(sg * 0.4, 0, 0, 0.05, 0.26, 0.46, FEST.woodD); t.box(0, 0.15, sg * 0.4, 0.9, 0.04, 0.16, FEST.woodD); t.box(sg * 0.4, 0, sg * 0.4, 0.05, 0.15, 0.12, FEST.woodD); }
    t.cyl(-0.2, 0.32, 0.05, 0.07, 0.015, FEST.paper); t.cyl(0.2, 0.32, -0.05, 0.07, 0.015, FEST.paper); t.cyl(0.05, 0.32, 0.1, 0.035, 0.07, FEST.cream);
    t.cyl(0, 0.3, -0.2, 0.018, 0.8, FEST.dark); t.cone(0, 1.0, -0.2, 0.66, 0.24, c); t.part('band', 'clay', 0, 1.0, -0.2, 0.42, 0.05, 0.42, 0, FEST.cream); t.sph(0, 1.26, -0.2, 0.04, FEST.gold);
    occ.push({x, z, r: 1.1});
  };
  table(5.2, 10.2, -0.2, 0); table(8.2, 8.6, 0.3, 2); table(-8.2, 8.3, -0.3, 3);
  const bouquet = (x, z, n) => {
    const b = local(x, GROUND_Y, z, 0, 1);
    b.cyl(0, 0, 0, 0.06, 0.05, FEST.dark);
    for (let k = 0; k < n; k++) { const a = k * 2.4, hh = 0.9 + (k % 3) * 0.28, ox = Math.cos(a) * 0.22, oz = Math.sin(a) * 0.22; b.cyl(0, 0.05, 0, 0.004, hh, FEST.dark); balloon(b, ox, 0.1 + hh + 0.16, oz, 0.19, POP[k % 6]); }
    occ.push({x, z, r: 0.5});
  };
  [[-2.6, 10.3, 6], [2.6, 10.3, 6], [-4.6, -4.4, 5], [4.6, -4.4, 5], [-7.3, 9.0, 4], [7.0, 6.6, 4], [-8.9, -2.2, 4], [9.2, -2.2, 4]].forEach(([x, z, n]) => bouquet(x, z, n));

  // ---------- 小客人（示意，不代表研究人流） ----------
  const guest = (x, z, ry, i) => {
    const b = local(x, GROUND_Y, z, ry, 1.25), shirt = POP[i % 6], pants = ['#5b78a8', '#6e5a4a', '#3f4a6b', '#7a8a6a'][i % 4], hair = ['#59463e', '#2f2622', '#a9753a', '#c7a56a'][i % 4];
    b.cyl(-0.04, 0, 0, 0.035, 0.14, pants); b.cyl(0.04, 0, 0, 0.035, 0.14, pants);
    b.cyl(0, 0.13, 0, 0.09, 0.22, shirt); b.sph(0, 0.4, 0, 0.08, FEST.skin); b.sph(0, 0.43, -0.012, 0.085, hair, 'clay', 0.75);
    b.sph(-0.105, 0.25, 0, 0.03, FEST.skin); b.sph(0.105, 0.25, 0, 0.03, FEST.skin);
    if (i % 3 === 0) { b.cyl(0.105, 0.25, 0, 0.004, 0.3, FEST.dark); balloon(b, 0.105, 0.66, 0, 0.09, POP[(i + 2) % 6]); }
  };
  [[-2.2, -3.55, 0], [-0.9, -3.45, 0.1], [0.7, -3.6, -0.1], [2.0, -3.5, 0.2], [-3.9, 9.2, 0.4], [-6.6, 9.4, -0.5], [-5.0, 8.3, 0.2], [4.0, 9.3, -0.3], [6.6, 9.8, 0.5], [-1.7, 9.0, 0.1], [1.6, 8.8, -0.2],
    [-9.6, 2.2, 0.8], [-9.5, -1.2, 0.5], [9.8, 3.0, -0.6], [9.6, -1.0, -0.8]].forEach(([x, z, ry], i) => guest(x, z, ry, i));

  // ---------- 園內樹群、灌木與花 ----------
  [[-8.2, -4.2], [8.4, -4.0], [-6.0, -5.8], [6.0, -5.8], [-9.4, 6.4], [9.6, 5.8], [-9.0, 8.8], [9.0, 8.8], [-11.8, -3.6], [11.9, -3.2]].forEach(([gx, gz], gk) => {
    for (let k = 0; k < 5; k++) { const a = k * 1.9 + gk, d = k ? 0.7 + rnd(rng) * 0.5 : 0; tree(gx + Math.cos(a) * d, gz + Math.sin(a) * d, 1.2 + rnd(rng) * 0.7, GROUND_Y, (k + gk) % 4 === 0 ? 1 : (k + gk) % 5 === 0 ? 2 : 0); }
    occ.push({x: gx, z: gz, r: 1.5});
  });
  for (let k = 0; k < 44; k++) { // 緣邊內側的樹
    const t = (k / 44) * Math.PI * 2 + rnd(rng) * 0.08, f = 0.9 + rnd(rng) * 0.05, x = lx + Math.cos(t) * LRX * f, z = lz + Math.sin(t) * LRZ * f;
    if (!free(x, z, 0.5) || Math.abs(x - ARCH.x) < 3.4 && z > 9.5) continue;
    tree(x, z, 1.0 + rnd(rng) * 0.6, GROUND_Y, rnd(rng) < 0.3 ? 1 : 0);
  }
  const FL = [FEST.coral, FEST.gold, FEST.berry, FEST.violet, '#fff6e8'];
  for (let t = 0, n = 0; n < 120 && t < 1600; t++) {
    const x = lx + (rnd(rng) * 2 - 1) * LRX * 0.95, z = lz + (rnd(rng) * 2 - 1) * LRZ * 0.95;
    if (!inLawn(x, z, 0.92) || !free(x, z, 0.1)) continue;
    n++; W.sph(x, P + 0.02, z, 0.07, GREENS[n % 4], 'clay', 0.5); W.sph(x, P + 0.07, z, 0.045, FL[n % 5]);
  }
  return {booths, bounds: FESTIVAL_BOUNDS};
}

// ---------- 不進 InstancedMesh 的地標：拱門文字牌與會轉動的摩天輪 ----------
function archTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#f6906f'); grd.addColorStop(1, '#e8704f');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = '#fff1d4'; g.lineWidth = 10; g.strokeRect(14, 14, 996, 228);
  g.fillStyle = '#f6c555';
  for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(40 + i * 32.7, 14, 6, 0, 6.283); g.fill(); g.beginPath(); g.arc(40 + i * 32.7, 242, 6, 0, 6.283); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#fff8e8'; g.font = '900 118px "Avenir Next","Arial Black",system-ui,sans-serif'; g.fillText('TARSHAR', 512, 98);
  g.fillStyle = '#ffe08a'; g.font = '700 50px "Avenir Next",system-ui,sans-serif'; g.fillText('RESEARCH ISLAND', 512, 195);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createFestivalLandmarks(scene) {
  const own = [], track = (o) => { own.push(o); return o; };
  const group = new THREE.Group(); scene.add(group);
  // 拱門文字牌（前後各一面，從後面看也能讀）
  const tex = track(archTexture()), signMat = track(new THREE.MeshBasicMaterial({map: tex, toneMapped: false})), signGeo = track(new THREE.PlaneGeometry(3.9, 0.975));
  const y = GROUND_Y + 2.7;
  const front = new THREE.Mesh(signGeo, signMat); front.position.set(ARCH.x, y, ARCH.z + 0.125);
  const back = new THREE.Mesh(signGeo, signMat); back.position.set(ARCH.x, y, ARCH.z - 0.125); back.rotation.y = Math.PI;
  group.add(front, back);
  // 摩天輪
  const mat = (c, o) => track(new THREE.MeshStandardMaterial({color: c, roughness: 0.8, ...o}));
  const rimG = track(new THREE.TorusGeometry(1, 0.035, 8, 56)), cylG = track(new THREE.CylinderGeometry(1, 1, 1, 8)), boxG = track(new THREE.BoxGeometry(1, 1, 1)), coneG = track(new THREE.ConeGeometry(1, 1, 8)), sphG = track(new THREE.SphereGeometry(1, 14, 10));
  const white = mat(FEST.paper), coral = mat(FEST.coral), gold = mat(FEST.gold);
  const wheel = new THREE.Group(); wheel.position.set(WHEEL.x, WHEEL.hub, WHEEL.z); wheel.rotation.y = WHEEL.ry; group.add(wheel);
  const rot = new THREE.Group(); wheel.add(rot);
  const R = WHEEL.r, N = 10, pivots = [];
  for (const zs of [-0.18, 0.18]) {
    const rim = new THREE.Mesh(rimG, white); rim.scale.setScalar(R); rim.position.z = zs; rot.add(rim);
    const inner = new THREE.Mesh(rimG, coral); inner.scale.setScalar(R * 0.45); inner.position.z = zs; rot.add(inner);
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2, sp = new THREE.Mesh(cylG, white);
      sp.scale.set(0.018, R, 0.018); sp.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, zs); sp.rotation.z = a - Math.PI / 2; rot.add(sp);
    }
  }
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2, pv = new THREE.Group(); pv.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    const cab = new THREE.Mesh(boxG, mat(POP[k % 6])); cab.scale.set(0.34, 0.26, 0.4); cab.position.y = -0.2;
    const roof = new THREE.Mesh(coneG, mat(FEST.cream)); roof.scale.set(0.27, 0.14, 0.3); roof.position.y = -0.04;
    const rod = new THREE.Mesh(cylG, mat(FEST.dark)); rod.scale.set(0.01, 0.1, 0.01); rod.position.y = 0.02;
    pv.add(cab, roof, rod); rot.add(pv); pivots.push(pv);
  }
  const hub = new THREE.Mesh(sphG, gold); hub.scale.setScalar(0.17); wheel.add(hub);
  const axle = new THREE.Mesh(cylG, coral); axle.rotation.x = Math.PI / 2; axle.scale.set(0.06, 0.5, 0.06); wheel.add(axle);
  group.traverse((o) => { if (o.isMesh && o !== front && o !== back) o.castShadow = true; });
  const update = (t) => { rot.rotation.z = -t * 0.11; for (const p of pivots) p.rotation.z = -rot.rotation.z; };
  update(0);
  return {update, dispose() { group.removeFromParent(); own.forEach((o) => o.dispose && o.dispose()); }};
}
