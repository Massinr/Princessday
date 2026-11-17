(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  var again = document.getElementById('again');
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var W, H, dpr, fs, cw, chh, cols, rows, ox, oy, Wg, Hg;
  var Hsc = 0, capPx = 0, capPlan = null, cap = [];
  var T = 0, last = 0;
  var hello = [], helloEnd = 8200;
  var parts = [], TF = 0, potLayer = null;
  var G = {}, F = {};
  var spark = [], petals = [];
  var FAMILY = '"JetBrains Mono","SF Mono",Menlo,Consolas,"Courier New",monospace';

  var SCR = '@#$%&*+=?!/\\<>[]{}0123456789ABCXYZ';
  var DUST = ".:'`,";
  var FL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var BODY = '.:-=+*#%@';
  var RRAMP = '.,:;=+*#%@&';
  var LRAMP = '.:;+*#%';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(a, b, c) {
    var h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
    h = (h ^ (h >>> 13)) >>> 0;
    return h;
  }
  function hsl(h, s, l) { return 'hsl(' + Math.round(h) + ',' + Math.round(s) + '%,' + Math.round(l) + '%)'; }
  function put(c, r, ch, col, t) {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    var x = t || ctx;
    x.fillStyle = col;
    x.fillText(ch, (c + 0.5) * cw, (r + 0.5) * chh + 0.5);
  }

  /* ---------- layout ---------- */
  function layout() {
    var b = stage.getBoundingClientRect();
    W = Math.max(200, Math.floor(b.width));
    H = Math.max(300, Math.floor(b.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    fs = clamp(Math.round(Math.min(W / 85, H / 52)), 9, 18);
    ctx.font = '700 ' + fs + 'px ' + FAMILY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    cw = ctx.measureText('M').width || fs * 0.6;
    chh = Math.round(fs * 1.2);
    cols = Math.floor(W / cw);
    rows = Math.floor(H / chh);
    Wg = cols * cw;
    Hg = rows * chh;
    ox = (W - Wg) / 2;
    oy = (H - Hg) / 2;
    potLayer = null;
    planCaption();
    buildHello();
    buildPot();
    buildFlower();
    buildCaption();
    if (reduce) T = TF + 20000;
  }

  /* ---------- the words ---------- */
  var GLYPH = {
    H: ['X...X', 'X...X', 'XXXXX', 'X...X', 'X...X'],
    E: ['XXXXX', 'X....', 'XXXX.', 'X....', 'XXXXX'],
    L: ['X....', 'X....', 'X....', 'X....', 'XXXXX'],
    O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
    M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
    Y: ['X...X', '.X.X.', '..X..', '..X..', '..X..'],
    V: ['X...X', 'X...X', 'X...X', '.X.X.', '..X..'],
    I: ['XXXXX', '..X..', '..X..', '..X..', 'XXXXX'],
    U: ['X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
    S: ['.XXXX', 'X....', '.XXX.', '....X', 'XXXX.'],
    C: ['.XXXX', 'X....', 'X....', 'X....', '.XXXX']
  };
  function lineBits(word) {
    var out = ['', '', '', '', ''];
    for (var i = 0; i < word.length; i++) {
      var g = word[i] === ' ' ? ['...', '...', '...', '...', '...'] : GLYPH[word[i]];
      for (var r = 0; r < 5; r++) out[r] += g[r] + (i < word.length - 1 ? '.' : '');
    }
    return out;
  }
  function buildHello() {
    var R = rng(11);
    var lines = ['HELLO', 'MY LOVE'];
    var bits = lines.map(lineBits);
    var maxW = Math.max(bits[0][0].length, bits[1][0].length);
    var sx = Math.floor(cols * 0.84 / maxW);
    if (sx < 2) {
      lines = ['HELLO', 'MY', 'LOVE'];
      bits = lines.map(lineBits);
      maxW = Math.max(bits[0][0].length, bits[1][0].length, bits[2][0].length);
      sx = Math.floor(cols * 0.84 / maxW);
    }
    sx = clamp(sx, 1, 7);
    var sy = Math.max(1, Math.round(sx * cw / chh));
    var gap = Math.max(1, sy * 2);
    var totalR = lines.length * 5 * sy + (lines.length - 1) * gap;
    var top = Math.round((rows - totalR) / 2 - rows * 0.03);
    var fill = new Uint8Array(cols * rows);
    var info = [];
    for (var li = 0; li < lines.length; li++) {
      var wpx = bits[li][0].length;
      var startC = Math.floor((cols - wpx * sx) / 2);
      var baseR = top + li * (5 * sy + gap);
      for (var py = 0; py < 5; py++) {
        for (var px = 0; px < wpx; px++) {
          if (bits[li][py].charAt(px) !== 'X') continue;
          for (var dy = 0; dy < sy; dy++) {
            for (var dx = 0; dx < sx; dx++) {
              var c = startC + px * sx + dx, r = baseR + py * sy + dy;
              if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
              fill[r * cols + c] = 1;
              info.push({ c: c, r: r, li: li, sc: startC, wc: wpx * sx });
            }
          }
        }
      }
    }
    function on(c, r) { return c >= 0 && r >= 0 && c < cols && r < rows && fill[r * cols + c] === 1; }
    hello = [];
    var maxTv = 0;
    for (var i = 0; i < info.length; i++) {
      var p = info[i];
      var edge = !(on(p.c - 1, p.r) && on(p.c + 1, p.r) && on(p.c, p.r - 1) && on(p.c, p.r + 1));
      var t = (p.c - p.sc) / p.wc;
      var startT = 400 + p.li * 1150;
      var tv = 6200 + R() * 1300;
      if (tv > maxTv) maxTv = tv;
      hello.push({
        c: p.c, r: p.r,
        ch: edge ? '@' : (R() < 0.14 ? '*' : ':'),
        hue: 22 - t * 52,
        l: edge ? 72 : 52,
        ta: startT + t * 1250 + R() * 90,
        tv: tv
      });
    }
    helloEnd = maxTv + 400;
  }
  function drawHello() {
    for (var i = 0; i < hello.length; i++) {
      var h = hello[i];
      if (T < h.ta || T >= h.tv + 260) continue;
      var el = T - h.ta, ch, col;
      if (el < 300) {
        ch = SCR.charAt(hash(h.c, h.r, (T / 55) | 0) % SCR.length);
        col = 'hsl(340,90%,86%)';
      } else if (T < h.tv) {
        ch = h.ch;
        col = hsl(h.hue, 85, h.l + 6 * Math.sin(h.c * 0.16 - T * 0.0042));
      } else {
        ch = DUST.charAt(hash(h.c, h.r, (T / 70) | 0) % DUST.length);
        col = hsl(h.hue, 60, 32);
      }
      put(h.c, h.r, ch, col);
    }
  }

  /* ---------- the pot ---------- */
  function buildPot() {
    var R = rng(7);
    var Rrim = Math.min(Wg * 0.8, Hsc * 0.5) / 2;
    var k = 0.27;
    var Hs = Rrim * 2 * 0.74;
    var Rbot = Rrim * 0.52;
    var ry = Rrim * k;
    var yT = Hsc - Math.max(Hsc * 0.045, chh * 1.5) - Hs - Rbot * k;
    var cx = Wg / 2;

    function prof(h) {
      var rim = 0.15, groove = 0.19;
      if (h < rim) return Rrim * (1 - 0.015 * h / rim);
      if (h < groove) {
        var t = (h - rim) / (groove - rim), s = t * t * (3 - 2 * t);
        return Rrim * (0.985 + (0.865 - 0.985) * s);
      }
      var u = (h - groove) / (1 - groove);
      var base = 0.865 + (0.52 - 0.865) * Math.pow(u, 1.05);
      return Rrim * (base + 0.045 * Math.sin(Math.PI * u));
    }

    var n = cols * rows;
    var kind = new Uint8Array(n);
    var inten = new Float32Array(n);
    var depth = new Float32Array(n).fill(-1e9);
    var Lx = -0.5, Ly = 0.55, Lz = 0.67;
    var Hx = -0.264, Hy = 0.428, Hz = 0.864;
    var HS = Math.max(300, Math.ceil(Hs / chh * 6));
    var PS = Math.max(300, Math.ceil(Rrim * 2 / cw * 6));
    for (var hi = 0; hi <= HS; hi++) {
      var h = hi / HS;
      var Rh = prof(h);
      var dR = (prof(Math.min(1, h + 0.002)) - prof(Math.max(0, h - 0.002))) / 0.004;
      var len = Math.sqrt(Hs * Hs + dR * dR);
      var nr = Hs / len, ny = dR / len;
      var shade = 0.82 + 0.18 * (1 - h);
      if (h > 0.145 && h < 0.215) shade *= 0.72;
      if (h > 0.60 && h < 0.625) shade *= 0.7;
      if (h > 0.64 && h < 0.655) shade *= 1.15;
      for (var pi = 0; pi <= PS; pi++) {
        var phi = -Math.PI / 2 + Math.PI * pi / PS;
        var sp = Math.sin(phi), cp = Math.cos(phi);
        var x = cx + Rh * sp;
        var y = yT + h * Hs + Rh * k * cp;
        var c = (x / cw) | 0, r = (y / chh) | 0;
        if (x < 0 || y < 0 || c >= cols || r >= rows) continue;
        var nx = nr * sp, nz = nr * cp;
        var d = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
        var hd = Math.max(0, nx * Hx + ny * Hy + nz * Hz);
        var I = (0.12 + 0.8 * d + Math.pow(hd, 24) * 0.6) * shade;
        var idx = r * cols + c;
        var z = Rh * cp + (1 - h) * 8;
        if (z > depth[idx]) { depth[idx] = z; kind[idx] = 1; inten[idx] = I; }
      }
    }
    // top: rim ring, soil, inner wall
    var ri = 0.865;
    var r0 = Math.floor((yT - ry) / chh) - 1, r1 = Math.ceil((yT + ry) / chh) + 1;
    var c0 = Math.floor((cx - Rrim) / cw) - 1, c1 = Math.ceil((cx + Rrim) / cw) + 1;
    for (var rr = r0; rr <= r1; rr++) {
      for (var cc = c0; cc <= c1; cc++) {
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
        var px = (cc + 0.5) * cw, py = (rr + 0.5) * chh;
        var ex = (px - cx) / Rrim, ey = (py - yT) / ry;
        if (ex * ex + ey * ey > 1) continue;
        var id2 = rr * cols + cc;
        if ((ex / ri) * (ex / ri) + (ey / ri) * (ey / ri) > 1) {
          kind[id2] = 2; inten[id2] = clamp(0.72 - 0.22 * ex + 0.06 * ey, 0.45, 0.95);
        } else {
          var es = ey - 0.2, rs = ri * 0.97;
          if ((ex / rs) * (ex / rs) + (es / rs) * (es / rs) <= 1) {
            kind[id2] = 3; inten[id2] = 0.35 * R();
          } else {
            kind[id2] = 4; inten[id2] = 0.18 + 0.1 * (ey + 1);
          }
        }
      }
    }
    G = { cx: cx, yT: yT, ry: ry, Rrim: Rrim, soilY: yT + ry * 0.2, M: Wg * 0.13 };

    var targets = [];
    for (var i = 0; i < n; i++) {
      if (!kind[i]) continue;
      var kd = kind[i], In = clamp(inten[i], 0, 0.999);
      var ch, hue, sat, lit;
      if (kd === 1 || kd === 2) {
        var ci = Math.floor(In * BODY.length);
        if (R() < 0.2) ci += R() < 0.5 ? -1 : 1;
        ci = clamp(ci, 0, BODY.length - 1);
        ch = BODY.charAt(ci);
        hue = (kd === 1 ? 12 : 18) + In * 16;
        sat = 55 + In * 18;
        lit = kd === 1 ? 9 + In * 52 : 14 + In * 52;
      } else if (kd === 3) {
        ch = ",.:;'`".charAt(Math.floor(R() * 6));
        hue = 24; sat = 38; lit = 8 + In * 18;
      } else {
        ch = ':-='.charAt(Math.floor(R() * 3));
        hue = 12; sat = 50; lit = 8 + In * 30;
      }
      var cI = i % cols, rI = (i / cols) | 0;
      targets.push({
        c: cI, r: rI, ch: ch, th: hue, ts: sat, tl: lit,
        col: hsl(hue, sat, lit),
        key: rI + R() * 2.4
      });
    }
    targets.sort(function (a, b) { return b.key - a.key; });

    var N = targets.length;
    var POUR = clamp(N * 3.2, 3600, 6500);
    var TR = 7300;
    var JW = clamp(Wg * 0.015, cw * 2.5, cw * 6);
    var maxLand = 0;
    for (var j = 0; j < N; j++) {
      var p = targets[j];
      p.tx = (p.c + 0.5) * cw;
      p.ty = (p.r + 0.5) * chh;
      p.sp = TR + (j / N) * POUR + R() * 60;
      p.dur = 1250 + R() * 550;
      p.land = p.sp + p.dur;
      p.jx = (R() + R() - 1) * JW;
      p.ph = R() * 6.28;
      p.seed = (R() * 100000) | 0;
      if (p.land > maxLand) maxLand = p.land;
    }
    parts = targets;
    TF = maxLand + 350;
  }
  function posAt(p, u) {
    var ys = -chh * 2;
    var y = ys + (p.ty - ys) * Math.pow(u, 1.18);
    var top = G.yT - G.ry;
    var amp = 1 - clamp(y / top, 0, 1);
    var xr = G.cx + G.M * Math.sin(y * 0.0095 + p.sp * 0.0016) * amp + p.jx * (0.55 + 0.45 * amp);
    var f = sstep(0.5, 1, u);
    var x = xr + (p.tx - xr) * f + Math.sin(u * 9 + p.ph) * cw * 1.2 * (1 - u);
    return { x: x, y: y };
  }
  function ensureLayer() {
    if (potLayer) return;
    var oc = document.createElement('canvas');
    oc.width = cv.width; oc.height = cv.height;
    var o = oc.getContext('2d');
    o.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
    o.font = ctx.font;
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    for (var i = 0; i < parts.length; i++) put(parts[i].c, parts[i].r, parts[i].ch, parts[i].col, o);
    potLayer = oc;
  }
  function drawPot() {
    if (T >= TF) {
      ensureLayer();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(potLayer, 0, 0);
      ctx.restore();
      return;
    }
    var tick = (T / 110) | 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (T < p.sp - 70) break;
      if (T < p.sp) continue;
      if (T >= p.land) {
        var since = T - p.land;
        put(p.c, p.r, p.ch, since < 280 ? hsl(p.th, p.ts, Math.min(88, p.tl + 30 * (1 - since / 280))) : p.col);
        continue;
      }
      var u = (T - p.sp) / p.dur;
      for (var k = 0; k < 3; k++) {
        var uu = u - k * 0.045;
        if (uu < 0) break;
        var q = posAt(p, uu);
        var f2 = sstep(0.62, 1, uu);
        ctx.globalAlpha = k === 0 ? 1 : (k === 1 ? 0.55 : 0.28);
        put(Math.floor(q.x / cw), Math.floor(q.y / chh),
          FL.charAt(hash(p.seed, k, tick) % FL.length),
          hsl(195 + (p.th - 195) * f2, 70 + (p.ts - 70) * f2, 62 + (p.tl - 62) * f2));
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- the rose ---------- */
  function buildFlower() {
    var Rb = Math.min(Wg * 0.2, Hsc * 0.13);
    var yHead = Rb * 1.18 + Hsc * 0.035;
    F = { Rb: Rb, yHead: yHead, ax: G.cx, ay: G.soilY, stemLen: G.soilY - yHead, A: Rb * 0.5, hx: G.cx, hy: yHead };
    var R = rng(23);
    spark = [];
    for (var i = 0; i < 26; i++) {
      spark.push({
        x: G.cx + (R() - 0.5) * Rb * 4.4,
        y: yHead + (R() - 0.5) * Rb * 3.4,
        vy: 8 + R() * 14,
        ph: R() * 6.28,
        ch: "*.+`'".charAt(Math.floor(R() * 5))
      });
    }
    petals = [];
    for (var j = 0; j < 5; j++) petals.push({ off: (j - 2) * 0.3, t0: R() * 5200, ph: R() * 6.28, ch: '()~('.charAt(j % 4) });
  }
  function stemX(s, sw) { return G.cx + F.A * Math.sin(s * 2.6) + sw * s * s; }
  function stemY(s) { return F.ay - s * F.stemLen; }

  var LEAVES = [
    { s: 0.28, a: 24, len: 1.2, wid: 0.36 },
    { s: 0.47, a: 156, len: 1.05, wid: 0.34 },
    { s: 0.64, a: 30, len: 0.8, wid: 0.3 }
  ];
  function drawLeaf(L, g, sw) {
    var lp = sstep(0, 0.25, g - L.s);
    if (lp <= 0) return;
    var ax = stemX(L.s, sw), ay = stemY(L.s);
    var Ll = F.Rb * L.len * lp, a = Ll / 2, b = Ll * L.wid / 2;
    var ang = L.a * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
    var mx = ax + ca * a, my = ay - sa * a;
    var ext = a + cw + chh;
    for (var r = Math.floor((my - ext) / chh); r <= Math.ceil((my + ext) / chh); r++) {
      for (var c = Math.floor((mx - ext) / cw); c <= Math.ceil((mx + ext) / cw); c++) {
        var rx = (c + 0.5) * cw - mx, ry = -((r + 0.5) * chh - my);
        var du = (rx * ca + ry * sa) / a, dv = (-rx * sa + ry * ca) / b;
        if (Math.abs(du) > 1) continue;
        if (Math.abs(dv) > Math.pow(Math.cos(du * Math.PI / 2), 0.7)) continue;
        var I = clamp(0.3 + 0.5 * (1 - Math.abs(dv)) + 0.15 * dv * (ca > 0 ? 1 : -1), 0.1, 1);
        var ch = Math.abs(dv) < 0.12 ? '-' : LRAMP.charAt(Math.floor(I * LRAMP.length * 0.999));
        put(c, r, ch, hsl(135, 50, 20 + I * 30));
      }
    }
  }
  function drawRose(hx, hy, R, eb) {
    var x0 = Math.floor((hx - R * 1.3) / cw), x1 = Math.ceil((hx + R * 1.3) / cw);
    var y0 = Math.floor((hy - R * 1.3) / chh), y1 = Math.ceil((hy + R * 1.3) / chh);
    for (var r = y0; r <= y1; r++) {
      for (var c = x0; c <= x1; c++) {
        var dx = ((c + 0.5) * cw - hx) / R, dy = ((r + 0.5) * chh - hy) / R;
        var wf = 1 - 0.3 * Math.pow(Math.max(0, dy), 1.5);
        var nx = dx / wf;
        var rr = Math.sqrt(nx * nx + dy * dy);
        var th = Math.atan2(-dy, dx);
        var bound = 1 + (0.03 + 0.06 * eb) * Math.cos(5 * th + 0.6) * (dy < 0 ? 1 : 0.4);
        if (rr > bound) {
          if (dy > 0.45 && dy < 1.25) {
            var t = (dy - 0.45) / 0.8;
            var lim = 0.62 * Math.pow(1 - t, 0.7) + 0.06;
            if (Math.abs(dx) < lim) {
              put(c, r, Math.abs(dx) < 0.12 ? 'V' : (dx < 0 ? '\\' : '/'), hsl(130, 48, 26 + (1 - t) * 14));
            }
          }
          continue;
        }
        var u = rr / bound;
        var ph = th / (2 * Math.PI) * 3 + (2.4 + 1.0 * eb) * Math.pow(u, 0.62) + (1 - eb) * 0.5;
        var f = ph - Math.floor(ph);
        var I = 0.2 + 0.58 * f + (f > 0.9 ? 0.18 : 0);
        I *= 0.72 + 0.28 * Math.min(1, u * 3.2);
        if (u > 0.9) I *= 1 - (u - 0.9) * 3;
        var hl = 1 - Math.sqrt((dx + 0.38) * (dx + 0.38) + (dy + 0.4) * (dy + 0.4)) * 1.9;
        if (hl > 0) I += 0.18 * hl;
        I = clamp(I, 0.05, 0.999);
        put(c, r, RRAMP.charAt(Math.floor(I * RRAMP.length)), hsl(346 + I * 16, 82 - I * 18, 12 + I * 50));
      }
    }
  }
  function drawFlower(dt) {
    var ft = T - TF;
    if (ft < 0) return;
    var g0 = clamp(ft / 3600, 0, 1);
    var g = g0 < 0.5 ? 2 * g0 * g0 : 1 - Math.pow(-2 * g0 + 2, 2) / 2;
    var bud = sstep(0.86, 1, g);
    var b = clamp((ft - 3200) / 4600, 0, 1);
    var eb = 1 - Math.pow(1 - b, 3);
    var sw = Math.sin(T * 0.0013) * F.Rb * 0.07 * sstep(0, 1, (ft - 5000) / 2500);

    // stem
    var n = Math.max(2, Math.ceil(F.stemLen * g / (chh * 0.55)));
    for (var i = 0; i <= n; i++) {
      var s = g * i / n;
      var x = stemX(s, sw), y = stemY(s);
      var x2 = stemX(s + 0.01, sw), y2 = stemY(s + 0.01);
      var tn = (x2 - x) / Math.max(0.001, y - y2);
      var c0 = Math.round(x / cw - 1), r = Math.floor(y / chh);
      var col = hsl(128, 46, 24 + s * 16);
      if (g < 1 && i === n) {
        put(c0, r, 'o', hsl(100, 60, 62)); put(c0 + 1, r, 'o', hsl(100, 60, 62));
      } else if (Math.abs(tn) < 0.3) {
        put(c0, r, '(', col); put(c0 + 1, r, ')', col);
      } else {
        var cx2 = tn > 0 ? '/' : '\\';
        put(c0, r, cx2, col); put(c0 + 1, r, cx2, col);
      }
    }
    for (var li = 0; li < LEAVES.length; li++) drawLeaf(LEAVES[li], g, sw);

    // head
    var R = F.Rb * (0.16 * bud + 0.84 * eb);
    if (R >= 6) drawRose(stemX(1, sw), F.yHead, R, eb);

    // sparkles and falling petals once in bloom
    var show = sstep(7800, 9500, ft);
    if (show > 0) {
      var hx = stemX(1, sw);
      for (var k = 0; k < spark.length; k++) {
        var sp = spark[k];
        sp.y -= sp.vy * dt / 1000;
        if (sp.y < F.yHead - F.Rb * 2.0) sp.y = F.yHead + F.Rb * 1.6;
        ctx.globalAlpha = show * (0.2 + 0.45 * (0.5 + 0.5 * Math.sin(T * 0.004 + sp.ph)));
        put(Math.floor(sp.x / cw), Math.floor(sp.y / chh), sp.ch, hsl(335, 90, 78));
      }
      var potTop = G.yT - G.ry;
      for (var q = 0; q < petals.length; q++) {
        var pt = petals[q];
        var u = ((T + pt.t0) % 5200) / 5200;
        var py = F.yHead + F.Rb * 0.4 + u * (potTop - F.yHead - F.Rb * 0.6);
        var px = hx + pt.off * F.Rb * 1.5 + Math.sin(u * 7 + pt.ph) * F.Rb * 0.35 + u * (q % 2 ? 1 : -1) * F.Rb * 0.3;
        ctx.globalAlpha = show * Math.sin(u * Math.PI);
        put(Math.floor(px / cw), Math.floor(py / chh), pt.ch, hsl(350, 80, 48));
      }
      ctx.globalAlpha = 1;
    }
  }


  /* ---------- the closing words ---------- */
  var CAP_START = 8200;
  function planCaption() {
    var one = ['I LOVE YOU SO MUCH'];
    var lines = (cols * 0.92 >= lineBits(one[0])[0].length) ? one : ['I LOVE YOU', 'SO MUCH'];
    var bits = lines.map(lineBits);
    var maxW = 0;
    bits.forEach(function (b) { if (b[0].length > maxW) maxW = b[0].length; });
    var sx = clamp(Math.floor(cols * 0.9 / maxW), 1, 3);
    var sy = Math.max(1, Math.round(sx * cw / chh));
    var gap = Math.max(1, sy * 2);
    var totalR = lines.length * 5 * sy + (lines.length - 1) * gap;
    capPlan = { lines: lines, bits: bits, sx: sx, sy: sy, gap: gap, totalR: totalR };
    capPx = (totalR + 3) * chh;
    Hsc = Hg - capPx;
  }
  function buildCaption() {
    var R = rng(31), P = capPlan;
    var top = rows - P.totalR - 2;
    var fill = new Uint8Array(cols * rows), info = [];
    for (var li = 0; li < P.lines.length; li++) {
      var wpx = P.bits[li][0].length;
      var startC = Math.floor((cols - wpx * P.sx) / 2);
      var baseR = top + li * (5 * P.sy + P.gap);
      for (var py = 0; py < 5; py++) {
        for (var px = 0; px < wpx; px++) {
          if (P.bits[li][py].charAt(px) !== 'X') continue;
          for (var dy = 0; dy < P.sy; dy++) {
            for (var dx = 0; dx < P.sx; dx++) {
              var c = startC + px * P.sx + dx, r = baseR + py * P.sy + dy;
              if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
              fill[r * cols + c] = 1;
              info.push({ c: c, r: r, li: li, sc: startC, wc: wpx * P.sx });
            }
          }
        }
      }
    }
    function on(c, r) { return c >= 0 && r >= 0 && c < cols && r < rows && fill[r * cols + c] === 1; }
    cap = [];
    for (var i = 0; i < info.length; i++) {
      var p = info[i];
      var edge = !(on(p.c - 1, p.r) && on(p.c + 1, p.r) && on(p.c, p.r - 1) && on(p.c, p.r + 1));
      var t = (p.c - p.sc) / p.wc;
      cap.push({
        c: p.c, r: p.r,
        ch: edge ? '@' : (R() < 0.14 ? '*' : ':'),
        hue: -10 + t * 55,
        l: edge ? 76 : 58,
        ta: CAP_START + p.li * 1300 + t * 2300 + R() * 90
      });
    }
  }
  function drawCaption() {
    var rel = T - TF;
    for (var i = 0; i < cap.length; i++) {
      var h = cap[i];
      if (rel < h.ta) continue;
      var ch, col;
      if (rel - h.ta < 300) {
        ch = SCR.charAt(hash(h.c, h.r, (T / 55) | 0) % SCR.length);
        col = 'hsl(340,90%,88%)';
      } else {
        ch = h.ch;
        col = hsl(h.hue, 85, h.l + 6 * Math.sin(h.c * 0.16 - T * 0.0042));
      }
      put(h.c, h.r, ch, col);
    }
  }

  /* ---------- loop ---------- */
  function render(dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(ox, oy);
    ctx.globalAlpha = 1;
    if (T < helloEnd) drawHello();
    if (T >= 7200) drawPot();
    if (T >= TF) drawFlower(dt);
    if (T >= TF + CAP_START) drawCaption();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min(now - last, 50) : 16;
    last = now;
    T += dt;
    render(dt);
  }

  again.addEventListener('click', function () { T = 0; });

  var timer = 0;
  function relayout() { clearTimeout(timer); timer = setTimeout(layout, 150); }
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(stage);
  else window.addEventListener('resize', relayout);

  layout();
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('700 16px "JetBrains Mono"').then(function () { var keep = T; layout(); if (!reduce) T = keep; });
    }
  } catch (e) {}
  requestAnimationFrame(frame);
})();
