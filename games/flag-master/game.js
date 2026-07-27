// [code, name, tier]  tier 1 = famous, 2 = medium, 3 = hard, 4 = very hard
GAME.items = [
  ["us","United States",1],["br","Brazil",1],["fr","France",1],["de","Germany",1],
  ["it","Italy",1],["es","Spain",1],["gb","United Kingdom",1],["jp","Japan",1],
  ["cn","China",1],["ca","Canada",1],["mx","Mexico",1],["ar","Argentina",1],
  ["pt","Portugal",1],["au","Australia",1],["in","India",1],["ru","Russia",1],
  ["kr","South Korea",1],["nl","Netherlands",1],["ch","Switzerland",1],["se","Sweden",1],
  ["no","Norway",1],["gr","Greece",1],["tr","Turkey",1],["eg","Egypt",1],
  ["za","South Africa",1],["ie","Ireland",1],["dk","Denmark",1],["be","Belgium",1],
  ["pl","Poland",2],["at","Austria",2],["fi","Finland",2],["ua","Ukraine",2],
  ["cl","Chile",2],["co","Colombia",2],["pe","Peru",2],["uy","Uruguay",2],
  ["ve","Venezuela",2],["cu","Cuba",2],["th","Thailand",2],["vn","Vietnam",2],
  ["ph","Philippines",2],["id","Indonesia",2],["my","Malaysia",2],["sg","Singapore",2],
  ["nz","New Zealand",2],["il","Israel",2],["sa","Saudi Arabia",2],["ae","United Arab Emirates",2],
  ["ma","Morocco",2],["ng","Nigeria",2],["ke","Kenya",2],["cz","Czechia",2],
  ["hu","Hungary",2],["ro","Romania",2],["hr","Croatia",2],["is","Iceland",2],
  ["pk","Pakistan",2],["bd","Bangladesh",2],["ec","Ecuador",2],["bo","Bolivia",2],
  ["py","Paraguay",2],["pa","Panama",2],["cr","Costa Rica",2],["jm","Jamaica",2],
  ["qa","Qatar",2],["ir","Iran",2],["iq","Iraq",2],["dz","Algeria",2],
  ["si","Slovenia",3],["sk","Slovakia",3],["rs","Serbia",3],["bg","Bulgaria",3],
  ["lt","Lithuania",3],["lv","Latvia",3],["ee","Estonia",3],["md","Moldova",3],
  ["al","Albania",3],["mk","North Macedonia",3],["ba","Bosnia and Herzegovina",3],["me","Montenegro",3],
  ["lu","Luxembourg",3],["mt","Malta",3],["cy","Cyprus",3],["am","Armenia",3],
  ["ge","Georgia",3],["az","Azerbaijan",3],["kz","Kazakhstan",3],["uz","Uzbekistan",3],
  ["kg","Kyrgyzstan",3],["tj","Tajikistan",3],["tm","Turkmenistan",3],["mn","Mongolia",3],
  ["np","Nepal",3],["lk","Sri Lanka",3],["mm","Myanmar",3],["kh","Cambodia",3],
  ["la","Laos",3],["bt","Bhutan",3],["bn","Brunei",3],["om","Oman",3],
  ["kw","Kuwait",3],["bh","Bahrain",3],["jo","Jordan",3],["lb","Lebanon",3],
  ["tn","Tunisia",3],["ly","Libya",3],["sd","Sudan",3],["et","Ethiopia",3],
  ["gh","Ghana",3],["ci","Ivory Coast",3],["sn","Senegal",3],["cm","Cameroon",3],
  ["tz","Tanzania",3],["ug","Uganda",3],["zm","Zambia",3],["zw","Zimbabwe",3],
  ["mz","Mozambique",3],["ao","Angola",3],["na","Namibia",3],["bw","Botswana",3],
  ["mg","Madagascar",3],["mu","Mauritius",3],["fj","Fiji",3],["pg","Papua New Guinea",3],
  ["gt","Guatemala",3],["hn","Honduras",3],["sv","El Salvador",3],["ni","Nicaragua",3],
  ["do","Dominican Republic",3],["ht","Haiti",3],["tt","Trinidad and Tobago",3],["gy","Guyana",3],
  ["sr","Suriname",3],["bz","Belize",3],["mv","Maldives",3],["mc","Monaco",3],
  ["li","Liechtenstein",3],["ad","Andorra",3],["sm","San Marino",3],["va","Vatican City",3],
  ["af","Afghanistan",4],["ag","Antigua and Barbuda",4],["bb","Barbados",4],["bf","Burkina Faso",4],
  ["bi","Burundi",4],["bj","Benin",4],["bs","Bahamas",4],["by","Belarus",4],
  ["cd","DR Congo",4],["cf","Central African Republic",4],["cg","Republic of the Congo",4],["cv","Cabo Verde",4],
  ["dj","Djibouti",4],["dm","Dominica",4],["er","Eritrea",4],["fm","Micronesia",4],
  ["ga","Gabon",4],["gd","Grenada",4],["gm","Gambia",4],["gn","Guinea",4],
  ["gq","Equatorial Guinea",4],["gw","Guinea-Bissau",4],["ki","Kiribati",4],["km","Comoros",4],
  ["kn","Saint Kitts and Nevis",4],["kp","North Korea",4],["lc","Saint Lucia",4],["lr","Liberia",4],
  ["ls","Lesotho",4],["mh","Marshall Islands",4],["ml","Mali",4],["mr","Mauritania",4],
  ["mw","Malawi",4],["ne","Niger",4],["nr","Nauru",4],["ps","Palestine",4],
  ["pw","Palau",4],["rw","Rwanda",4],["sb","Solomon Islands",4],["sc","Seychelles",4],
  ["sl","Sierra Leone",4],["so","Somalia",4],["ss","South Sudan",4],["st","Sao Tome and Principe",4],
  ["sy","Syria",4],["sz","Eswatini",4],["td","Chad",4],["tg","Togo",4],
  ["tl","Timor-Leste",4],["to","Tonga",4],["tv","Tuvalu",4],["vc","Saint Vincent and the Grenadines",4],
  ["vu","Vanuatu",4],["ws","Samoa",4],["ye","Yemen",4],
];

// Portuguese A/B test: shown when the browser is set to pt-* AND the
// "flag-master-pt-localization" PostHog feature flag resolves to "test".
const COUNTRY_NAMES_PT = {
  us: "Estados Unidos", br: "Brasil", fr: "França", de: "Alemanha",
  it: "Itália", es: "Espanha", gb: "Reino Unido", jp: "Japão",
  cn: "China", ca: "Canadá", mx: "México", ar: "Argentina",
  pt: "Portugal", au: "Austrália", in: "Índia", ru: "Rússia",
  kr: "Coreia do Sul", nl: "Países Baixos", ch: "Suíça", se: "Suécia",
  no: "Noruega", gr: "Grécia", tr: "Turquia", eg: "Egito",
  za: "África do Sul", ie: "Irlanda", dk: "Dinamarca", be: "Bélgica",
  pl: "Polónia", at: "Áustria", fi: "Finlândia", ua: "Ucrânia",
  cl: "Chile", co: "Colômbia", pe: "Peru", uy: "Uruguai",
  ve: "Venezuela", cu: "Cuba", th: "Tailândia", vn: "Vietname",
  ph: "Filipinas", id: "Indonésia", my: "Malásia", sg: "Singapura",
  nz: "Nova Zelândia", il: "Israel", sa: "Arábia Saudita", ae: "Emirados Árabes Unidos",
  ma: "Marrocos", ng: "Nigéria", ke: "Quénia", cz: "Chéquia",
  hu: "Hungria", ro: "Roménia", hr: "Croácia", is: "Islândia",
  pk: "Paquistão", bd: "Bangladeche", ec: "Equador", bo: "Bolívia",
  py: "Paraguai", pa: "Panamá", cr: "Costa Rica", jm: "Jamaica",
  qa: "Catar", ir: "Irão", iq: "Iraque", dz: "Argélia",
  si: "Eslovénia", sk: "Eslováquia", rs: "Sérvia", bg: "Bulgária",
  lt: "Lituânia", lv: "Letónia", ee: "Estónia", md: "Moldávia",
  al: "Albânia", mk: "Macedónia do Norte", ba: "Bósnia e Herzegovina", me: "Montenegro",
  lu: "Luxemburgo", mt: "Malta", cy: "Chipre", am: "Arménia",
  ge: "Geórgia", az: "Azerbaijão", kz: "Cazaquistão", uz: "Usbequistão",
  kg: "Quirguistão", tj: "Tajiquistão", tm: "Turquemenistão", mn: "Mongólia",
  np: "Nepal", lk: "Sri Lanka", mm: "Mianmar", kh: "Camboja",
  la: "Laos", bt: "Butão", bn: "Brunei", om: "Omã",
  kw: "Kuwait", bh: "Barém", jo: "Jordânia", lb: "Líbano",
  tn: "Tunísia", ly: "Líbia", sd: "Sudão", et: "Etiópia",
  gh: "Gana", ci: "Costa do Marfim", sn: "Senegal", cm: "Camarões",
  tz: "Tanzânia", ug: "Uganda", zm: "Zâmbia", zw: "Zimbabué",
  mz: "Moçambique", ao: "Angola", na: "Namíbia", bw: "Botsuana",
  mg: "Madagáscar", mu: "Maurícia", fj: "Fiji", pg: "Papua-Nova Guiné",
  gt: "Guatemala", hn: "Honduras", sv: "El Salvador", ni: "Nicarágua",
  do: "República Dominicana", ht: "Haiti", tt: "Trindade e Tobago", gy: "Guiana",
  sr: "Suriname", bz: "Belize", mv: "Maldivas", mc: "Mónaco",
  li: "Liechtenstein", ad: "Andorra", sm: "São Marino", va: "Cidade do Vaticano",
  af: "Afeganistão", ag: "Antígua e Barbuda", bb: "Barbados", bf: "Burquina Faso",
  bi: "Burundi", bj: "Benim", bs: "Baamas", by: "Bielorrússia",
  cd: "RD Congo", cf: "República Centro-Africana", cg: "República do Congo", cv: "Cabo Verde",
  dj: "Jibuti", dm: "Dominica", er: "Eritreia", fm: "Micronésia",
  ga: "Gabão", gd: "Granada", gm: "Gâmbia", gn: "Guiné",
  gq: "Guiné Equatorial", gw: "Guiné-Bissau", ki: "Quiribáti", km: "Comores",
  kn: "São Cristóvão e Neves", kp: "Coreia do Norte", lc: "Santa Lúcia", lr: "Libéria",
  ls: "Lesoto", mh: "Ilhas Marshall", ml: "Mali", mr: "Mauritânia",
  mw: "Malaui", ne: "Níger", nr: "Nauru", ps: "Palestina",
  pw: "Palau", rw: "Ruanda", sb: "Ilhas Salomão", sc: "Seicheles",
  sl: "Serra Leoa", so: "Somália", ss: "Sudão do Sul", st: "São Tomé e Príncipe",
  sy: "Síria", sz: "Essuatíni", td: "Chade", tg: "Togo",
  tl: "Timor-Leste", to: "Tonga", tv: "Tuvalu", vc: "São Vicente e Granadinas",
  vu: "Vanuatu", ws: "Samoa", ye: "Iémen",
};

function countryName(c) {
  return (locale === "pt" && COUNTRY_NAMES_PT[c[0]]) ? COUNTRY_NAMES_PT[c[0]] : c[1];
}

// unitSingular/unitPlural/promptCounterLabel/promptCounterLabelPt/practiceCfgLabel/
// initialTheme/levels/levelsPt/trackAnswerEvent/ranks all come from games.json —
// this file only defines data (COUNTRIES/COUNTRY_NAMES_PT above) and hooks below.

GAME.detectLocale = function (setLocale) {
  try {
    if (navigator.language && navigator.language.toLowerCase().startsWith("pt")) {
      posthog.onFeatureFlags(() => {
        try {
          if (posthog.getFeatureFlag("flag-master-pt-localization") === "test") setLocale("pt");
        } catch {}
      });
    }
  } catch {}
};

GAME.renderPrompt = function (item) {
  $("country-name").textContent = countryName(item);
};

GAME.renderOption = function (item) {
  return `<button class="flag-btn" data-key="${item[0]}" aria-label="Guess ${countryName(item)}">
     <img src="${flagUrl(item[0])}" alt="" draggable="false">
     <span class="mark"></span>
   </button>`;
};

GAME.optionKey = function (item) { return item[0]; };

GAME.wrongAnswerText = function (item, clickedKey) {
  const clicked = COUNTRIES.find(c => c[0] === clickedKey);
  const clickedName = clicked ? countryName(clicked) : clickedKey;
  return locale === "pt" ? `A resposta era ${clickedName}` : `That flag is ${clickedName}`;
};
