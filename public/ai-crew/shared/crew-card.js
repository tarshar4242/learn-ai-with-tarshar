/* 小組成員證：完全用 Canvas 畫出來。照片只在瀏覽器裡裁貼，不上傳。 */
(function () {
  const INK = "#173C32", CREAM = "#FFF9EE", PAPER = "#FFFFFF", GREEN = "#2F8F62", GREEN_DEEP = "#236E4B", SOFT = "#4E6B60", LINE = "#D9CFBC", MINT = "#EEF7F1";
  const BODY = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  const DISPLAY = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
  const NUM = '"Helvetica Neue", Arial, sans-serif';

  const imgCache = new Map();
  function loadImg(src) {
    if (!imgCache.has(src)) imgCache.set(src, new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = (e) => { imgCache.delete(src); rej(e); };
      i.src = src;
    }));
    return imgCache.get(src);
  }
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 40px "Noto Sans TC"'),
      document.fonts.load('700 40px "Noto Serif TC"')
    ]).catch(() => {});
  }

  function rrect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  function fitText(g, text, weight, family, size, maxW, minRatio = 0.45) {
    let f = size;
    g.font = `${weight} ${f}px ${family}`;
    while (g.measureText(text).width > maxW && f > size * minRatio) {
      f -= 2;
      g.font = `${weight} ${f}px ${family}`;
    }
    return f;
  }
  function label(g, zh, en, x, y, size) {
    g.fillStyle = INK;
    g.font = `700 ${size}px ${BODY}`;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText(zh, x, y);
    const w = g.measureText(zh).width;
    g.fillStyle = SOFT;
    g.font = `700 ${size * 0.6}px ${NUM}`;
    g.fillText(en, x + w + size * 0.4, y);
  }
  function clover(g, cx, cy, r) {
    g.save();
    g.fillStyle = GREEN;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.beginPath();
      g.arc(cx + dx * r * 0.55, cy + dy * r * 0.55, r * 0.62, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = GREEN_DEEP;
    g.lineWidth = r * 0.22;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(cx, cy + r * 0.2);
    g.lineTo(cx + r * 0.15, cy + r * 1.5);
    g.stroke();
    g.restore();
  }
  function signature(g, text, cx, y, size, align = "center") {
    g.font = `700 ${size}px ${NUM}`;
    const w = g.measureText(text).width;
    const total = w + size * 1.5;
    let x = align === "center" ? cx - total / 2 : cx;
    clover(g, x + size * 0.5, y - size * 0.35, size * 0.42);
    g.fillStyle = INK;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText(text, x + size * 1.5, y);
  }
  function photoCircle(g, photo, cx, cy, r, ringColor) {
    g.save();
    g.beginPath();
    g.arc(cx, cy, r + 18, 0, Math.PI * 2);
    g.fillStyle = ringColor;
    g.fill();
    g.beginPath();
    g.arc(cx, cy, r + 6, 0, Math.PI * 2);
    g.fillStyle = PAPER;
    g.fill();
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.clip();
    if (photo) {
      const pw = photo.naturalWidth || photo.width, ph = photo.naturalHeight || photo.height, side = Math.min(pw, ph);
      g.drawImage(photo, (pw - side) / 2, (ph - side) / 2, side, side, cx - r, cy - r, r * 2, r * 2);
    } else {
      g.fillStyle = MINT;
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      g.fillStyle = GREEN;
      g.beginPath(); g.arc(cx, cy - r * 0.25, r * 0.32, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx, cy + r * 0.75, r * 0.62, Math.PI, 0); g.fill();
    }
    g.restore();
  }
  function stripes(g, x, y, w, h, color) {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.fillStyle = color;
    g.globalAlpha = 0.16;
    for (let i = -h; i < w + h; i += 90) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i + 40, y);
      g.lineTo(x + i + 40 - h * 0.6, y + h);
      g.lineTo(x + i - h * 0.6, y + h);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  /* 橫式（1600×1000）：首頁縮圖、LINE 分享用 */
  async function renderBadge(card, meta) {
    await fontsReady();
    const photo = card.photo ? await loadImg(card.photo).catch(() => null) : null;
    const W = 1600, H = 1000, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const gc = card.groupColor || GREEN;
    g.fillStyle = CREAM; g.fillRect(0, 0, W, H);
    g.fillStyle = MINT; g.fillRect(0, 0, 660, H);
    stripes(g, 0, 0, 660, H, gc);
    g.fillStyle = gc; g.fillRect(0, 0, W, 26);
    g.strokeStyle = INK; g.lineWidth = 8;
    rrect(g, 16, 16, W - 32, H - 32, 40); g.stroke();

    g.fillStyle = INK; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.font = `700 30px ${DISPLAY}`;
    g.fillText(meta.workshop, 60, 96);
    g.fillStyle = SOFT; g.font = `700 22px ${NUM}`;
    g.fillText(meta.season, 60, 132);

    photoCircle(g, photo, 330, 540, 240, gc);

    g.fillStyle = PAPER;
    rrect(g, 700, 70, 840, 860, 34); g.fill();
    g.strokeStyle = INK; g.lineWidth = 5; g.stroke();

    g.fillStyle = INK; g.textAlign = "center";
    g.font = `700 92px ${DISPLAY}`;
    g.fillText("小組成員證", 1120, 190);
    g.fillStyle = SOFT; g.font = `700 24px ${NUM}`; g.letterSpacing = "6px";
    g.fillText("CREW MEMBER", 1120, 230);
    g.letterSpacing = "0px";

    rrect(g, 748, 270, 744, 200, 22); g.strokeStyle = LINE; g.lineWidth = 3; g.stroke();
    label(g, "姓名", "NAME", 776, 318, 26);
    g.fillStyle = INK; g.textAlign = "left";
    fitText(g, card.name, 900, BODY, 84, 690);
    g.fillText(card.name, 776, 432);

    rrect(g, 748, 500, 744, 190, 22); g.strokeStyle = LINE; g.lineWidth = 3; g.stroke();
    label(g, "小組", "GROUP", 776, 548, 26);
    g.fillStyle = gc; g.beginPath(); g.arc(796, 632, 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.textAlign = "left";
    fitText(g, card.groupName, 900, BODY, 64, 640);
    g.fillText(card.groupName, 830, 654);

    g.fillStyle = SOFT; g.font = `700 20px ${NUM}`; g.textAlign = "left";
    g.fillText("NO.", 776, 760);
    g.fillStyle = INK; g.font = `800 46px ${NUM}`;
    g.fillText(card.serial, 776, 810);
    g.fillStyle = SOFT; g.font = `700 20px ${NUM}`; g.textAlign = "right";
    g.fillText("ISSUED 發證日", 1492, 760);
    g.fillStyle = INK; g.font = `800 46px ${NUM}`;
    g.fillText(card.issued, 1492, 810);

    signature(g, meta.signature, 1120, 892, 26);
    return c;
  }

  /* 直式（1080×1920）：限時動態、傳給朋友用 */
  async function renderStory(card, meta) {
    await fontsReady();
    const photo = card.photo ? await loadImg(card.photo).catch(() => null) : null;
    const W = 1080, H = 1920, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const gc = card.groupColor || GREEN;
    g.fillStyle = CREAM; g.fillRect(0, 0, W, H);
    g.fillStyle = MINT; g.fillRect(0, 0, W, 900);
    stripes(g, 0, 0, W, 900, gc);
    g.fillStyle = gc; g.fillRect(0, 0, W, 30);

    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.font = `700 44px ${DISPLAY}`;
    g.fillText(meta.workshop, 540, 150);
    g.fillStyle = SOFT; g.font = `700 26px ${NUM}`; g.letterSpacing = "4px";
    g.fillText(meta.season, 540, 196);
    g.letterSpacing = "0px";

    photoCircle(g, photo, 540, 560, 270, gc);

    g.fillStyle = PAPER;
    rrect(g, 70, 900, 940, 880, 40); g.fill();
    g.strokeStyle = INK; g.lineWidth = 6; g.stroke();

    g.fillStyle = INK; g.textAlign = "center";
    g.font = `700 88px ${DISPLAY}`;
    g.fillText("小組成員證", 540, 1030);
    g.fillStyle = SOFT; g.font = `700 24px ${NUM}`; g.letterSpacing = "6px";
    g.fillText("CREW MEMBER", 540, 1072);
    g.letterSpacing = "0px";

    label(g, "姓名", "NAME", 130, 1160, 26);
    g.fillStyle = INK; g.textAlign = "left";
    fitText(g, card.name, 900, BODY, 96, 820);
    g.fillText(card.name, 130, 1280);

    g.strokeStyle = LINE; g.lineWidth = 3;
    g.beginPath(); g.moveTo(130, 1330); g.lineTo(950, 1330); g.stroke();

    label(g, "小組", "GROUP", 130, 1400, 26);
    g.fillStyle = gc; g.beginPath(); g.arc(150, 1478, 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK; g.textAlign = "left";
    fitText(g, card.groupName, 900, BODY, 66, 760);
    g.fillText(card.groupName, 186, 1500);

    g.beginPath(); g.moveTo(130, 1560); g.lineTo(950, 1560); g.stroke();

    g.fillStyle = SOFT; g.font = `700 20px ${NUM}`; g.textAlign = "left";
    g.fillText("NO.", 130, 1620);
    g.fillStyle = INK; g.font = `800 48px ${NUM}`;
    g.fillText(card.serial, 130, 1676);
    g.fillStyle = SOFT; g.font = `700 20px ${NUM}`; g.textAlign = "right";
    g.fillText("ISSUED 發證日", 950, 1620);
    g.fillStyle = INK; g.font = `800 48px ${NUM}`;
    g.fillText(card.issued, 950, 1676);

    g.fillStyle = INK; g.textAlign = "center"; g.font = `700 30px ${BODY}`;
    g.fillText(meta.slogan || "", 540, 1836);
    signature(g, meta.signature, 540, 1886, 24);
    return c;
  }

  window.CrewCard = { renderBadge, renderStory };
})();
