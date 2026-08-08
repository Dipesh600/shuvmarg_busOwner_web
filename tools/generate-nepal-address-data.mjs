import fs from "node:fs";

const sourcePath = process.argv[2];
const outputPath = process.argv[3];
if (!sourcePath || !outputPath) {
  throw new Error("Usage: node generate-nepal-address-data.mjs <official-html> <output-ts>");
}

const html = fs.readFileSync(sourcePath, "utf8");
const match = html.match(/const ROWS=(\[.*?\]);\s*const PROVS=/s);
if (!match) throw new Error("Official local-level rows were not found.");
const rows = JSON.parse(match[1]);
if (rows.length !== 753) throw new Error(`Expected 753 local levels, found ${rows.length}.`);

const provinceNames = {
  1: "Koshi",
  2: "Madhesh",
  3: "Bagmati",
  4: "Gandaki",
  5: "Lumbini",
  6: "Karnali",
  7: "Sudurpashchim",
};

const districtNames = {
  101: "Taplejung", 102: "Sankhuwasabha", 103: "Solukhumbu", 104: "Okhaldhunga",
  105: "Khotang", 106: "Bhojpur", 107: "Dhankuta", 108: "Terhathum", 109: "Panchthar",
  110: "Ilam", 111: "Jhapa", 112: "Morang", 113: "Sunsari", 114: "Udayapur",
  201: "Saptari", 202: "Siraha", 203: "Dhanusha", 204: "Mahottari", 205: "Sarlahi",
  206: "Rautahat", 207: "Bara", 208: "Parsa",
  301: "Dolakha", 302: "Sindhupalchok", 303: "Rasuwa", 304: "Dhading", 305: "Nuwakot",
  306: "Kathmandu", 307: "Bhaktapur", 308: "Lalitpur", 309: "Kavrepalanchok",
  310: "Ramechhap", 311: "Sindhuli", 312: "Makwanpur", 313: "Chitwan",
  401: "Gorkha", 402: "Manang", 403: "Mustang", 404: "Myagdi", 405: "Kaski",
  406: "Lamjung", 407: "Tanahun", 408: "Nawalpur", 409: "Syangja", 410: "Parbat", 411: "Baglung",
  501: "Eastern Rukum", 502: "Rolpa", 503: "Pyuthan", 504: "Gulmi", 505: "Arghakhanchi",
  506: "Palpa", 507: "Parasi", 508: "Rupandehi", 509: "Kapilvastu", 510: "Dang",
  511: "Banke", 512: "Bardiya",
  601: "Dolpa", 602: "Mugu", 603: "Humla", 604: "Jumla", 605: "Kalikot",
  606: "Dailekh", 607: "Jajarkot", 608: "Rukum Paschim", 609: "Salyan", 610: "Surkhet",
  701: "Bajura", 702: "Bajhang", 703: "Darchula", 704: "Baitadi", 705: "Dadeldhura",
  706: "Doti", 707: "Achham", 708: "Kailali", 709: "Kanchanpur",
};

const provinces = Object.entries(provinceNames).map(([provinceCode, name]) => ({
  code: provinceCode,
  name,
  districts: Object.entries(districtNames)
    .filter(([districtCode]) => districtCode.startsWith(provinceCode))
    .map(([districtCode, districtName]) => ({
      code: districtCode,
      name: districtName,
      municipalities: rows
        .filter((row) => String(row.dCode) === districtCode)
        .map((row) => ({ code: String(row.llCode), name: row.llEn })),
    })),
}));

const output = `// Generated from Nepal National Statistics Office administrative codes.\n` +
  `// Source: https://ec.nsonepal.gov.np/html/admin_code.html (7 provinces, 77 districts, 753 local levels).\n` +
  `export const NEPAL_ADMINISTRATIVE_DIVISIONS = ${JSON.stringify(provinces, null, 2)} as const;\n`;

fs.writeFileSync(outputPath, output);
