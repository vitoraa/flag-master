const GAME_ITEM_COUNT = 195;

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

GAME.unitSingular = "flag";
GAME.unitPlural = "flags";
GAME.promptCounterLabel = "Flag";
GAME.practiceCfgLabel = "Flags";
GAME.initialTheme = "light";
GAME.levels = { 1: "Warming up", 2: "Getting tricky", 3: "Flag nerd zone", 4: "Very hard" };
GAME.trackAnswerEvent = "flag_answered";

GAME.renderPrompt = function (item) {
  $("country-name").textContent = item[1];
};

GAME.renderOption = function (item) {
  return `<button class="flag-btn" data-key="${item[0]}" aria-label="Guess ${item[1]}">
     <img src="${flagUrl(item[0])}" alt="" draggable="false">
     <span class="mark"></span>
   </button>`;
};

GAME.optionKey = function (item) { return item[0]; };

GAME.wrongAnswerText = function (item, clickedKey) {
  const clicked = COUNTRIES.find(c => c[0] === clickedKey);
  return `That flag is ${clicked ? clicked[1] : clickedKey}`;
};
