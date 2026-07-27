const OTHER_CITIES = {
  "us": ["New York City","Los Angeles","Chicago"],
  "br": ["Rio de Janeiro","São Paulo"],
  "fr": ["Marseille","Lyon","Nice"],
  "de": ["Munich","Frankfurt","Hamburg"],
  "it": ["Milan","Venice","Florence","Naples"],
  "es": ["Barcelona","Valencia","Seville"],
  "gb": ["Manchester","Liverpool","Edinburgh","Birmingham"],
  "jp": ["Osaka","Kyoto"],
  "cn": ["Shanghai","Hong Kong","Guangzhou"],
  "ca": ["Toronto","Vancouver","Montreal"],
  "mx": ["Guadalajara","Cancún","Monterrey"],
  "ar": ["Córdoba","Mendoza","Rosario"],
  "pt": ["Porto"],
  "au": ["Sydney","Melbourne"],
  "in": ["Mumbai","Bangalore","Kolkata"],
  "ru": ["Saint Petersburg"],
  "kr": ["Busan"],
  "nl": ["Rotterdam","The Hague"],
  "ch": ["Zurich","Geneva"],
  "se": ["Gothenburg"],
  "no": ["Bergen"],
  "gr": ["Thessaloniki"],
  "tr": ["Istanbul","Izmir"],
  "eg": ["Alexandria"],
  "za": ["Cape Town","Johannesburg","Durban"],
  "ie": ["Cork","Galway"],
  "dk": ["Aarhus"],
  "be": ["Antwerp","Bruges"],
  "pl": ["Kraków"],
  "at": ["Salzburg"],
  "fi": ["Tampere"],
  "ua": ["Lviv","Odesa"],
  "cl": ["Valparaíso"],
  "co": ["Medellín","Cartagena"],
  "pe": ["Cusco","Arequipa"],
  "uy": ["Punta del Este"],
  "ve": ["Maracaibo"],
  "cu": ["Santiago de Cuba"],
  "th": ["Chiang Mai","Phuket"],
  "vn": ["Ho Chi Minh City","Da Nang"],
  "ph": ["Cebu"],
  "id": ["Bali","Surabaya"],
  "my": ["Penang"],
  "nz": ["Auckland"],
  "il": ["Tel Aviv","Haifa"],
  "sa": ["Jeddah","Mecca"],
  "ae": ["Dubai","Sharjah"],
  "ma": ["Casablanca","Marrakech"],
  "ng": ["Lagos"],
  "ke": ["Mombasa"],
  "cz": ["Brno"],
  "hu": ["Debrecen"],
  "ro": ["Cluj-Napoca"],
  "hr": ["Dubrovnik","Split"],
  "pk": ["Karachi","Lahore"],
  "bd": ["Chittagong"],
  "ec": ["Guayaquil"],
  "bo": ["La Paz","Santa Cruz de la Sierra"],
  "py": ["Ciudad del Este"],
  "pa": ["Colón"],
  "cr": ["Limón"],
  "jm": ["Montego Bay"],
  "ir": ["Isfahan","Shiraz"],
  "iq": ["Basra"],
  "si": ["Maribor"],
  "sk": ["Košice"],
  "rs": ["Novi Sad"],
  "bg": ["Plovdiv","Varna"],
  "lt": ["Kaunas"],
  "ba": ["Mostar"],
  "me": ["Kotor"],
  "mt": ["Sliema","Birkirkara"],
  "cy": ["Limassol"],
  "ge": ["Batumi"],
  "kz": ["Almaty"],
  "uz": ["Samarkand","Bukhara"],
  "lk": ["Colombo","Kandy"],
  "mm": ["Yangon","Mandalay"],
  "kh": ["Siem Reap"],
  "la": ["Luang Prabang"],
  "jo": ["Aqaba"],
  "ly": ["Benghazi"],
  "ci": ["Abidjan"],
  "cm": ["Douala"],
  "tz": ["Dar es Salaam"],
  "zw": ["Bulawayo","Victoria Falls"],
  "fj": ["Nadi","Lautoka"],
  "gt": ["Antigua Guatemala","Quetzaltenango"],
  "hn": ["San Pedro Sula"],
  "sv": ["Santa Ana"],
  "ni": ["Granada","León"],
  "do": ["Santiago","Punta Cana"],
  "ht": ["Cap-Haïtien"],
  "tt": ["San Fernando"],
  "bz": ["Belize City"],
  "af": ["Kandahar"],
  "bi": ["Bujumbura"],
  "bj": ["Cotonou"],
  "bs": ["Freeport"],
  "cd": ["Lubumbashi"],
  "er": ["Massawa"],
  "gm": ["Serekunda"],
  "gq": ["Bata"],
  "mw": ["Blantyre"],
  "ps": ["Gaza City"],
  "sy": ["Aleppo"],
  "sz": ["Manzini"],
  "ye": ["Aden"],
};

// [code, name, tier, capital]  tier 1 = famous, 2 = medium, 3 = hard, 4 = very hard
GAME.items = [
  ["us","United States",1,"Washington, D.C."],
  ["br","Brazil",1,"Brasília"],
  ["fr","France",1,"Paris"],
  ["de","Germany",1,"Berlin"],
  ["it","Italy",1,"Rome"],
  ["es","Spain",1,"Madrid"],
  ["gb","United Kingdom",1,"London"],
  ["jp","Japan",1,"Tokyo"],
  ["cn","China",1,"Beijing"],
  ["ca","Canada",2,"Ottawa"],
  ["mx","Mexico",1,"Mexico City"],
  ["ar","Argentina",1,"Buenos Aires"],
  ["pt","Portugal",1,"Lisbon"],
  ["au","Australia",2,"Canberra"],
  ["in","India",1,"New Delhi"],
  ["ru","Russia",1,"Moscow"],
  ["kr","South Korea",1,"Seoul"],
  ["nl","Netherlands",1,"Amsterdam"],
  ["ch","Switzerland",2,"Bern"],
  ["se","Sweden",1,"Stockholm"],
  ["no","Norway",1,"Oslo"],
  ["gr","Greece",1,"Athens"],
  ["tr","Turkey",2,"Ankara"],
  ["eg","Egypt",1,"Cairo"],
  ["za","South Africa",2,"Pretoria"],
  ["ie","Ireland",1,"Dublin"],
  ["dk","Denmark",1,"Copenhagen"],
  ["be","Belgium",1,"Brussels"],
  ["pl","Poland",2,"Warsaw"],
  ["at","Austria",2,"Vienna"],
  ["fi","Finland",2,"Helsinki"],
  ["ua","Ukraine",2,"Kyiv"],
  ["cl","Chile",2,"Santiago"],
  ["co","Colombia",2,"Bogotá"],
  ["pe","Peru",2,"Lima"],
  ["uy","Uruguay",2,"Montevideo"],
  ["ve","Venezuela",2,"Caracas"],
  ["cu","Cuba",2,"Havana"],
  ["th","Thailand",2,"Bangkok"],
  ["vn","Vietnam",2,"Hanoi"],
  ["ph","Philippines",2,"Manila"],
  ["id","Indonesia",2,"Jakarta"],
  ["my","Malaysia",2,"Kuala Lumpur"],
  ["nz","New Zealand",2,"Wellington"],
  ["il","Israel",3,"Jerusalem"],
  ["sa","Saudi Arabia",2,"Riyadh"],
  ["ae","United Arab Emirates",2,"Abu Dhabi"],
  ["ma","Morocco",2,"Rabat"],
  ["ng","Nigeria",3,"Abuja"],
  ["ke","Kenya",2,"Nairobi"],
  ["cz","Czechia",2,"Prague"],
  ["hu","Hungary",2,"Budapest"],
  ["ro","Romania",2,"Bucharest"],
  ["hr","Croatia",2,"Zagreb"],
  ["pk","Pakistan",2,"Islamabad"],
  ["bd","Bangladesh",2,"Dhaka"],
  ["ec","Ecuador",2,"Quito"],
  ["bo","Bolivia",3,"Sucre"],
  ["py","Paraguay",2,"Asunción"],
  ["pa","Panama",2,"Panama City"],
  ["cr","Costa Rica",2,"San José"],
  ["jm","Jamaica",2,"Kingston"],
  ["ir","Iran",2,"Tehran"],
  ["iq","Iraq",2,"Baghdad"],
  ["si","Slovenia",3,"Ljubljana"],
  ["sk","Slovakia",3,"Bratislava"],
  ["rs","Serbia",3,"Belgrade"],
  ["bg","Bulgaria",3,"Sofia"],
  ["lt","Lithuania",3,"Vilnius"],
  ["ba","Bosnia and Herzegovina",3,"Sarajevo"],
  ["me","Montenegro",3,"Podgorica"],
  ["mt","Malta",3,"Valletta"],
  ["cy","Cyprus",3,"Nicosia"],
  ["ge","Georgia",3,"Tbilisi"],
  ["kz","Kazakhstan",3,"Astana"],
  ["uz","Uzbekistan",3,"Tashkent"],
  ["lk","Sri Lanka",3,"Sri Jayawardenepura Kotte"],
  ["mm","Myanmar",3,"Naypyidaw"],
  ["kh","Cambodia",3,"Phnom Penh"],
  ["la","Laos",3,"Vientiane"],
  ["jo","Jordan",3,"Amman"],
  ["ly","Libya",3,"Tripoli"],
  ["ci","Ivory Coast",3,"Yamoussoukro"],
  ["cm","Cameroon",3,"Yaoundé"],
  ["tz","Tanzania",3,"Dodoma"],
  ["zw","Zimbabwe",3,"Harare"],
  ["fj","Fiji",3,"Suva"],
  ["gt","Guatemala",3,"Guatemala City"],
  ["hn","Honduras",3,"Tegucigalpa"],
  ["sv","El Salvador",3,"San Salvador"],
  ["ni","Nicaragua",3,"Managua"],
  ["do","Dominican Republic",3,"Santo Domingo"],
  ["ht","Haiti",3,"Port-au-Prince"],
  ["tt","Trinidad and Tobago",3,"Port of Spain"],
  ["bz","Belize",3,"Belmopan"],
  ["af","Afghanistan",4,"Kabul"],
  ["bi","Burundi",4,"Gitega"],
  ["bj","Benin",4,"Porto-Novo"],
  ["bs","Bahamas",4,"Nassau"],
  ["cd","DR Congo",4,"Kinshasa"],
  ["er","Eritrea",4,"Asmara"],
  ["gm","Gambia",4,"Banjul"],
  ["gq","Equatorial Guinea",4,"Malabo"],
  ["mw","Malawi",4,"Lilongwe"],
  ["ps","Palestine",4,"Ramallah"],
  ["sy","Syria",4,"Damascus"],
  ["sz","Eswatini",4,"Mbabane"],
  ["ye","Yemen",4,"Sana'a"],
];

const SAME_COUNTRY_DISTRACTOR_CHANCE = 0.75;

// unitSingular/unitPlural/promptCounterLabel/practiceCfgLabel/initialTheme/
// levels/trackAnswerEvent/ranks all come from games.json — this file only
// defines data (COUNTRIES/OTHER_CITIES above) and hooks below.

GAME.renderPrompt = function (item) {
  $("prompt-flag").src = flagUrl(item[0]);
  $("country-name").textContent = item[1];
};

GAME.renderOption = function (item) {
  return `<button class="capital-btn" data-key="${item[3]}" aria-label="Guess ${item[3]}">
     <span class="capital-name">${item[3]}</span>
     <span class="mark"></span>
   </button>`;
};

GAME.optionKey = function (item) { return item[3]; };

GAME.wrongAnswerText = function (item, clickedKey) {
  return `The capital is ${item[3]}`;
};

GAME.onLockButton = function (btn, isCorrect) {
  const color = isCorrect ? "var(--text)" : "var(--muted)";
  btn.style.setProperty("color", color, "important");
  btn.style.setProperty("-webkit-text-fill-color", color, "important");
};

GAME.pickDistractors = function (answer, items) {
  const sameCountry = shuffle((OTHER_CITIES[answer[0]] || []).slice());
  const sameTier = shuffle(items.filter(c => c !== answer && c[2] === answer[2]));
  const otherTier = shuffle(items.filter(c => c !== answer && c[2] !== answer[2]));
  const foreignCapitals = sameTier.concat(otherTier).map(c => c[3]);

  const used = new Set([answer[3]]);
  const picks = [];
  while (picks.length < 3 && (sameCountry.length || foreignCapitals.length)) {
    const useSameCountry = sameCountry.length > 0 &&
      (foreignCapitals.length === 0 || Math.random() < SAME_COUNTRY_DISTRACTOR_CHANCE);
    const candidate = useSameCountry ? sameCountry.shift() : foreignCapitals.shift();
    if (candidate && !used.has(candidate)) { used.add(candidate); picks.push(candidate); }
  }
  return picks.map(cap => items.find(c => c[3] === cap) || { 3: cap });
};
