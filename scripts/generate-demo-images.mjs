// Generates the illustrated menu pictures used by the pizza demo data.
// Output: client/public/demo/*.svg  (served at /demo/<name>.svg)
// Run: node scripts/generate-demo-images.mjs
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "client", "public", "demo");
mkdirSync(OUT, { recursive: true });

const W = 400;
const H = 300;

/** Small seeded random generator so images are identical on every run. */
function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function frame(bg1, bg2, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
    <radialGradient id="shade" cx="0.5" cy="0.45" r="0.6"><stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.25"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${body}
</svg>
`;
}

/** Random points inside a circle. */
function scatter(rand, count, radius, cx = 200, cy = 150) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, rand()]);
  }
  return pts;
}

const TOPPING = {
  basil: (x, y, t) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="#2e7d32" transform="rotate(${t * 180} ${x} ${y})"/>`,
  mozzarella: (x, y) => `<circle cx="${x}" cy="${y}" r="15" fill="#fffdf2" opacity="0.95"/>`,
  pepperoni: (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="#b5332e"/><circle cx="${x - 3}" cy="${y - 3}" r="2" fill="#8e1f1b"/><circle cx="${x + 4}" cy="${y + 2}" r="1.6" fill="#8e1f1b"/>`,
  ham: (x, y, t) => `<rect x="${x - 9}" y="${y - 7}" width="18" height="14" rx="3" fill="#f4a3a8" transform="rotate(${t * 90} ${x} ${y})"/>`,
  pineapple: (x, y, t) => `<path d="M${x - 9} ${y + 6} L${x} ${y - 9} L${x + 9} ${y + 6} Z" fill="#ffd54f" transform="rotate(${t * 120} ${x} ${y})"/>`,
  mushroom: (x, y, t) => `<g transform="rotate(${t * 360} ${x} ${y})"><path d="M${x - 10} ${y} a10 8 0 0 1 20 0 Z" fill="#d7c4a3"/><rect x="${x - 3}" y="${y}" width="6" height="7" fill="#ede0c8"/></g>`,
  olive: (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="#2b2b2b"/><circle cx="${x}" cy="${y}" r="2.2" fill="#c0392b"/>`,
  capsicum: (x, y, t) => `<path d="M${x - 10} ${y} q10 -10 20 0" stroke="#43a047" stroke-width="4" fill="none" stroke-linecap="round" transform="rotate(${t * 360} ${x} ${y})"/>`,
  redcapsicum: (x, y, t) => `<path d="M${x - 10} ${y} q10 -10 20 0" stroke="#e53935" stroke-width="4" fill="none" stroke-linecap="round" transform="rotate(${t * 360} ${x} ${y})"/>`,
  onion: (x, y, t) => `<path d="M${x - 9} ${y} a9 9 0 0 1 18 0" stroke="#ce93d8" stroke-width="3" fill="none" transform="rotate(${t * 360} ${x} ${y})"/>`,
  bacon: (x, y, t) => `<rect x="${x - 12}" y="${y - 4}" width="24" height="8" rx="3" fill="#a0413a" transform="rotate(${t * 180} ${x} ${y})"/><rect x="${x - 12}" y="${y - 1}" width="24" height="2" fill="#f3c6b8" transform="rotate(${t * 180} ${x} ${y})"/>`,
  chicken: (x, y, t) => `<rect x="${x - 8}" y="${y - 6}" width="16" height="12" rx="5" fill="#d9a35f" transform="rotate(${t * 90} ${x} ${y})"/>`,
  sausage: (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#8d5a3b"/><circle cx="${x - 2}" cy="${y - 2}" r="2" fill="#a9714f"/>`,
  prawn: (x, y, t) => `<path d="M${x - 10} ${y} a10 10 0 1 1 10 10" stroke="#ff8a65" stroke-width="6" fill="none" stroke-linecap="round" transform="rotate(${t * 360} ${x} ${y})"/>`,
  chilli: (x, y, t) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="3" fill="#d32f2f" transform="rotate(${t * 180} ${x} ${y})"/>`,
  pumpkin: (x, y, t) => `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="4" fill="#ef8f2a" transform="rotate(${t * 90} ${x} ${y})"/>`,
  feta: (x, y, t) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="2" fill="#fafafa" transform="rotate(${t * 90} ${x} ${y})"/>`,
  spinach: (x, y, t) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="7" fill="#388e3c" transform="rotate(${t * 180} ${x} ${y})"/>`,
  truffle: (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="#3e2723"/>`,
  bbq: (x, y, t) => `<path d="M${x - 14} ${y} q14 -12 28 0" stroke="#5d2e1a" stroke-width="3" fill="none" opacity="0.8" transform="rotate(${t * 360} ${x} ${y})"/>`,
  nutella: (x, y, t) => `<path d="M${x - 16} ${y} q8 -10 16 0 t16 0" stroke="#4e2a12" stroke-width="6" fill="none" stroke-linecap="round" transform="rotate(${t * 180} ${x} ${y})"/>`,
  strawberry: (x, y) => `<path d="M${x} ${y + 9} q-10 -6 -8 -14 q8 -3 16 0 q2 8 -8 14 Z" fill="#e53935"/><path d="M${x - 5} ${y - 6} l5 -3 l5 3" stroke="#43a047" stroke-width="2" fill="none"/>`,
};

function pizza(name, { sauce = "#c8412b", cheese = "#f6d77b", toppings = [], bg = ["#fbe9d7", "#f3c99b"] }) {
  const rand = rng(name);
  const cheeseBlobs = scatter(rand, 26, 88)
    .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(14 + rand() * 10).toFixed(1)}" fill="${cheese}" opacity="0.9"/>`)
    .join("");
  const tops = toppings
    .flatMap(([kind, count]) => scatter(rand, count, 82).map(([x, y, t]) => TOPPING[kind](x.toFixed(1), y.toFixed(1), t)))
    .join("");
  const body = `
  <ellipse cx="200" cy="160" rx="150" ry="132" fill="#8d5524" filter="url(#soft)"/>
  <ellipse cx="200" cy="155" rx="150" ry="132" fill="#b07a45"/>
  <circle cx="200" cy="150" r="116" fill="#d9a066"/>
  <circle cx="200" cy="150" r="116" fill="none" stroke="#c48a4f" stroke-width="6" stroke-dasharray="3 9" opacity="0.6"/>
  <circle cx="200" cy="150" r="102" fill="${sauce}"/>
  ${cheeseBlobs}
  ${tops}
  <circle cx="200" cy="150" r="116" fill="url(#shade)"/>`;
  return frame(bg[0], bg[1], body);
}

function plate(inner, bg = ["#eef4ea", "#cfe3c3"]) {
  return frame(
    bg[0],
    bg[1],
    `<ellipse cx="200" cy="160" rx="140" ry="118" fill="#000" opacity="0.12"/>
  <circle cx="200" cy="150" r="125" fill="#ffffff" filter="url(#soft)"/>
  <circle cx="200" cy="150" r="98" fill="#f6f6f4"/>
  ${inner}`,
  );
}

const IMAGES = {
  // ── Classic pizzas
  margherita: pizza("margherita", { toppings: [["mozzarella", 7], ["basil", 8]] }),
  pepperoni: pizza("pepperoni", { toppings: [["pepperoni", 16]] }),
  hawaiian: pizza("hawaiian", { toppings: [["ham", 12], ["pineapple", 12]] }),
  capricciosa: pizza("capricciosa", { toppings: [["ham", 9], ["mushroom", 10], ["olive", 8]] }),
  vegetarian: pizza("vegetarian", { toppings: [["capsicum", 10], ["redcapsicum", 8], ["mushroom", 8], ["onion", 8], ["olive", 6]], bg: ["#eef6e6", "#cfe5b8"] }),
  "meat-lovers": pizza("meat-lovers", { toppings: [["pepperoni", 9], ["ham", 7], ["bacon", 7], ["sausage", 8]] }),
  // ── Gourmet pizzas
  "bbq-chicken": pizza("bbq-chicken", { sauce: "#6d2f1c", toppings: [["chicken", 12], ["bacon", 6], ["onion", 7], ["bbq", 5]] }),
  "prawn-chilli": pizza("prawn-chilli", { toppings: [["prawn", 9], ["chilli", 10], ["spinach", 5]], bg: ["#e8f3f8", "#bcdbe8"] }),
  "pumpkin-feta": pizza("pumpkin-feta", { sauce: "#f2e3c2", toppings: [["pumpkin", 11], ["feta", 12], ["spinach", 8]], bg: ["#fdf0e1", "#f6cf9d"] }),
  supreme: pizza("supreme", { toppings: [["pepperoni", 8], ["capsicum", 7], ["mushroom", 6], ["olive", 6], ["onion", 6], ["sausage", 5]] }),
  "truffle-mushroom": pizza("truffle-mushroom", { sauce: "#efe6d0", cheese: "#fbf1d3", toppings: [["mushroom", 16], ["truffle", 30], ["spinach", 4]], bg: ["#efe9e1", "#d6c6b1"] }),
  // ── Sides
  "garlic-bread": frame("#fdf1dc", "#f4d29c", `
  <g filter="url(#soft)">${[0, 1, 2, 3].map((i) => `<rect x="${70 + i * 66}" y="${95 + (i % 2) * 14}" width="60" height="110" rx="22" fill="#e2a85c" transform="rotate(${-8 + i * 5} ${100 + i * 66} 150)"/><rect x="${76 + i * 66}" y="${101 + (i % 2) * 14}" width="48" height="96" rx="18" fill="#f6dc9c" transform="rotate(${-8 + i * 5} ${100 + i * 66} 150)"/>`).join("")}</g>
  ${scatter(rng("gb"), 40, 120).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#4caf50"/>`).join("")}`),
  "cheesy-garlic-bread": frame("#fdf1dc", "#f4d29c", `
  <g filter="url(#soft)">${[0, 1, 2, 3].map((i) => `<rect x="${70 + i * 66}" y="${95 + (i % 2) * 14}" width="60" height="110" rx="22" fill="#e2a85c" transform="rotate(${-8 + i * 5} ${100 + i * 66} 150)"/><rect x="${74 + i * 66}" y="${99 + (i % 2) * 14}" width="52" height="100" rx="20" fill="#f7c948" transform="rotate(${-8 + i * 5} ${100 + i * 66} 150)"/>`).join("")}</g>
  ${scatter(rng("cgb"), 30, 120).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#e8a33d" opacity="0.7"/>`).join("")}`),
  wings: plate(scatter(rng("wings"), 8, 62).map(([x, y, t]) => `<g transform="rotate(${t * 360} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="26" ry="15" fill="#b5541f"/><ellipse cx="${x - 4}" cy="${y - 4}" rx="16" ry="7" fill="#d9772f" opacity="0.8"/></g>`).join("") + `<circle cx="275" cy="210" r="24" fill="#fff8e1" stroke="#e0e0e0" stroke-width="3"/>`, ["#fdeee4", "#f2c3a3"]),
  chips: plate(`${scatter(rng("chips"), 34, 70).map(([x, y, t]) => `<rect x="${x - 4}" y="${y - 24}" width="9" height="48" rx="3" fill="#f2c14e" stroke="#d99a2b" stroke-width="1" transform="rotate(${t * 180} ${x} ${y})"/>`).join("")}<circle cx="282" cy="205" r="26" fill="#fff8e7" stroke="#e8e2d0" stroke-width="3"/>`, ["#fff7e0", "#f6dd9a"]),
  arancini: plate([[160, 125], [240, 125], [160, 185], [240, 185]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="34" fill="#c9852f"/><circle cx="${x - 9}" cy="${y - 10}" r="12" fill="#e3a855" opacity="0.8"/>`).join("") + `<path d="M120 230 q80 -20 160 0" stroke="#c62828" stroke-width="8" fill="none" stroke-linecap="round"/>`, ["#fbeee3", "#efcfae"]),
  // ── Salads
  caesar: plate(`${scatter(rng("caesar"), 26, 78).map(([x, y, t]) => `<ellipse cx="${x}" cy="${y}" rx="24" ry="12" fill="${t > 0.5 ? "#7cb342" : "#9ccc65"}" transform="rotate(${t * 180} ${x} ${y})"/>`).join("")}${scatter(rng("croutons"), 9, 60).map(([x, y, t]) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="3" fill="#d4a24c" transform="rotate(${t * 90} ${x} ${y})"/>`).join("")}${scatter(rng("parm"), 20, 70).map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="3" fill="#fff8e1"/>`).join("")}`),
  rocket: plate(`${scatter(rng("rocket"), 34, 80).map(([x, y, t]) => `<path d="M${x - 14} ${y} q7 -9 14 0 q7 -9 14 0" stroke="#2e7d32" stroke-width="5" fill="none" transform="rotate(${t * 180} ${x} ${y})"/>`).join("")}${scatter(rng("shave"), 14, 60).map(([x, y, t]) => `<path d="M${x - 10} ${y} q10 -6 20 0 q-10 6 -20 0" fill="#fff3c4" transform="rotate(${t * 180} ${x} ${y})"/>`).join("")}`),
  // ── Desserts
  tiramisu: frame("#f6ece4", "#dcc2ab", `
  <ellipse cx="200" cy="232" rx="130" ry="18" fill="#000" opacity="0.12"/>
  <g filter="url(#soft)">
    <path d="M90 120 L310 120 L310 220 L90 220 Z" fill="#f4e7d0"/>
    <rect x="90" y="150" width="220" height="22" fill="#7b4a2a"/>
    <rect x="90" y="195" width="220" height="20" fill="#7b4a2a"/>
    <rect x="90" y="112" width="220" height="16" rx="4" fill="#5d3a22"/>
  </g>
  ${scatter(rng("cocoa"), 60, 100, 200, 118).filter(([, y]) => y > 110 && y < 128).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#3e2418"/>`).join("")}`),
  "nutella-pizza": pizza("nutella-pizza", { sauce: "#5a2d12", cheese: "#6b3a1c", toppings: [["strawberry", 10], ["nutella", 5]], bg: ["#fbe8ec", "#f1bccb"] }),
  gelato: frame("#e9f5f7", "#b8dfe6", `
  <ellipse cx="200" cy="250" rx="80" ry="12" fill="#000" opacity="0.12"/>
  <g filter="url(#soft)">
    <path d="M140 160 L260 160 L235 245 L165 245 Z" fill="#ffffff" stroke="#d6e4e8" stroke-width="3"/>
    <circle cx="175" cy="140" r="42" fill="#f8bbd0"/>
    <circle cx="228" cy="138" r="42" fill="#fff3c4"/>
    <circle cx="202" cy="105" r="36" fill="#8d6e63"/>
  </g>
  <rect x="245" y="70" width="10" height="70" rx="4" fill="#d7a86e" transform="rotate(25 250 105)"/>`),
  // ── Drinks
  cola: frame("#fdecea", "#f5b7b1", `
  <ellipse cx="200" cy="262" rx="62" ry="10" fill="#000" opacity="0.15"/>
  <g filter="url(#soft)">
    <rect x="150" y="60" width="100" height="200" rx="18" fill="#c62828"/>
    <rect x="150" y="60" width="100" height="22" rx="10" fill="#b0bec5"/>
    <rect x="150" y="238" width="100" height="22" rx="10" fill="#b0bec5"/>
    <path d="M150 150 q50 -30 100 0 v20 q-50 -30 -100 0 Z" fill="#ffffff" opacity="0.9"/>
  </g>`),
  "sparkling-water": frame("#e8f4fb", "#b5d8ee", `
  <ellipse cx="200" cy="266" rx="50" ry="9" fill="#000" opacity="0.15"/>
  <g filter="url(#soft)">
    <path d="M180 40 h40 v40 q30 20 30 60 v115 q0 10 -10 10 h-80 q-10 0 -10 -10 v-115 q0 -40 30 -60 Z" fill="#a5d6a7" opacity="0.85"/>
    <rect x="178" y="32" width="44" height="14" rx="4" fill="#2e7d32"/>
    <rect x="150" y="150" width="100" height="50" fill="#ffffff" opacity="0.85"/>
  </g>
  ${scatter(rng("bubbles"), 14, 40, 200, 220).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffffff" opacity="0.8"/>`).join("")}`),
  "lemon-lime-bitters": frame("#fff8e1", "#f3e09a", `
  <ellipse cx="200" cy="262" rx="58" ry="10" fill="#000" opacity="0.15"/>
  <g filter="url(#soft)">
    <path d="M145 70 h110 l-14 185 q-1 8 -9 8 h-64 q-8 0 -9 -8 Z" fill="#ffffff" opacity="0.55" stroke="#e0e0e0" stroke-width="3"/>
    <path d="M150 110 h100 l-11 145 h-78 Z" fill="#f8bbd0" opacity="0.9"/>
  </g>
  <circle cx="250" cy="78" r="30" fill="#cddc39" stroke="#9e9d24" stroke-width="4"/>
  <path d="M250 50 v56 M222 78 h56" stroke="#f0f4c3" stroke-width="3"/>
  <rect x="205" y="35" width="8" height="120" rx="4" fill="#43a047" transform="rotate(12 209 95)"/>`),
};

for (const [name, svg] of Object.entries(IMAGES)) {
  writeFileSync(join(OUT, `${name}.svg`), svg);
}
console.log(`Wrote ${Object.keys(IMAGES).length} images to ${OUT}`);
