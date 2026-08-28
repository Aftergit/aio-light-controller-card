/* Universal Socket Card — Home Assistant Lovelace custom card
 * Same room-tile structure as universal-light-card, with power use instead of
 * brightness / colour / effects.
 *
 * Config example:
 *   type: custom:universal-socket-card
 *   title: Socket Control
 *   columns: 3
 *   glass_mode: false
 *   power: sensor.house_power
 *   energy:                            # one sensor, or a list (peak + off-peak)
 *     - sensor.daily_energy_offpeak
 *     - sensor.daily_energy_peak
 *   rooms:
 *     - label: Kitchen
 *       icon: mdi:countertop
 *       group: switch.kitchen
 *       circuit_limit: 3680
 *       sockets:
 *         - label: Kettle
 *           id: switch.kettle
 *           power: sensor.kettle_power
 *           energy: sensor.kettle_energy
 *           voltage: sensor.kettle_voltage
 *           current: sensor.kettle_current
 *           rated: 2200
 */
class UniversalSocketCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
    this._activeRoom = null;
    this._expanded = new Set();
    this._rendered = false;
    this._lastOn = {};
  }

  setConfig(config) {
    if (!config.rooms || !Array.isArray(config.rooms)) {
      throw new Error('universal-socket-card: "rooms" array is required');
    }
    this._config = {
      ...config,
      rooms: config.rooms.map((r) => ({
        ...r,
        sockets: (r.sockets || []).map((s) => ({
          ...s,
          id: s.id || s.entity || "",
          power: s.power || s.power_entity || "",
          energy: s.energy || s.energy_entity || "",
          voltage: s.voltage || s.voltage_entity || "",
          current: s.current || s.current_entity || "",
          label: s.label || s.name || "",
          icon: s.icon || "mdi:power-socket-eu",
        })),
      })),
    };
    this._rendered = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._fullRender();
      this._rendered = true;
    } else {
      this._updateStates();
    }
  }

  _s(id) {
    return this._hass?.states[id];
  }

  _on(id) {
    const e = this._s(id);
    return e?.state === "on" || e?.state === "true";
  }

  _num(id, fallback = 0) {
    if (!id) return fallback;
    const n = parseFloat(this._s(id)?.state);
    return Number.isFinite(n) ? n : fallback;
  }

  _attrNum(id, keys, fallback = 0) {
    const a = this._s(id)?.attributes || {};
    for (const k of keys) {
      const n = parseFloat(a[k]);
      if (Number.isFinite(n)) return n;
    }
    return fallback;
  }

  _power(sock) {
    if (sock.power) return this._num(sock.power, 0);
    return this._attrNum(sock.id, ["current_power_w", "power", "current_consumption", "load_power"], 0);
  }

  _energy(sock) {
    if (sock.energy) return this._num(sock.energy, 0);
    return this._attrNum(sock.id, ["today_energy_kwh", "energy", "energy_kwh"], 0);
  }

  _voltage(sock) {
    if (sock.voltage) return this._num(sock.voltage, 0);
    return this._attrNum(sock.id, ["voltage"], 0);
  }

  _current(sock) {
    if (sock.current) return this._num(sock.current, 0);
    const a = this._attrNum(sock.id, ["current"], NaN);
    if (Number.isFinite(a)) return a;
    const p = this._power(sock);
    const v = this._voltage(sock);
    return v > 0 ? p / v : 0;
  }

  _rated(sock) {
    return sock.rated || this._attrNum(sock.id, ["max_power", "rated_power"], 3680);
  }

  _domain(id) {
    return (id || "switch").split(".")[0] === "light" ? "light" : "switch";
  }

  _lum(r, g, b) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  _tc(r, g, b) {
    return this._lum(r, g, b) > 0.45 ? "#1a1a1a" : "#fff";
  }

  _loadCol(watts, rated) {
    const t = Math.min(1, Math.max(0, watts / Math.max(rated * 0.55, 40)));
    return [
      Math.round(96 + 159 * t),
      Math.round(58 + 139 * t),
      Math.round(22 + 121 * t),
    ];
  }

  _shouldGlass() {
    return !!this._config.glass_mode;
  }

  _applyGlassClass() {
    const glass = this._shouldGlass();
    const wrap = this.shadowRoot?.querySelector(".wrap");
    if (glass) {
      this.classList.add("glass");
      wrap?.classList.add("glass");
    } else {
      this.classList.remove("glass");
      wrap?.classList.remove("glass");
    }
  }

  _tileStyle(sockets) {
    const on = (sockets || []).filter((s) => this._on(s.id) && this._power(s) >= 0);
    const live = on.filter((s) => this._on(s.id));
    if (!live.length) {
      return this._shouldGlass()
        ? { bg: "rgba(35,25,55,0.4)", text: "rgba(255,255,255,0.7)" }
        : { bg: "#1c1c1c", text: "#444" };
    }
    const cols = live.map((s) => this._loadCol(this._power(s), this._rated(s)));
    if (cols.length === 1) {
      const [r, g, b] = cols[0];
      return { bg: `rgb(${r},${g},${b})`, text: this._tc(r, g, b) };
    }
    const grad = cols.map(([r, g, b]) => `rgb(${r},${g},${b})`).join(",");
    const ar = cols.reduce((s, c) => s + c[0], 0) / cols.length;
    const ag = cols.reduce((s, c) => s + c[1], 0) / cols.length;
    const ab = cols.reduce((s, c) => s + c[2], 0) / cols.length;
    return { bg: `linear-gradient(135deg,${grad})`, text: this._tc(ar, ag, ab) };
  }

  _fmtW(w) {
    if (!Number.isFinite(w) || w < 0.5) return "0 W";
    if (w >= 1000) return `${(w / 1000).toFixed(w >= 10000 ? 1 : 2)} kW`;
    return `${Math.round(w)} W`;
  }

  _fmtKwh(k) {
    if (!Number.isFinite(k) || k < 0.005) return "0.00 kWh";
    return `${k.toFixed(2)} kWh`;
  }

  _entityValue(id, kind) {
    const e = this._s(id);
    if (!e) return NaN;
    const n = parseFloat(e.state);
    if (!Number.isFinite(n)) return NaN;
    const u = String(e.attributes?.unit_of_measurement || "").toLowerCase();
    if (kind === "power" && u === "kw") return n * 1000;
    if (kind === "energy" && (u === "wh" || u === "w")) return n / 1000;
    return n;
  }

  _ids(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => String(v || "").trim()).filter(Boolean);
    return String(val)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  _sumEntities(val, kind) {
    let sum = 0;
    let any = false;
    for (const id of this._ids(val)) {
      const n = this._entityValue(id, kind);
      if (Number.isFinite(n)) {
        sum += n;
        any = true;
      }
    }
    return any ? sum : NaN;
  }

  _housePower() {
    const n = this._sumEntities(this._config.power, "power");
    if (Number.isFinite(n)) return n;
    let w = 0;
    for (const r of this._config.rooms || []) {
      for (const s of r.sockets || []) w += this._on(s.id) ? this._power(s) : 0;
    }
    return w;
  }

  _houseEnergy() {
    const n = this._sumEntities(this._config.energy, "energy");
    if (Number.isFinite(n)) return n;
    let e = 0;
    for (const r of this._config.rooms || []) {
      for (const s of r.sockets || []) e += this._energy(s);
    }
    return e;
  }

  _houseMeterHtml() {
    const off = this._tileStyle([]);
    return `<div class="grid meter-row">
      <div class="tile meter-cell" style="background:${off.bg};cursor:default">
        <ha-icon icon="mdi:flash" style="color:${off.text};"></ha-icon>
        <span class="tile-name" style="color:${off.text};">Current use</span>
        <span class="tile-watts" style="color:${off.text};" data-house-power>${this._fmtW(this._housePower())}</span>
      </div>
      <div class="tile meter-cell" style="background:${off.bg};cursor:default">
        <ha-icon icon="mdi:counter" style="color:${off.text};"></ha-icon>
        <span class="tile-name" style="color:${off.text};">Today</span>
        <span class="tile-watts" style="color:${off.text};" data-house-energy>${this._fmtKwh(this._houseEnergy())}</span>
      </div>
    </div>`;
  }

  _updateHouseMeter() {
    const root = this.shadowRoot;
    if (!root) return;
    const pw = root.querySelector("[data-house-power]");
    const en = root.querySelector("[data-house-energy]");
    if (pw) pw.textContent = this._fmtW(this._housePower());
    if (en) en.textContent = this._fmtKwh(this._houseEnergy());
  }

  _call(domain, svc, data) {
    this._hass.callService(domain, svc, data);
  }

  _toggleHtml(on, entity, small) {
    const c = small ? "tsm" : "toggle";
    const domain = this._domain(entity);
    return `<button class="${c}${on ? "" : " off"}" data-toggle-entity="${entity}" data-toggle-domain="${domain}"><span class="tl">${on ? "on" : "off"}</span><span class="td"></span></button>`;
  }

  _meterRow(label, icon, value, pct, extraClass, entity) {
    const p = Math.max(0, Math.min(100, pct || 0));
    return `<div class="sr"><div class="sl"><span class="sll"><ha-icon icon="${icon}"></ha-icon>${label}</span><span class="slr" data-power-label="${entity || ""}">${value}</span></div><div class="track meter ${extraClass || ""}" data-fill-entity="${entity || ""}"><div class="fill" style="width:${p}%"></div></div></div>`;
  }

  _statsHtml(sock) {
    const v = this._voltage(sock);
    const a = this._current(sock);
    const e = this._energy(sock);
    return `<div class="stats" data-stats="${sock.id}">
      <div class="st"><span class="stl">Voltage</span><span class="stv" data-stat="v">${v ? Math.round(v) + " V" : "—"}</span></div>
      <div class="st"><span class="stl">Current</span><span class="stv" data-stat="a">${a ? a.toFixed(2) + " A" : "0.00 A"}</span></div>
      <div class="st"><span class="stl">Today</span><span class="stv" data-stat="e">${this._fmtKwh(e)}</span></div>
    </div>`;
  }

  _socketPanelHtml(s) {
    const on = this._on(s.id);
    const exp = this._expanded.has(s.id);
    const p = this._power(s);
    const rated = this._rated(s);
    const col = on ? this._loadCol(p, rated) : null;
    const txt = col
      ? this._tc(col[0], col[1], col[2])
      : this._shouldGlass()
        ? "rgba(255,255,255,0.82)"
        : "#555";
    const bg = on
      ? `rgb(${col[0]},${col[1]},${col[2]})`
      : this._shouldGlass()
        ? "rgba(255,255,255,0.08)"
        : "#242424";
    const body =
      exp && on
        ? `${this._meterRow("Power use", "mdi:flash", this._fmtW(p), (p / rated) * 100, "", s.id)}${this._statsHtml(s)}`
        : "";

    return `<div class="ip" data-socket="${s.id}">
      <div class="ih" data-expand-socket="${s.id}" style="background:${bg};">
        <div class="ihl"><ha-icon icon="${s.icon || "mdi:power-socket-eu"}" style="color:${txt};"></ha-icon><span class="iln" style="color:${txt};">${s.label}</span>${on ? `<span class="ibr" data-sock-w="${s.id}" style="color:${txt};opacity:.7;">${Math.round(p)} W</span>` : ""}</div>
        <div class="ihr">${this._toggleHtml(on, s.id, true)}<span class="ic" style="color:${txt};">${exp ? "▲" : "▼"}</span></div>
      </div>
      <div class="ibw" style="display:grid;grid-template-rows:${exp && on ? "1fr" : "0fr"};transition:grid-template-rows .3s ease;overflow:hidden;">
        <div style="min-height:0;overflow:hidden;background:${this._shouldGlass() ? "rgba(0,0,0,0.15)" : "#262626"};">${exp && on ? `<div style="padding:12px 12px 8px">${body}</div>` : ""}</div>
      </div>
    </div>`;
  }

  _panelHtml() {
    if (this._activeRoom === null) return "";
    const r = this._config.rooms[this._activeRoom];
    if (!r) return "";
    const sockets = r.sockets || [];
    const grpId = r.group || sockets[0]?.id;
    const on = grpId ? this._on(grpId) : sockets.some((s) => this._on(s.id));
    const watts = sockets.reduce((sum, s) => sum + (this._on(s.id) ? this._power(s) : 0), 0);
    const energy = sockets.reduce((sum, s) => sum + this._energy(s), 0);
    const limit = r.circuit_limit || 3680;
    const pct = (watts / limit) * 100;
    const tone = pct >= 100 ? "danger" : pct >= 80 ? "warn" : "";

    const indHtml = sockets.length
      ? `<hr class="hr"><div class="sec">Individual Sockets</div>${sockets.map((s) => this._socketPanelHtml(s)).join("")}`
      : "";

    return `<div class="panel${this._shouldGlass() ? " glass-panel" : ""}">
      <div class="ph">
        <div class="pl"><div class="pi"><ha-icon icon="${r.icon || "mdi:power-socket-eu"}"></ha-icon></div><span class="pn">${r.label}</span></div>
        ${grpId ? this._toggleHtml(on, grpId, false) : ""}
      </div>
      ${this._meterRow("Power use", "mdi:flash", this._fmtW(watts), pct, tone, "room")}
      <div class="sr"><div class="sl"><span class="sll">Energy today</span><span class="slr" data-room-energy>${this._fmtKwh(energy)}</span></div></div>
      ${indHtml}
    </div>`;
  }

  _updateStates() {
    const root = this.shadowRoot;
    if (!root) return;
    const rooms = this._config.rooms;
    let flipped = false;

    rooms.forEach((r, i) => {
      const tile = root.querySelector(`.tile[data-room="${i}"]`);
      if (!tile) return;
      const sockets = r.sockets || [];
      const style = this._tileStyle(sockets);
      tile.style.background = style.bg;
      const ic = tile.querySelector("ha-icon");
      const nm = tile.querySelector(".tile-name");
      const tw = tile.querySelector(".tile-watts");
      if (ic) ic.style.color = style.text;
      if (nm) nm.style.color = style.text;
      const watts = sockets.reduce((sum, s) => sum + (this._on(s.id) ? this._power(s) : 0), 0);
      const anyOn = sockets.some((s) => this._on(s.id));
      if (tw) {
        tw.textContent = anyOn ? this._fmtW(watts) : "";
        tw.style.color = style.text;
      }
      sockets.forEach((s) => {
        const key = s.id;
        const now = this._on(s.id);
        if (this._lastOn[key] !== undefined && this._lastOn[key] !== now) flipped = true;
        this._lastOn[key] = now;
      });
    });

    if (this._activeRoom === null) {
      this._updateHouseMeter();
      this._applyGlassClass();
      return;
    }

    if (flipped) {
      const pi = root.querySelector("#pi");
      if (pi) {
        pi.innerHTML = this._panelHtml();
        this._reattachPanel();
      }
      this._updateHouseMeter();
      this._applyGlassClass();
      return;
    }

    const r = rooms[this._activeRoom];
    const sockets = r?.sockets || [];
    const grpId = r?.group || sockets[0]?.id;
    const on = grpId ? this._on(grpId) : sockets.some((s) => this._on(s.id));
    const tog = root.querySelector(".toggle");
    if (tog) {
      tog.className = "toggle" + (on ? "" : " off");
      const lb = tog.querySelector(".tl");
      if (lb) lb.textContent = on ? "on" : "off";
    }

    const watts = sockets.reduce((sum, s) => sum + (this._on(s.id) ? this._power(s) : 0), 0);
    const energy = sockets.reduce((sum, s) => sum + this._energy(s), 0);
    const limit = r?.circuit_limit || 3680;
    const roomFill = root.querySelector('[data-fill-entity="room"] .fill');
    const roomLab = root.querySelector('[data-power-label="room"]');
    if (roomFill) roomFill.style.width = `${Math.min(100, (watts / limit) * 100)}%`;
    if (roomLab) roomLab.textContent = this._fmtW(watts);
    const en = root.querySelector("[data-room-energy]");
    if (en) en.textContent = this._fmtKwh(energy);

    sockets.forEach((s) => {
      const eOn = this._on(s.id);
      const p = this._power(s);
      const rated = this._rated(s);
      const hdr = root.querySelector(`.ih[data-expand-socket="${s.id}"]`);
      if (!hdr) return;
      const col = eOn ? this._loadCol(p, rated) : null;
      const txt = col
        ? this._tc(col[0], col[1], col[2])
        : this._shouldGlass()
          ? "rgba(255,255,255,0.82)"
          : "#555";
      hdr.style.background = eOn
        ? `rgb(${col[0]},${col[1]},${col[2]})`
        : this._shouldGlass()
          ? "rgba(255,255,255,0.08)"
          : "#242424";
      hdr.querySelectorAll("ha-icon, .iln, .ibr, .ic").forEach((n) => {
        n.style.color = txt;
      });
      const br = hdr.querySelector(`[data-sock-w="${s.id}"]`);
      if (br) br.textContent = `${Math.round(p)} W`;
      const tg = hdr.querySelector(".tsm");
      if (tg) {
        tg.className = "tsm" + (eOn ? "" : " off");
        const lb = tg.querySelector(".tl");
        if (lb) lb.textContent = eOn ? "on" : "off";
      }
      const fill = root.querySelector(`[data-fill-entity="${s.id}"] .fill`);
      const lab = root.querySelector(`[data-power-label="${s.id}"]`);
      if (fill) fill.style.width = `${Math.min(100, (p / rated) * 100)}%`;
      if (lab) lab.textContent = this._fmtW(p);
      const stats = root.querySelector(`[data-stats="${s.id}"]`);
      if (stats) {
        const v = this._voltage(s);
        const a = this._current(s);
        const ev = this._energy(s);
        const sv = stats.querySelector('[data-stat="v"]');
        const sa = stats.querySelector('[data-stat="a"]');
        const se = stats.querySelector('[data-stat="e"]');
        if (sv) sv.textContent = v ? Math.round(v) + " V" : "—";
        if (sa) sa.textContent = (a ? a.toFixed(2) : "0.00") + " A";
        if (se) se.textContent = this._fmtKwh(ev);
      }
    });
    this._updateHouseMeter();
    this._applyGlassClass();
  }

  _fullRender() {
    const rooms = this._config.rooms;
    const css = `:host{display:block}*{box-sizing:border-box}.wrap{padding:12px;font-family:var(--primary-font-family)}.title{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#666;margin-bottom:14px}.grid{display:grid;grid-template-columns:repeat(${this._config.columns || 3},1fr);gap:10px;margin-bottom:12px}.grid.meter-row{grid-template-columns:1fr 1fr}.tile{border-radius:14px;padding:22px 10px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;cursor:pointer;border:2px solid transparent;min-height:100px}.tile.active{border-color:#EF9F27}.tile ha-icon{--mdi-icon-size:26px}.tile-name{font-size:13px;font-weight:500;text-align:center}.tile-watts{font-size:11px;opacity:.75}.pa{display:grid;grid-template-rows:0fr;overflow:hidden}.pa.open{grid-template-rows:1fr}.pa.anim{transition:grid-template-rows .35s ease}.pai{min-height:0;overflow:hidden}.panel{background:#1e1e1e;border-radius:14px;padding:18px;margin-bottom:10px}.ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px}.pl{display:flex;align-items:center;gap:10px;min-width:0}.pi{width:28px;height:28px;border-radius:7px;background:#2a2a2a;display:flex;align-items:center;justify-content:center}.pi ha-icon{--mdi-icon-size:16px;color:#EF9F27}.pn{font-size:17px;font-weight:600;color:#fff}.toggle{display:flex;align-items:center;gap:6px;border:none;border-radius:100px;padding:6px 10px 6px 14px;cursor:pointer;font-size:13px;font-weight:600;transition:background .3s,color .3s;background:#EF9F27;color:#1a0e00}.toggle.off{background:#333;color:#888}.tsm{display:flex;align-items:center;gap:5px;border:none;border-radius:100px;padding:4px 8px 4px 10px;cursor:pointer;font-size:12px;font-weight:600;transition:background .3s;background:#EF9F27;color:#1a0e00}.tsm.off{background:#333;color:#888}.td{width:18px;height:18px;border-radius:50%;background:#fff;display:inline-block;transition:background .3s}.toggle.off .td,.tsm.off .td{background:#555}.sr{margin-bottom:10px;padding:0 2px}.sl{display:flex;justify-content:space-between;margin-bottom:5px}.sll{font-size:12px;color:#888;display:flex;align-items:center;gap:6px}.sll ha-icon{--mdi-icon-size:14px;color:#555}.slr{font-size:12px;color:#666}.track{position:relative;height:7px;border-radius:4px;overflow:hidden;background:#141414}.track .fill{height:100%;border-radius:inherit;background:linear-gradient(to right,#5a3a10,#EF9F27,#ffe0a0);transition:width .35s ease}.track.warn .fill{background:linear-gradient(to right,#5a3a10,#EF9F27,#e07a3a)}.track.danger .fill{background:linear-gradient(to right,#5a2010,#e24b4a,#ffb0a0)}.hr{border:none;border-top:.5px solid #2e2e2e;margin:14px 0}.sec{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#555;margin-bottom:10px}.ip{border-radius:10px;overflow:hidden;margin-bottom:8px}.ih{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:pointer;gap:8px}.ihl{display:flex;align-items:center;gap:8px;min-width:0}.ihl ha-icon{--mdi-icon-size:15px}.iln{font-size:13px;font-weight:500}.ibr{font-size:12px;margin-left:4px}.ihr{display:flex;align-items:center;gap:8px}.ic{font-size:10px;opacity:.7}.ibw{display:grid;overflow:hidden}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.st{background:rgba(255,255,255,.04);border-radius:8px;padding:8px}.stl{display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#666;margin-bottom:4px}.stv{font-size:13px;color:#ddd}.hint{text-align:center;font-size:11px;color:#3a3a3a;margin-top:8px}:host(.glass){border-radius:22px!important;overflow:hidden!important}.wrap.glass{background:transparent!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;margin:-12px;padding:12px}.wrap.glass .title{color:rgba(255,255,255,.75)}.wrap.glass .hint{color:rgba(255,255,255,.3)}.wrap.glass .pn{color:#fff}.wrap.glass .sec{color:rgba(255,255,255,.45)}.wrap.glass .hr{border-top-color:rgba(255,255,255,.1)}.wrap.glass .sll{color:rgba(255,255,255,.7)}.wrap.glass .sll ha-icon{color:rgba(255,255,255,.4)}.wrap.glass .slr{color:rgba(255,255,255,.6)}.wrap.glass .pi{background:rgba(255,255,255,.1)}.wrap.glass .toggle.off,.wrap.glass .tsm.off{background:rgba(255,255,255,.12);color:rgba(255,255,255,.7)}.wrap.glass .panel{background:rgba(35,25,55,0.4)!important;border:1px solid rgba(255,255,255,.15)}`;

    const gridHtml = rooms
      .map((r, i) => {
        const sockets = r.sockets || [];
        const style = this._tileStyle(sockets);
        const watts = sockets.reduce((sum, s) => sum + (this._on(s.id) ? this._power(s) : 0), 0);
        const anyOn = sockets.some((s) => this._on(s.id));
        const active = this._activeRoom === i;
        return `<div class="tile${active ? " active" : ""}" data-room="${i}" style="background:${style.bg};"><ha-icon icon="${r.icon || "mdi:power-socket-eu"}" style="color:${style.text};"></ha-icon><span class="tile-name" style="color:${style.text};">${r.label}</span><span class="tile-watts" style="color:${style.text};">${anyOn ? this._fmtW(watts) : ""}</span></div>`;
      })
      .join("");

    const titleStyle = this._config.title_color ? ` style="color:${this._config.title_color}"` : "";
    this.shadowRoot.innerHTML = `<style>${css}</style><div class="wrap"><div class="title"${titleStyle}>${this._config.title || "Socket Control"}</div>${this._houseMeterHtml()}<div class="grid">${gridHtml}</div><div class="pa${this._activeRoom !== null ? " open" : ""}" id="pa"><div class="pai" id="pi">${this._panelHtml()}</div></div><div class="hint">tap room to expand</div></div>`;
    this._applyGlassClass();
    this._attachEvents();
  }

  _toggleRoom(idx) {
    const newRoom = this._activeRoom === idx ? null : idx;
    this._activeRoom = newRoom;
    const root = this.shadowRoot,
      pa = root.querySelector("#pa"),
      pi = root.querySelector("#pi");
    root.querySelectorAll(".tile[data-room]").forEach((t) =>
      t.classList.toggle("active", parseInt(t.dataset.room) === newRoom),
    );
    pa.classList.add("anim");
    if (newRoom !== null) {
      pi.innerHTML = this._panelHtml();
      this._reattachPanel();
      pa.classList.remove("open");
      void pa.offsetHeight;
      pa.classList.add("open");
    } else {
      pa.classList.remove("open");
      pa.addEventListener(
        "transitionend",
        () => {
          pi.innerHTML = "";
          pa.classList.remove("anim");
        },
        { once: true },
      );
      return;
    }
    pa.addEventListener("transitionend", () => pa.classList.remove("anim"), { once: true });
  }

  _reattachPanel() {
    const root = this.shadowRoot;
    root.querySelectorAll("[data-expand-socket]").forEach((h) => {
      h.addEventListener("click", (e) => {
        if (e.target.closest("[data-toggle-entity]")) return;
        const id = h.dataset.expandSocket;
        if (this._expanded.has(id)) this._expanded.delete(id);
        else this._expanded.add(id);
        const pi = root.querySelector("#pi");
        if (pi) {
          pi.innerHTML = this._panelHtml();
          this._reattachPanel();
        }
      });
    });
    root.querySelectorAll("[data-toggle-entity]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const en = btn.dataset.toggleEntity,
          d = btn.dataset.toggleDomain,
          st = this._s(en);
        this._call(d, st?.state === "on" ? "turn_off" : "turn_on", { entity_id: en });
      });
    });
  }

  _attachEvents() {
    const root = this.shadowRoot;
    root.querySelectorAll(".tile[data-room]").forEach((t) =>
      t.addEventListener("click", () => this._toggleRoom(parseInt(t.dataset.room))),
    );
    this._reattachPanel();
  }

  getCardSize() {
    return 8;
  }
  static getConfigElement() {
    return document.createElement("universal-socket-card-editor");
  }
  static getStubConfig() {
    return {
      title: "Socket Control",
      power: "sensor.house_power",
      energy: "sensor.house_energy_today",
      rooms: [
        {
          label: "Kitchen",
          icon: "mdi:countertop",
          group: "switch.kitchen",
          circuit_limit: 3680,
          sockets: [
            {
              label: "Kettle",
              id: "switch.kettle",
              power: "sensor.kettle_power",
              energy: "sensor.kettle_energy",
              rated: 2200,
            },
          ],
        },
      ],
    };
  }
}

customElements.define("universal-socket-card", UniversalSocketCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "universal-socket-card",
  name: "Universal Socket Card",
  description: "Room-tile socket control with live power use",
});

class UniversalSocketCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._expandedRooms = new Set();
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.rooms) this._config.rooms = [];
    this.render();
  }

  _fire() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _energyIds() {
    const v = this._config.energy;
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    return [v];
  }

  _setEnergyAt(index, id) {
    const list = this._energyIds();
    if (id) list[index] = id;
    else list.splice(index, 1);
    const clean = list.filter(Boolean);
    if (!clean.length) delete this._config.energy;
    else if (clean.length === 1) this._config.energy = clean[0];
    else this._config.energy = clean;
    this._fire();
  }

  _set(path, value) {
    const keys = path.split(".");
    let obj = this._config;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = isNaN(keys[i]) ? keys[i] : parseInt(keys[i]);
      obj = obj[k];
    }
    const last = isNaN(keys[keys.length - 1]) ? keys[keys.length - 1] : parseInt(keys[keys.length - 1]);
    if (value === undefined || value === null || value === "") delete obj[last];
    else obj[last] = value;
    this._fire();
    this.render();
  }

  _addRoom() {
    this._config.rooms.push({
      label: "New Room",
      icon: "mdi:power-socket-eu",
      group: "",
      sockets: [],
    });
    this._expandedRooms.add(this._config.rooms.length - 1);
    this._fire();
    this.render();
  }

  _removeRoom(i) {
    this._config.rooms.splice(i, 1);
    this._expandedRooms.delete(i);
    this._fire();
    this.render();
  }

  _moveRoom(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= this._config.rooms.length) return;
    [this._config.rooms[i], this._config.rooms[j]] = [this._config.rooms[j], this._config.rooms[i]];
    this._fire();
    this.render();
  }

  _addSocket(ri) {
    if (!this._config.rooms[ri].sockets) this._config.rooms[ri].sockets = [];
    this._config.rooms[ri].sockets.push({ label: "", id: "", power: "", energy: "", rated: 1000 });
    this._fire();
    this.render();
  }

  _removeSocket(ri, si) {
    this._config.rooms[ri].sockets.splice(si, 1);
    this._fire();
    this.render();
  }

  _toggleRoom(i) {
    if (this._expandedRooms.has(i)) this._expandedRooms.delete(i);
    else this._expandedRooms.add(i);
    this.render();
  }

  render() {
    const cfg = this._config;
    const rooms = cfg.rooms || [];
    const css = `
      :host { display: block; }
      * { box-sizing: border-box; }
      .editor { padding: 4px 0 16px; font-family: var(--primary-font-family); }
      .section-title { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #888; margin: 18px 0 10px; }
      .field { margin-bottom: 12px; }
      .field label { display: block; font-size: 12px; color: #aaa; margin-bottom: 4px; }
      .field input { width: 100%; padding: 8px 10px; background: var(--card-background-color, #2a2a2a); border: 1px solid var(--divider-color, #444); border-radius: 8px; color: var(--primary-text-color, #fff); font-size: 13px; outline: none; }
      .field input:focus { border-color: #EF9F27; }
      .room-list { display: flex; flex-direction: column; gap: 8px; }
      .room-card { background: var(--card-background-color, #1e1e1e); border-radius: 10px; overflow: hidden; border: 1px solid var(--divider-color, #333); }
      .room-header { display: flex; align-items: center; padding: 10px 12px; cursor: pointer; gap: 8px; }
      .room-header-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--primary-text-color, #fff); }
      .room-body { padding: 14px; border-top: 1px solid var(--divider-color, #2a2a2a); }
      .icon-btn { background: none; border: none; color: var(--secondary-text-color, #666); cursor: pointer; padding: 4px 6px; border-radius: 4px; font-size: 13px; }
      .icon-btn:hover { color: #EF9F27; }
      .icon-btn.danger:hover { color: #e74c3c; }
      .light-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
      .light-row { background: var(--secondary-background-color, #262626); border-radius: 8px; padding: 10px; }
      .light-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .add-btn { display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(239,159,39,.08); border: 1px dashed #EF9F27; border-radius: 8px; color: #EF9F27; padding: 9px 12px; cursor: pointer; font-size: 12px; width: 100%; margin-top: 10px; }
      .row { display: flex; gap: 10px; }
      .row .field { flex: 1; min-width: 0; }
      .hint { font-size: 11px; color: var(--secondary-text-color, #666); margin-top: 4px; font-style: italic; }
      ha-entity-picker, ha-icon-picker { display: block; width: 100%; }
      .sub-label { font-size: 11px; color: var(--secondary-text-color, #666); text-transform: uppercase; letter-spacing: .05em; margin: 12px 0 6px; }
    `;

    const roomsHtml = rooms
      .map((r, i) => {
        const expanded = this._expandedRooms.has(i);
        const socketsHtml = (r.sockets || [])
          .map(
            (s, si) => `
        <div class="light-row">
          <div class="light-fields">
            <div class="field"><label>Label</label><input value="${s.label || ""}" data-path="rooms.${i}.sockets.${si}.label" placeholder="Kettle" /></div>
            <div class="field"><label>Switch</label>
              <ha-entity-picker value="${s.id || ""}" allow-custom-entity data-sock-id="${i},${si}"></ha-entity-picker>
            </div>
            <div class="field"><label>Power sensor (W)</label>
              <ha-entity-picker value="${s.power || ""}" allow-custom-entity data-sock-power="${i},${si}"></ha-entity-picker>
            </div>
            <div class="field"><label>Energy sensor (kWh)</label>
              <ha-entity-picker value="${s.energy || ""}" allow-custom-entity data-sock-energy="${i},${si}"></ha-entity-picker>
            </div>
            <div class="field"><label>Rated watts</label>
              <input type="number" value="${s.rated || ""}" data-path="rooms.${i}.sockets.${si}.rated" placeholder="2200" />
            </div>
          </div>
          <button class="icon-btn danger" data-remove-socket="${i},${si}" title="Remove" style="margin-top:8px">✕</button>
        </div>`,
          )
          .join("");

        return `<div class="room-card">
        <div class="room-header" data-toggle-room="${i}">
          <span>${expanded ? "▲" : "▼"}</span>
          ${r.icon ? `<ha-icon icon="${r.icon}" style="--mdi-icon-size:18px;color:#EF9F27;"></ha-icon>` : ""}
          <span class="room-header-label">${r.label || "Room " + (i + 1)}</span>
          <button class="icon-btn" data-move-room="${i},-1">↑</button>
          <button class="icon-btn" data-move-room="${i},1">↓</button>
          <button class="icon-btn danger" data-remove-room="${i}">✕</button>
        </div>
        ${
          expanded
            ? `<div class="room-body">
          <div class="row">
            <div class="field" style="max-width:140px"><label>Icon</label>
              <ha-icon-picker value="${r.icon || ""}" data-icon-room="${i}"></ha-icon-picker>
            </div>
            <div class="field"><label>Room Label</label>
              <input value="${r.label || ""}" data-path="rooms.${i}.label" />
            </div>
          </div>
          <div class="field"><label>Group / main switch</label>
            <ha-entity-picker value="${r.group || ""}" allow-custom-entity data-group-room="${i}"></ha-entity-picker>
          </div>
          <div class="field"><label>Circuit limit (W)</label>
            <input type="number" value="${r.circuit_limit || 3680}" data-path="rooms.${i}.circuit_limit" />
          </div>
          <div class="sub-label">Sockets</div>
          <div class="light-list">${socketsHtml}</div>
          <button class="add-btn" data-add-socket="${i}">+ Add Socket</button>
        </div>`
            : ""
        }
      </div>`;
      })
      .join("");

    this.shadowRoot.innerHTML = `<style>${css}</style>
      <div class="editor">
        <div class="section-title">Card Settings</div>
        <div class="row">
          <div class="field"><label>Title</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input value="${cfg.title || "Socket Control"}" data-path="title" style="flex:1" />
              <input type="color" value="${cfg.title_color || "#666666"}" data-path="title_color" style="width:36px;height:36px;padding:2px;border-radius:6px;border:1px solid var(--divider-color,#444);background:var(--card-background-color,#2a2a2a);cursor:pointer;flex-shrink:0" />
            </div>
          </div>
          <div class="field" style="max-width:90px"><label>Columns</label>
            <input type="number" min="1" max="6" value="${cfg.columns || 3}" data-path="columns" />
          </div>
        </div>
        <div class="row" style="align-items:center;gap:10px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
            <input type="checkbox" data-path="glass_mode" ${cfg.glass_mode ? "checked" : ""} style="width:16px;height:16px;cursor:pointer" />
            Glass mode
          </label>
        </div>
        <div class="section-title">House meter</div>
        <div class="field"><label>Current use (W)</label>
          <ha-entity-picker value="${cfg.power || ""}" allow-custom-entity data-house-power-entity></ha-entity-picker>
          <div class="hint">Optional. Your meter’s live power sensor. Leave blank to sum the sockets on this card.</div>
        </div>
        <div class="field"><label>Today (kWh)</label>
          <ha-entity-picker value="${this._energyIds()[0] || ""}" allow-custom-entity data-house-energy-entity></ha-entity-picker>
          <div class="hint">Off-peak or a single daily total. Add peak below to match your mushroom sum.</div>
        </div>
        <div class="field"><label>Today extra (kWh)</label>
          <ha-entity-picker value="${this._energyIds()[1] || ""}" allow-custom-entity data-house-energy-entity-2></ha-entity-picker>
          <div class="hint">Optional. Peak (or a second tariff). The Today tile adds both.</div>
        </div>
        <div class="section-title">Rooms</div>
        <div class="room-list">${roomsHtml}</div>
        <button class="add-btn" id="add-room-btn" style="margin-top:12px">+ Add Room</button>
      </div>`;

    this._attachEvents();
    this._wireHassPickers();
  }

  _wireHassPickers() {
    if (!this._hass) return;
    this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((p) => {
      p.hass = this._hass;
    });
  }

  _attachEvents() {
    const root = this.shadowRoot;
    root.querySelectorAll("input[data-path]").forEach((input) => {
      input.addEventListener("change", () => {
        const val =
          input.type === "checkbox"
            ? input.checked
            : input.type === "number"
              ? parseInt(input.value)
              : input.value;
        this._set(input.dataset.path, val);
      });
    });
    root.querySelectorAll("ha-icon-picker[data-icon-room]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        this._config.rooms[parseInt(picker.dataset.iconRoom)].icon = e.detail.value;
        this._fire();
        this.render();
      });
    });
    root.querySelectorAll("ha-entity-picker[data-group-room]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        this._config.rooms[parseInt(picker.dataset.groupRoom)].group = e.detail.value || "";
        this._fire();
        this.render();
      });
    });
    root.querySelectorAll("ha-entity-picker[data-house-power-entity]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        this._config.power = e.detail.value || "";
        if (!this._config.power) delete this._config.power;
        this._fire();
      });
    });
    root.querySelectorAll("ha-entity-picker[data-house-energy-entity]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        this._setEnergyAt(0, e.detail.value || "");
      });
    });
    root.querySelectorAll("ha-entity-picker[data-house-energy-entity-2]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        this._setEnergyAt(1, e.detail.value || "");
      });
    });
    root.querySelectorAll("ha-entity-picker[data-sock-id]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        const [ri, si] = picker.dataset.sockId.split(",").map(Number);
        this._config.rooms[ri].sockets[si].id = e.detail.value || "";
        if (!this._config.rooms[ri].sockets[si].label && e.detail.value && this._hass) {
          const name = this._hass.states[e.detail.value]?.attributes?.friendly_name;
          if (name) this._config.rooms[ri].sockets[si].label = name;
        }
        this._fire();
        this.render();
      });
    });
    root.querySelectorAll("ha-entity-picker[data-sock-power]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        const [ri, si] = picker.dataset.sockPower.split(",").map(Number);
        this._config.rooms[ri].sockets[si].power = e.detail.value || "";
        this._fire();
      });
    });
    root.querySelectorAll("ha-entity-picker[data-sock-energy]").forEach((picker) => {
      picker.addEventListener("value-changed", (e) => {
        const [ri, si] = picker.dataset.sockEnergy.split(",").map(Number);
        this._config.rooms[ri].sockets[si].energy = e.detail.value || "";
        this._fire();
      });
    });
    root.querySelectorAll("[data-toggle-room]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        this._toggleRoom(parseInt(el.dataset.toggleRoom));
      });
    });
    root.querySelector("#add-room-btn")?.addEventListener("click", () => this._addRoom());
    root.querySelectorAll("[data-remove-room]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._removeRoom(parseInt(btn.dataset.removeRoom));
      });
    });
    root.querySelectorAll("[data-move-room]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const [i, dir] = btn.dataset.moveRoom.split(",").map(Number);
        this._moveRoom(i, dir);
      });
    });
    root.querySelectorAll("[data-add-socket]").forEach((btn) => {
      btn.addEventListener("click", () => this._addSocket(parseInt(btn.dataset.addSocket)));
    });
    root.querySelectorAll("[data-remove-socket]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const [ri, si] = btn.dataset.removeSocket.split(",").map(Number);
        this._removeSocket(ri, si);
      });
    });
    this._wireHassPickers();
  }
}

customElements.define("universal-socket-card-editor", UniversalSocketCardEditor);
