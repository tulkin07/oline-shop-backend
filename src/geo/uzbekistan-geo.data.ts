export interface GeoDistrict {
  id: string;
  name: string;
  mahallas: string[];
}

export interface GeoRegion {
  id: string;
  name: string;
  districts: GeoDistrict[];
}

interface RawRegion {
  id: string;
  name: string;
  districts: string[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/o[''′`]/g, 'o')
    .replace(/g[''′`]/g, 'g')
    .replace(/[''′`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Mahallalar (qisman) — kalit: "<regionId>:<districtSlug>".
 * To'liq rasmiy ro'yxatni https://data.gov.uz dagi mahalla datasetidan
 * shu mapga qo'shish mumkin; API strukturasi tayyor.
 */
const MAHALLAS: Record<string, string[]> = {
  'toshkent-shahri:yunusobod': [
    'Shaxriston',
    'Yunusobod',
    "Bog'ishamol",
    'Kamolon',
    'Minor',
  ],
  'toshkent-shahri:chilonzor': [
    'Chilonzor',
    'Novza',
    "Qatortol",
    "Beshyog'och",
    "Oqtepa",
  ],
  'toshkent-shahri:shayxontohur': [
    'Chorsu',
    'Gulbahor',
    "Ko'kcha",
    'Eski shahar',
  ],
  'toshkent-shahri:mirobod': ['Mirobod', 'Oybek', "Yangi Farg'ona"],
  'toshkent-shahri:sergeli': ['Sergeli', 'Nilufar', "Cho'pon-ota"],
};

/**
 * Uzbekistan regions and their districts (tumanlar), used for the checkout
 * address dropdowns. Static dataset — no external dependency.
 */
const RAW_REGIONS: RawRegion[] = [
  {
    id: 'qoraqalpogiston',
    name: "Qoraqalpog'iston Respublikasi",
    districts: [
      'Amudaryo', 'Beruniy', 'Bozataw', 'Chimboy', "Ellikqal'a", 'Kegeyli',
      "Mo'ynoq", 'Nukus shahri', "Qonliko'l", "Qorao'zak", "Qo'ng'irot",
      'Shumanay', "Taxtako'pir", 'Taxiatosh', "To'rtko'l", "Xo'jayli",
    ],
  },
  {
    id: 'andijon',
    name: 'Andijon viloyati',
    districts: [
      'Andijon shahri', 'Asaka', 'Baliqchi', "Bo'ston", 'Buloqboshi',
      'Izboskan', 'Jalaquduq', 'Marhamat', "Oltinko'l", 'Paxtaobod',
      "Qo'rg'ontepa", 'Shahrixon', "Ulug'nor", "Xo'jaobod", 'Xonobod',
    ],
  },
  {
    id: 'buxoro',
    name: 'Buxoro viloyati',
    districts: [
      'Buxoro shahri', "G'ijduvon", 'Jondor', 'Kogon', 'Olot', 'Peshku',
      "Qorako'l", 'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent',
    ],
  },
  {
    id: 'fargona',
    name: "Farg'ona viloyati",
    districts: [
      "Farg'ona shahri", "Qo'qon shahri", "Marg'ilon shahri", 'Quvasoy shahri',
      'Beshariq', "Bog'dod", 'Buvayda', "Dang'ara", "Farg'ona tumani", 'Furqat',
      'Oltiariq', 'Quva', 'Rishton', "So'x", 'Toshloq', "Uchko'prik",
      'Yozyovon', "O'zbekiston",
    ],
  },
  {
    id: 'jizzax',
    name: 'Jizzax viloyati',
    districts: [
      'Jizzax shahri', 'Arnasoy', 'Baxmal', "Do'stlik", 'Forish', "G'allaorol",
      "Mirzacho'l", 'Paxtakor', 'Sharof Rashidov', 'Yangiobod', 'Zafarobod',
      'Zarbdor', 'Zomin',
    ],
  },
  {
    id: 'xorazm',
    name: 'Xorazm viloyati',
    districts: [
      'Urganch shahri', 'Xiva shahri', "Bog'ot", 'Gurlan', 'Hazorasp',
      "Qo'shko'pir", 'Shovot', "Tuproqqal'a", 'Xonqa', 'Yangiariq', 'Yangibozor',
    ],
  },
  {
    id: 'namangan',
    name: 'Namangan viloyati',
    districts: [
      'Namangan shahri', 'Chortoq', 'Chust', 'Kosonsoy', 'Mingbuloq',
      'Namangan tumani', 'Norin', 'Pop', "To'raqo'rg'on", "Uchqo'rg'on",
      'Uychi', "Yangiqo'rg'on",
    ],
  },
  {
    id: 'navoiy',
    name: 'Navoiy viloyati',
    districts: [
      'Navoiy shahri', 'Zarafshon shahri', 'Karmana', 'Konimex', 'Navbahor',
      'Nurota', 'Tomdi', 'Uchquduq', 'Xatirchi',
    ],
  },
  {
    id: 'qashqadaryo',
    name: 'Qashqadaryo viloyati',
    districts: [
      'Qarshi shahri', 'Shahrisabz shahri', 'Chiroqchi', 'Dehqonobod',
      "G'uzor", 'Qamashi', 'Qarshi tumani', 'Kasbi', 'Kitob', "Ko'kdala",
      'Koson', 'Mirishkor', 'Muborak', 'Nishon', 'Yakkabog',
    ],
  },
  {
    id: 'samarqand',
    name: 'Samarqand viloyati',
    districts: [
      'Samarqand shahri', "Kattaqo'rg'on shahri", "Bulung'ur", 'Ishtixon',
      'Jomboy', "Kattaqo'rg'on tumani", 'Narpay', 'Nurobod', 'Oqdaryo',
      "Pastdarg'om", 'Paxtachi', 'Payariq', "Qo'shrabot", 'Samarqand tumani',
      'Toyloq', 'Urgut',
    ],
  },
  {
    id: 'sirdaryo',
    name: 'Sirdaryo viloyati',
    districts: [
      'Guliston shahri', 'Yangiyer shahri', 'Shirin shahri', 'Boyovut',
      'Guliston tumani', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod',
      'Sirdaryo tumani', 'Xovos',
    ],
  },
  {
    id: 'surxondaryo',
    name: 'Surxondaryo viloyati',
    districts: [
      'Termiz shahri', 'Angor', 'Bandixon', 'Boysun', 'Denov', "Jarqo'rg'on",
      'Muzrabot', 'Oltinsoy', 'Qiziriq', "Qumqo'rg'on", 'Sariosiyo', 'Sherobod',
      'Shurchi', 'Termiz tumani', 'Uzun',
    ],
  },
  {
    id: 'toshkent-viloyati',
    name: 'Toshkent viloyati',
    districts: [
      'Nurafshon shahri', 'Olmaliq shahri', 'Angren shahri', 'Chirchiq shahri',
      'Bekobod shahri', "Yangiyo'l shahri", "Bo'ka", "Bo'stonliq", 'Chinoz',
      'Ohangaron', "Oqqo'rg'on", "O'rtachirchiq", 'Parkent', 'Piskent',
      'Qibray', 'Quyichirchiq', 'Toshkent tumani', "Yangiyo'l tumani",
      'Yuqorichirchiq', 'Zangiota',
    ],
  },
  {
    id: 'toshkent-shahri',
    name: 'Toshkent shahri',
    districts: [
      'Bektemir', 'Chilonzor', 'Mirobod', "Mirzo Ulug'bek", 'Olmazor',
      'Sergeli', 'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yashnobod',
      'Yunusobod',
    ],
  },
];

export const UZ_REGIONS: GeoRegion[] = RAW_REGIONS.map((region) => ({
  id: region.id,
  name: region.name,
  districts: region.districts.map((name) => {
    const id = slugify(name);
    return { id, name, mahallas: MAHALLAS[`${region.id}:${id}`] ?? [] };
  }),
}));

// Har bir tuman id viloyat ichida yagona bo'lishi kerak.
for (const region of UZ_REGIONS) {
  const seen = new Set<string>();
  for (const district of region.districts) {
    if (seen.has(district.id)) {
      throw new Error(
        `Duplicate district id in geo data: ${region.id}/${district.id}`,
      );
    }
    seen.add(district.id);
  }
}
