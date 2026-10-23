// 五島論文智能島：圖書館風開放剖面建築零件（只用 scene.js 的 B 零件收集器，無外部 import、無網路）
// 腳印 x±1.18, z±.72，高度 ≤1.6，正面 +z 敞開、無頂蓋；所有隨機只用傳入的 rng。
const F = 0.05; // 地板頂面高度，所有家具從這裡起算
const P = {
  stone: '#efe3cb', stoneD: '#d8c9a8', page: '#fbf3dc', floor: '#e3d2ab',
  walnut: '#7b4f33', walnutL: '#97663f', walnutD: '#5f3c27',
  green: '#2f5d48', brass: '#c4a04e', dark: '#4a4036', warm: '#ffd88a', pot: '#b78b66', cork: '#cfa873',
  fabric: ['#b4a690', '#9fae9c', '#b9a09a', '#a2a7b3'],
  plant: ['#6f9a6b', '#86ae79', '#5c8a63'],
  spines: ['#8c4b3c', '#5f7a62', '#d9c9a3', '#6d7f8f', '#a9714f', '#e8dcc0', '#7a5c7e', '#c8a46a', '#4f6b7a'],
};
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
// 把主題色調淡成低彩度，避免搶走暖奶油基調
const tint = (a, hex, k) => (a && a.clone ? a.clone().lerp(a.clone().set(hex), k) : hex);

// 後牆、側牆片、牆角石柱、簷口（簷口只在後緣，不遮住家具）
function shell(b) {
  b.slab(0, 0, 0, 2.36, F, 1.44, P.floor);
  b.slab(0, F, 0.69, 2.36, 0.02, 0.06, P.stoneD);
  b.slab(0, F, -0.695, 2.36, 1.4, 0.05, P.stone);
  b.slab(0, F + 1.4, -0.67, 2.36, 0.07, 0.1, P.stoneD);
  for (const sx of [-1, 1]) {
    b.slab(sx * 1.16, F, -0.38, 0.04, 1.2, 0.6, P.stone);
    b.slab(sx * 1.16, F + 1.2, -0.38, 0.06, 0.04, 0.64, P.stoneD);
    b.slab(sx * 1.08, F, -0.6, 0.2, 0.06, 0.2, P.stoneD);
    b.cyl(sx * 1.08, F + 0.06, -0.6, 0.08, 1.28, P.stone);
    b.slab(sx * 1.08, F + 1.34, -0.6, 0.2, 0.07, 0.2, P.stoneD);
  }
}

// 胡桃木書架：(x,z)=貼牆側中心；o: 0 面向+z、1 面向+x（貼左牆）、-1 面向-x（貼右牆）
function shelf(b, rng, x, z, w, h, d, o) {
  const p = (u, v) => (o === 0 ? [x + u, z + v] : o === 1 ? [x + v, z - u] : [x - v, z + u]);
  const put = (kind, u, y, v, ww, hh, dd, c) => {
    const [px, pz] = p(u, v);
    b[kind](px, y, pz, o === 0 ? ww : dd, hh, o === 0 ? dd : ww, c);
  };
  const n = Math.max(2, Math.round(h / 0.36)), step = (h - 0.035) / n, rowH = step - 0.035, dd = d - 0.05;
  put('slab', 0, F, 0.015, w, h, 0.03, P.walnutD);
  for (const sg of [-1, 1]) put('slab', sg * (w / 2 - 0.0275), F, d / 2, 0.055, h, d, P.walnut);
  for (let i = 0; i <= n; i++) put('slab', 0, F + i * step, d / 2, w, 0.035, d, P.walnutL);
  for (let i = 0; i < n; i++) {
    const y = F + i * step + 0.035, end = w / 2 - 0.065;
    let u = -w / 2 + 0.065;
    while (u < end) {
      const bw = 0.065 + rng() * 0.05;
      if (u + bw > end) break;
      if (rng() > 0.1) put('box', u + bw / 2, y, 0.03 + dd / 2, bw, rowH * (0.6 + rng() * 0.32), dd, pick(rng, P.spines));
      u += bw + 0.006;
    }
  }
}

// 深綠閱讀檯燈：黃銅底座＋綠燈罩＋暖光
function lamp(b, x, y, z, s) {
  b.cyl(x, y, z, 0.06 * s, 0.025 * s, P.brass);
  b.cyl(x, y + 0.02 * s, z, 0.013 * s, 0.2 * s, P.brass);
  b.cone(x, y + 0.17 * s, z, 0.11 * s, 0.11 * s, P.green);
  b.sph(x, y + 0.165 * s, z, 0.04 * s, P.warm, 'glow');
}

// 低彩度布椅：f 為面向角（面向 (sin f, cos f)）
function chair(b, x, z, f, c) {
  const s = Math.sin(f), k = Math.cos(f);
  b.part('box', 'clay', x, F + 0.2, z, 0.25, 0.05, 0.25, f, c);
  b.part('box', 'clay', x - s * 0.115, F + 0.33, z - k * 0.115, 0.25, 0.2, 0.04, f, c);
  for (const [ox, oz] of [[-0.095, -0.095], [0.095, -0.095], [-0.095, 0.095], [0.095, 0.095]]) {
    b.cyl(x + ox * k + oz * s, F, z - ox * s + oz * k, 0.02, 0.175, P.walnutD);
  }
}

// 木桌：回傳桌面高度（絕對 y）
function table(b, x, z, w, d, hgt, col) {
  b.slab(x, F + hgt - 0.045, z, w, 0.045, d, col);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(x + sx * (w / 2 - 0.06), F, z + sz * (d / 2 - 0.06), 0.03, hgt - 0.045, P.walnutD);
  return F + hgt;
}

// 攤開的書：奶油書頁兩側微微上翹
function openBook(b, x, y, z, w, ry, c) {
  const cs = Math.cos(ry), sn = Math.sin(ry);
  b.slab(x, y, z, w * 1.08, 0.015, w * 0.78, c, ry);
  for (const sg of [-1, 1]) {
    const off = sg * w * 0.25;
    b.part('box', 'clay', x + off * cs, y + 0.035, z - off * sn, w * 0.47, 0.018, w * 0.7, ry, P.page, 0, sg * 0.1);
  }
}

const pen = (b, x, y, z, ry, c) => b.part('cyl', 'clay', x, y + 0.012, z, 0.012, 0.15, 0.012, ry, c, 0, Math.PI / 2);

function stack(b, rng, x, y, z, n) {
  for (let i = 0; i < n; i++) b.box(x + (rng() - 0.5) * 0.03, y + i * 0.04, z, 0.2 - i * 0.012, 0.04, 0.15, pick(rng, P.spines), (rng() - 0.5) * 0.5);
}

function plant(b, x, y, z, s) {
  b.cyl(x, y, z, 0.08 * s, 0.12 * s, P.pot);
  b.sph(x, y + 0.2 * s, z, 0.12 * s, P.plant[0]);
  b.sph(x + 0.07 * s, y + 0.3 * s, z + 0.02 * s, 0.09 * s, P.plant[1]);
  b.sph(x - 0.06 * s, y + 0.28 * s, z - 0.03 * s, 0.08 * s, P.plant[2]);
}

// 後牆中央的石框暖光窗（兩側書架之間）
function backWindow(b, h) {
  b.slab(0, F + 0.35, -0.668, 0.64, h, 0.02, P.stoneD);
  b.win(0, F + 0.42, -0.652, 0.5, h - 0.14);
  b.slab(0, F + 0.35 + h * 0.5, -0.64, 0.5, 0.02, 0.015, P.brass);
  b.slab(0, F + 0.42, -0.64, 0.02, h - 0.14, 0.015, P.brass);
}

const rug = (b, a, x, z, w, d) => b.slab(x, F, z, w, 0.012, d, tint(a, '#d8c9a8', 0.55));

export const LIBRARY_MODELS = {
  // 圖書館門廳：挑高後書牆、服務台、卡片目錄櫃、前方兩根石柱
  cataloguehall(b, rng, a) {
    shell(b); rug(b, a, 0, 0.22, 1.5, 0.7);
    shelf(b, rng, -0.72, -0.67, 0.72, 1.4, 0.17, 0); shelf(b, rng, 0.72, -0.67, 0.72, 1.4, 0.17, 0);
    backWindow(b, 0.92);
    for (const sx of [-1, 1]) {
      b.slab(sx, F, 0.52, 0.2, 0.06, 0.2, P.stoneD);
      b.cyl(sx, F + 0.06, 0.52, 0.07, 1.2, P.stone);
      b.slab(sx, F + 1.26, 0.52, 0.2, 0.07, 0.2, P.stoneD);
    }
    b.slab(0, F + 1.33, 0.52, 2.2, 0.1, 0.16, P.stoneD); b.slab(0, F + 1.37, 0.605, 0.6, 0.05, 0.02, P.brass);
    // 服務台
    b.slab(0, F, 0.05, 1.0, 0.36, 0.3, P.walnut); b.slab(0, F + 0.36, 0.05, 1.08, 0.04, 0.36, P.stone);
    b.slab(0, F + 0.1, 0.208, 0.8, 0.02, 0.012, P.brass); b.slab(0, F + 0.22, 0.208, 0.8, 0.02, 0.012, P.brass);
    const dy = F + 0.4;
    openBook(b, -0.2, dy, 0.05, 0.3, 0.1, P.walnutD); pen(b, -0.02, dy, 0.1, 0.3, P.brass);
    lamp(b, 0.36, dy, 0.02, 1.2); b.sph(0.12, dy + 0.035, 0.1, 0.04, P.brass); b.cyl(0.12, dy, 0.1, 0.05, 0.01, P.brass);
    chair(b, 0, -0.28, 0, P.fabric[0]);
    // 卡片目錄櫃
    const cx = -0.82, cz = -0.3;
    b.slab(cx, F, cz, 0.5, 0.62, 0.3, P.walnut);
    for (let r = 0; r < 3; r++) for (const dx of [-0.12, 0.12]) {
      const y = F + 0.05 + r * 0.19;
      b.slab(cx + dx, y, cz + 0.16, 0.2, 0.15, 0.02, P.walnutL); b.sph(cx + dx, y + 0.06, cz + 0.18, 0.02, P.brass); b.slab(cx + dx, y + 0.1, cz + 0.172, 0.08, 0.025, 0.01, P.page);
    }
    stack(b, rng, cx, F + 0.62, cz, 2);
    // 右側小閱讀桌
    const ty = table(b, 0.78, 0.02, 0.5, 0.34, 0.3, P.walnutL);
    lamp(b, 0.92, ty, -0.04, 1); openBook(b, 0.7, ty, 0.02, 0.22, -0.2, P.green);
    chair(b, 0.78, 0.3, Math.PI, P.fabric[1]);
    plant(b, -0.95, F, 0.38, 1);
  },

  // 檔案館：三座通高書架、兩座矮書架、矮梯、閱讀桌與檔案盒
  archivehall(b, rng, a) {
    shell(b); rug(b, a, 0, 0.18, 1.1, 0.6);
    for (const x of [-0.76, 0, 0.76]) shelf(b, rng, x, -0.67, 0.7, 1.4, 0.17, 0);
    shelf(b, rng, -0.82, -0.3, 0.55, 0.8, 0.16, 0); shelf(b, rng, 0.82, -0.3, 0.55, 0.8, 0.16, 0);
    // 矮梯斜靠中央書架
    for (const sx of [0.34, 0.5]) b.part('box', 'clay', sx, F + 0.54, -0.45, 0.03, 1.1, 0.03, 0, P.walnutD, -0.22);
    for (let i = 0; i < 5; i++) { const y = F + 0.14 + i * 0.22; b.slab(0.42, y, -0.45 - (y - F - 0.54) * 0.224, 0.18, 0.03, 0.04, P.walnutL); }
    // 閱讀桌
    const ty = table(b, 0, 0.12, 0.8, 0.36, 0.3, P.walnutL);
    openBook(b, -0.15, ty, 0.12, 0.28, 0.1, P.walnutD); pen(b, 0.05, ty, 0.2, 0.4, P.brass);
    lamp(b, 0.3, ty, 0.06, 1.2); stack(b, rng, -0.32, ty, 0.05, 2);
    chair(b, -0.56, 0.12, Math.PI / 2, P.fabric[2]); chair(b, 0.56, 0.12, -Math.PI / 2, P.fabric[3]);
    // 檔案盒
    for (let i = 0; i < 2; i++) {
      const y = F + i * 0.18;
      b.box(-0.95, y, 0.42, 0.3, 0.15, 0.22, P.page); b.slab(-0.95, y + 0.15, 0.42, 0.33, 0.03, 0.25, P.stoneD); b.slab(-0.95, y + 0.06, 0.535, 0.1, 0.04, 0.012, P.brass);
    }
    b.box(0.95, F, 0.42, 0.3, 0.15, 0.22, P.stoneD); b.slab(0.95, F + 0.15, 0.42, 0.33, 0.03, 0.25, P.page);
  },

  // 數位館：長桌三部電腦、後方參考書牆、植物
  digitalhall(b, rng, a) {
    shell(b); rug(b, a, 0, 0.2, 1.7, 0.5);
    shelf(b, rng, -0.72, -0.67, 0.72, 1.1, 0.17, 0); shelf(b, rng, 0.72, -0.67, 0.72, 1.1, 0.17, 0);
    backWindow(b, 0.92);
    shelf(b, rng, -1.14, -0.4, 0.5, 0.8, 0.13, 1); shelf(b, rng, 1.14, -0.4, 0.5, 0.8, 0.13, -1);
    const ty = table(b, 0, 0.02, 2.0, 0.44, 0.3, P.walnutL);
    for (const x of [-0.62, 0, 0.62]) {
      b.slab(x, ty, -0.1, 0.16, 0.02, 0.12, P.dark); b.slab(x, ty + 0.02, -0.1, 0.04, 0.1, 0.03, P.dark);
      b.slab(x, ty + 0.1, -0.1, 0.4, 0.26, 0.04, P.dark); b.win(x, ty + 0.13, -0.075, 0.34, 0.2, 0);
      b.slab(x, ty, 0.1, 0.3, 0.02, 0.1, P.page); b.sph(x + 0.24, ty + 0.012, 0.1, 0.025, P.page);
      chair(b, x, 0.4, Math.PI, P.fabric[Math.floor(rng() * 4)]);
    }
    lamp(b, -0.92, ty, 0.04, 1.1); lamp(b, 0.92, ty, 0.04, 1.1);
    plant(b, -1.02, F, 0.25, 1.1); plant(b, 1.02, F, 0.25, 1.1);
  },

  // 寫作館：兩張木質書桌、打開的書與筆、閱讀燈、書牆與書架講桌
  writinghall(b, rng, a) {
    shell(b); rug(b, a, 0, 0.2, 1.9, 0.55);
    shelf(b, rng, -0.72, -0.67, 0.72, 1.4, 0.17, 0); shelf(b, rng, 0.72, -0.67, 0.72, 1.4, 0.17, 0);
    backWindow(b, 0.92);
    shelf(b, rng, -1.14, -0.4, 0.5, 1.0, 0.13, 1);
    // 中央書架講桌（斜面攤開書）
    b.cyl(0, F, -0.38, 0.045, 0.33, P.walnutD); b.slab(0, F + 0.3, -0.38, 0.18, 0.025, 0.14, P.walnut);
    b.part('box', 'clay', 0, F + 0.4, -0.38, 0.36, 0.03, 0.26, 0, P.walnutL, 0.35);
    for (const sg of [-1, 1]) b.part('box', 'clay', sg * 0.085, F + 0.435, -0.38, 0.16, 0.02, 0.22, 0, P.page, 0.35, sg * 0.1);
    for (const [i, x] of [-0.58, 0.58].entries()) {
      const ty = table(b, x, 0.0, 0.85, 0.46, 0.3, P.walnutL);
      openBook(b, x - 0.12, ty, 0.02, 0.3, i ? -0.15 : 0.15, i ? P.green : P.walnutD);
      pen(b, x + 0.08, ty, 0.1, 0.5, P.brass);
      lamp(b, x + 0.3, ty, -0.08, 1.2);
      stack(b, rng, x - 0.34, ty, -0.05, 2 + i);
      chair(b, x, 0.36, Math.PI, P.fabric[i ? 2 : 0]);
    }
    b.cyl(0.98, F, 0.3, 0.05, 0.1, P.dark); // 墨水瓶座
    b.cyl(0.98, F + 0.1, 0.3, 0.03, 0.05, P.green);
    plant(b, 1.02, F, 0.05, 1);
  },

  // 研討館：中央閱讀長桌、四周椅、背面書架與告示板
  seminarhall(b, rng, a) {
    shell(b); rug(b, a, 0, 0.08, 1.7, 0.85);
    shelf(b, rng, -0.74, -0.67, 0.68, 1.4, 0.17, 0); shelf(b, rng, 0.74, -0.67, 0.68, 1.4, 0.17, 0);
    // 告示板
    b.slab(0, F + 0.4, -0.665, 0.64, 0.7, 0.03, P.walnut); b.slab(0, F + 0.45, -0.645, 0.54, 0.6, 0.02, P.cork);
    const notes = [P.page, tint(a, '#fbf3dc', 0.5), '#e8dcc0', P.page, tint(a, '#fbf3dc', 0.6), '#d9c9a3'];
    notes.forEach((c, i) => {
      const nx = -0.16 + (i % 3) * 0.16, ny = F + 0.55 + Math.floor(i / 3) * 0.2;
      b.part('box', 'clay', nx, ny + 0.06, -0.628, 0.12, 0.14, 0.012, (rng() - 0.5) * 0.3, c); b.sph(nx, ny + 0.12, -0.618, 0.016, P.brass);
    });
    // 長桌與椅
    const ty = table(b, 0, 0.05, 1.5, 0.5, 0.3, P.walnutL);
    for (const x of [-0.5, 0, 0.5]) chair(b, x, -0.32, 0, P.fabric[Math.floor(rng() * 4)]);
    chair(b, -0.98, 0.05, Math.PI / 2, P.fabric[0]); chair(b, 0.98, 0.05, -Math.PI / 2, P.fabric[1]);
    chair(b, -0.4, 0.47, Math.PI, P.fabric[2]); chair(b, 0.4, 0.47, Math.PI, P.fabric[3]);
    openBook(b, -0.35, ty, 0.12, 0.26, 0.15, P.walnutD); openBook(b, 0.4, ty, 0.1, 0.26, -0.2, P.green);
    lamp(b, -0.62, ty, -0.08, 1.2); lamp(b, 0.66, ty, -0.08, 1.2);
    for (let i = 0; i < 3; i++) b.slab(-0.05 + i * 0.03, ty + i * 0.012, 0.0 + i * 0.015, 0.2, 0.012, 0.15, P.page, (rng() - 0.5) * 0.6);
    pen(b, 0.1, ty + 0.04, 0.15, 0.6, P.brass);
  },
};
