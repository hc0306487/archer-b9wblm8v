// 장기 규칙과 컴퓨터 생각 엔진. 화면(index.html)과 계산용 워커가 같이 씁니다.
// 판: 9줄 x 10줄, 칸 번호 = 행*9 + 열. 아래쪽 = +1, 위쪽 = -1. 말 값이 양수면 아래쪽 말.
var J = (function () {
  var K = 1, A = 2, E = 3, H = 4, R = 5, C = 6, P = 7;
  function sq(r, c) { return r * 9 + c; }
  function ok(r, c) { return r >= 0 && r < 10 && c >= 0 && c < 9; }
  function inPal(r, c) { return c >= 3 && c <= 5 && ((r >= 0 && r <= 2) || (r >= 7 && r <= 9)); }
  function isCenter(r, c) { return c === 4 && (r === 1 || r === 8); }
  function samePal(r1, r2) { return (r1 <= 2 && r2 <= 2) || (r1 >= 7 && r2 >= 7); }
  function diagOk(r1, c1, r2, c2) {
    return inPal(r1, c1) && inPal(r2, c2) && samePal(r1, r2) && (isCenter(r1, c1) || isCenter(r2, c2));
  }
  var palSteps = [], horse = [], eleph = [], pawnB = [], pawnT = [], rays = [];
  for (var r = 0; r < 10; r++) for (var c = 0; c < 9; c++) {
    var s = sq(r, c), list, d, i;
    // 궁/사: 궁성 안 한 칸
    list = [];
    if (inPal(r, c)) {
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function (d) { var rr = r + d[0], cc = c + d[1]; if (inPal(rr, cc) && samePal(r, rr)) list.push(sq(rr, cc)); });
      [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function (d) { var rr = r + d[0], cc = c + d[1]; if (diagOk(r, c, rr, cc)) list.push(sq(rr, cc)); });
    }
    palSteps[s] = list;
    // 마: 직선 한 칸 + 대각 한 칸
    list = [];
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function (d) {
      var lr = r + d[0], lc = c + d[1];
      if (!ok(lr, lc)) return;
      var side = d[0] === 0 ? [[1,0],[-1,0]] : [[0,1],[0,-1]];
      side.forEach(function (e) {
        var tr = lr + d[0] + e[0], tc = lc + d[1] + e[1];
        if (ok(tr, tc)) list.push([sq(lr, lc), sq(tr, tc)]);
      });
      // 상: 직선 한 칸 + 대각 두 칸
    });
    horse[s] = list;
    list = [];
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function (d) {
      var lr = r + d[0], lc = c + d[1];
      if (!ok(lr, lc)) return;
      var side = d[0] === 0 ? [[1,0],[-1,0]] : [[0,1],[0,-1]];
      side.forEach(function (e) {
        var dr = d[0] + e[0], dc = d[1] + e[1];
        var r2 = lr + dr, c2 = lc + dc, r3 = r2 + dr, c3 = c2 + dc;
        if (ok(r2, c2) && ok(r3, c3)) list.push([sq(lr, lc), sq(r2, c2), sq(r3, c3)]);
      });
    });
    eleph[s] = list;
    // 졸/병: 앞, 옆, 상대 궁성 안에서는 대각선 앞
    function pawn(dir) {
      var l = [], rr = r + dir;
      if (ok(rr, c)) l.push(sq(rr, c));
      if (ok(r, c - 1)) l.push(sq(r, c - 1));
      if (ok(r, c + 1)) l.push(sq(r, c + 1));
      [-1, 1].forEach(function (dc) { if (ok(rr, c + dc) && diagOk(r, c, rr, c + dc)) l.push(sq(rr, c + dc)); });
      return l;
    }
    pawnB[s] = pawn(-1); pawnT[s] = pawn(1);
    // 차/포 길: 직선 4방향 + 궁성 대각선
    list = [];
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(function (d) {
      var ray = [], rr = r + d[0], cc = c + d[1];
      while (ok(rr, cc)) { ray.push(sq(rr, cc)); rr += d[0]; cc += d[1]; }
      if (ray.length) list.push(ray);
    });
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function (d) {
      var ray = [], rr = r, cc = c;
      while (diagOk(rr, cc, rr + d[0], cc + d[1])) { rr += d[0]; cc += d[1]; ray.push(sq(rr, cc)); }
      if (ray.length) list.push(ray);
    });
    rays[s] = list;
  }

  function gen(b, side, out, capOnly) {
    out.length = 0;
    for (var s = 0; s < 90; s++) {
      var p = b[s];
      if (p === 0 || (p > 0) !== (side > 0)) continue;
      var t = p > 0 ? p : -p, i, j, to, q, L;
      switch (t) {
        case K: case A:
          L = palSteps[s];
          for (i = 0; i < L.length; i++) add(s, L[i]);
          break;
        case H:
          L = horse[s];
          for (i = 0; i < L.length; i++) if (b[L[i][0]] === 0) add(s, L[i][1]);
          break;
        case E:
          L = eleph[s];
          for (i = 0; i < L.length; i++) if (b[L[i][0]] === 0 && b[L[i][1]] === 0) add(s, L[i][2]);
          break;
        case P:
          L = side > 0 ? pawnB[s] : pawnT[s];
          for (i = 0; i < L.length; i++) add(s, L[i]);
          break;
        case R:
          L = rays[s];
          for (i = 0; i < L.length; i++) {
            var ray = L[i];
            for (j = 0; j < ray.length; j++) {
              to = ray[j]; q = b[to];
              if (q === 0) { if (!capOnly) out.push(s << 7 | to); }
              else { if ((q > 0) !== (side > 0)) out.push(s << 7 | to); break; }
            }
          }
          break;
        case C:
          L = rays[s];
          for (i = 0; i < L.length; i++) {
            var ray2 = L[i], screen = -1;
            for (j = 0; j < ray2.length; j++) { if (b[ray2[j]] !== 0) { screen = j; break; } }
            if (screen < 0) continue;
            q = b[ray2[screen]];
            if (q === C || q === -C) continue; // 포는 포를 넘지 못함
            for (j = screen + 1; j < ray2.length; j++) {
              to = ray2[j]; q = b[to];
              if (q === 0) { if (!capOnly) out.push(s << 7 | to); }
              else { if ((q > 0) !== (side > 0) && q !== C && q !== -C) out.push(s << 7 | to); break; }
            }
          }
          break;
      }
    }
    function add(s, to) {
      var q = b[to];
      if (q === 0) { if (!capOnly) out.push(s << 7 | to); }
      else if ((q > 0) !== (side > 0)) out.push(s << 7 | to);
    }
    return out;
  }

  var tmp = [];
  function kingSq(b, side) { var k = side > 0 ? K : -K; for (var s = 0; s < 90; s++) if (b[s] === k) return s; return -1; }
  function inCheck(b, side) {
    var ks = kingSq(b, side);
    if (ks < 0) return true;
    gen(b, -side, tmp, true);
    for (var i = 0; i < tmp.length; i++) if ((tmp[i] & 127) === ks) return true;
    return false;
  }
  function legalMoves(b, side) {
    var all = gen(b, side, [], false), res = [];
    for (var i = 0; i < all.length; i++) {
      var m = all[i], f = m >> 7, t = m & 127, cap = b[t];
      b[t] = b[f]; b[f] = 0;
      if (!inCheck(b, side)) res.push(m);
      b[f] = b[t]; b[t] = cap;
    }
    return res;
  }

  // 상차림: [1열, 2열, 6열, 7열] (아래쪽 기준 왼쪽부터)
  var SETUPS = { '마상마상': [H,E,H,E], '상마상마': [E,H,E,H], '마상상마': [H,E,E,H], '상마마상': [E,H,H,E] };
  function initial(bottomSetup, topSetup) {
    var b = new Array(90).fill(0);
    function place(side, setup) {
      var back = side > 0 ? 9 : 0, kr = side > 0 ? 8 : 1, cr = side > 0 ? 7 : 2, pr = side > 0 ? 6 : 3;
      var a = SETUPS[setup];
      // 위쪽은 그 사람 기준 왼쪽이 7열이라 뒤집어서 놓음
      var cols = side > 0 ? [1, 2, 6, 7] : [7, 6, 2, 1];
      b[sq(back, 0)] = R * side; b[sq(back, 8)] = R * side;
      b[sq(back, 3)] = A * side; b[sq(back, 5)] = A * side;
      for (var i = 0; i < 4; i++) b[sq(back, cols[i])] = a[i] * side;
      b[sq(kr, 4)] = K * side;
      b[sq(cr, 1)] = C * side; b[sq(cr, 7)] = C * side;
      for (var c = 0; c < 9; c += 2) b[sq(pr, c)] = P * side;
    }
    place(1, bottomSetup); place(-1, topSetup);
    return b;
  }

  // 점수(장기 공식 점수): 차13 포7 마5 상3 사3 졸2
  var PTS = [0, 0, 3, 3, 5, 13, 7, 2];
  function points(b, side) { var t = 0; for (var s = 0; s < 90; s++) { var p = b[s]; if (p !== 0 && (p > 0) === (side > 0)) t += PTS[p > 0 ? p : -p]; } return t; }

  // ---------- 컴퓨터 생각 ----------
  var VAL = [0, 0, 300, 300, 500, 1300, 700, 200];
  var PST = [];
  for (var t = 0; t <= 7; t++) { PST[t] = []; for (var s2 = 0; s2 < 90; s2++) {
    var rr = Math.floor(s2 / 9), cc = s2 % 9, v = 0, center = 4 - Math.abs(cc - 4);
    if (t === P) { var adv = 6 - rr; if (adv > 0) v = adv * 12 + (adv >= 3 ? center * 6 : 0); if (rr === 0) v -= 30; if (rr === 9 - 9 && cc === 4) v -= 0; }
    if (t === H) { v = center * 6 + (rr >= 2 && rr <= 7 ? 10 : 0) - (cc === 0 || cc === 8 ? 15 : 0); }
    if (t === E) { v = center * 3; }
    if (t === R) { v = (rr <= 3 ? 10 : 0) + (cc === 4 ? 5 : 0); }
    if (t === C) { v = (cc === 4 ? 12 : 0) + (rr === 7 ? 6 : 0); }
    if (t === K) { v = (cc === 4 ? 6 : 0) + (rr === 8 ? 8 : 0); }
    PST[t][s2] = v;
  } }
  function evaluate(b, side) {
    var sc = 0, s, p;
    for (s = 0; s < 90; s++) {
      p = b[s]; if (p === 0) continue;
      if (p > 0) sc += VAL[p] + PST[p][s];
      else sc -= VAL[-p] + PST[-p][89 - s];
    }
    return sc * side;
  }
  var MATE = 100000, nodes = 0, deadline = 0, stop = false;
  var killers = [], hist = new Int32Array(90 * 128);
  function orderScore(b, m, ply) {
    var f = m >> 7, t = m & 127, cap = b[t];
    if (cap !== 0) return 1000000 + VAL[cap > 0 ? cap : -cap] * 10 - VAL[b[f] > 0 ? b[f] : -b[f]];
    var k = killers[ply];
    if (k && (k[0] === m || k[1] === m)) return 900000;
    return hist[f * 128 + t];
  }
  function sortMoves(b, ms, ply, first) {
    var sc = ms.map(function (m) { return m === first ? 1e9 : orderScore(b, m, ply); });
    var idx = ms.map(function (_, i) { return i; }).sort(function (x, y) { return sc[y] - sc[x]; });
    return idx.map(function (i) { return ms[i]; });
  }
  function qs(b, side, alpha, beta, ply, qd) {
    nodes++;
    var stand = evaluate(b, side);
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    if (qd >= 6) return stand;
    var ms = sortMoves(b, gen(b, side, [], true), ply, -1);
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i], f = m >> 7, t = m & 127, cap = b[t];
      if (cap === K || cap === -K) return MATE - ply;
      b[t] = b[f]; b[f] = 0;
      if (inCheck(b, side)) { b[f] = b[t]; b[t] = cap; continue; }
      var sc = -qs(b, -side, -beta, -alpha, ply + 1, qd + 1);
      b[f] = b[t]; b[t] = cap;
      if (sc >= beta) return sc;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }
  function search(b, side, depth, alpha, beta, ply) {
    if ((++nodes & 1023) === 0 && deadline && Date.now() > deadline) stop = true;
    if (stop) return 0;
    var chk = inCheck(b, side);
    if (chk && ply < 12) depth++;
    if (depth <= 0) return qs(b, side, alpha, beta, ply, 0);
    var ms = sortMoves(b, gen(b, side, [], false), ply, -1);
    var legal = 0, best = -MATE - 1;
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i], f = m >> 7, t = m & 127, cap = b[t];
      b[t] = b[f]; b[f] = 0;
      if (inCheck(b, side)) { b[f] = b[t]; b[t] = cap; continue; }
      legal++;
      var sc = -search(b, -side, depth - 1, -beta, -alpha, ply + 1);
      b[f] = b[t]; b[t] = cap;
      if (stop) return 0;
      if (sc > best) best = sc;
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) {
        if (cap === 0) {
          var k = killers[ply] || (killers[ply] = [0, 0]);
          if (k[0] !== m) { k[1] = k[0]; k[0] = m; }
          hist[f * 128 + t] += depth * depth;
        }
        break;
      }
    }
    if (legal === 0) return chk ? -MATE + ply : 0;
    return best;
  }
  // 난이도: 0 초보, 1 하수, 2 중수, 3 고수
  var LEVELS = [
    { depth: 1, noise: 220, time: 0 },
    { depth: 2, noise: 70, time: 0 },
    { depth: 3, noise: 15, time: 1500 },
    { depth: 8, noise: 0, time: 2500 }
  ];
  function think(board, side, level) {
    var b = board.slice(), L = LEVELS[level];
    var root = legalMoves(b, side);
    if (!root.length) return -1;
    if (root.length === 1) return root[0];
    killers = []; hist = new Int32Array(90 * 128); nodes = 0; stop = false;
    deadline = L.time ? Date.now() + L.time : 0;
    var best = root[0], i, m, f, t, cap, sc;
    if (L.noise > 0) {
      // 모든 수를 점수 매긴 뒤 약간 흔들어 고름 (사람처럼 실수)
      var scored = [];
      for (var d = 1; d <= L.depth; d++) {
        var cur = [];
        for (i = 0; i < root.length; i++) {
          m = root[i]; f = m >> 7; t = m & 127; cap = b[t];
          b[t] = b[f]; b[f] = 0;
          sc = -search(b, -side, d - 1, -MATE - 1, MATE + 1, 1);
          b[f] = b[t]; b[t] = cap;
          if (stop) break;
          cur.push([m, sc]);
        }
        if (stop) break;
        scored = cur;
      }
      var pick = -Infinity;
      for (i = 0; i < scored.length; i++) {
        var v = scored[i][1] + (Math.random() - 0.5) * 2 * L.noise;
        if (scored[i][1] > MATE - 100) v += 50000; // 외통은 절대 놓치지 않음
        if (v > pick) { pick = v; best = scored[i][0]; }
      }
      return best;
    }
    var order = root.slice();
    for (var depth = 1; depth <= L.depth; depth++) {
      var alpha = -MATE - 1, bestHere = order[0], results = [];
      order = sortMoves(b, order, 0, best);
      for (i = 0; i < order.length; i++) {
        m = order[i]; f = m >> 7; t = m & 127; cap = b[t];
        b[t] = b[f]; b[f] = 0;
        if (i === 0) sc = -search(b, -side, depth - 1, -MATE - 1, -alpha, 1);
        else {
          sc = -search(b, -side, depth - 1, -alpha - 1, -alpha, 1);
          if (!stop && sc > alpha) sc = -search(b, -side, depth - 1, -MATE - 1, -alpha, 1);
        }
        b[f] = b[t]; b[t] = cap;
        if (stop) break;
        if (sc > alpha) { alpha = sc; bestHere = m; }
      }
      if (stop && depth > 1) break;
      best = bestHere;
      if (alpha > MATE - 100) break;
      if (deadline && Date.now() > deadline - L.time * 0.45) break; // 다음 깊이는 시간 안에 못 끝냄
    }
    return best;
  }

  return { K: K, A: A, E: E, H: H, R: R, C: C, P: P, SETUPS: SETUPS, initial: initial, legalMoves: legalMoves,
    inCheck: inCheck, points: points, think: think, gen: gen };
})();

if (typeof window === 'undefined' && typeof self !== 'undefined') {
  self.onmessage = function (e) {
    var d = e.data;
    var move = J.think(d.board, d.side, d.level);
    self.postMessage({ id: d.id, move: move });
  };
}
