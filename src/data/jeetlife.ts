import emote from "../../Configs/emote.js";

export interface CatalogItem {
  id: string;
  name: string;
  category: "card" | "consumable" | "food" | "equipment";
  price: number; // In paise, multiple of 4
  limit: number;
  icon: string;
  description: string;
  effectDescription?: string;
  flavourResponses?: string[];
  requiresShifts?: number;
}

export interface TaskQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface JobDefinition {
  id: string;
  name: string;
  category: "site" | "stall" | "gig";
  brandName?: string;
  tagline: string;
  minShifts: number;
  requiredItem?: string;
  basePay: number; // In paise
  roundBonus: number; // In paise per correct round
  rounds: number;
  questions: TaskQuestion[];
}

export const CATALOG_ITEMS: Record<string, CatalogItem> = {
  mgnrega_card: {
    id: "mgnrega_card",
    name: "MGNREGA Card",
    category: "card",
    price: 0,
    limit: 1,
    icon: emote.mnrega,
    description: "Your official national livelihood employment card. Proof of work attendance.",
  },
  aadhaar_card: {
    id: "aadhaar_card",
    name: "Aadhaar Card",
    category: "card",
    price: 0,
    limit: 1,
    icon: emote.aadhaarCard,
    description: "Mera Aadhaar, Meri Pehchan. Essential for government records.",
  },
  pan_card: {
    id: "pan_card",
    name: "PAN Card",
    category: "card",
    price: 0,
    limit: 1,
    icon: emote.panCard,
    description: "Income Tax department document for recording your huge paise income.",
  },
  chai: {
    id: "chai",
    name: "Tapri Chai",
    category: "consumable",
    price: 8,
    limit: 10,
    icon: "☕",
    description: "Adrak-elaichi wali kadak cutting chai.",
    effectDescription: "Gives 1 retry on an incorrect question during a shift (max 1 used per shift).",
    flavourResponses: [
      "Adrak-elaichi wali kadak cutting chai pee li. Dimag ki batti jal gayi! ☕",
      "Garam garam tapri chai! Thakawat gayab, agle shift ke liye taiyyar.",
      "Chai ke saath parle-g dunk karke khaa liya. Full energy unlock!",
    ],
  },
  vimal: {
    id: "vimal",
    name: "Vimal Packet",
    category: "consumable",
    price: 4,
    limit: 10,
    icon: "✌️",
    description: "Kesar flavour status packet. Purely cosmetic and cultural flavour.",
    effectDescription: "Cosmetic item. Gives no gameplay advantage, only status.",
    flavourResponses: [
      "Dane dane mein kesar ka dum! Aapne style mein zubaan kesari bola.",
      "Pocket se packet nikala aur dosto ke beech thoda swag dikhaya.",
    ],
  },
  samosa: {
    id: "samosa",
    name: "Garam Samosa",
    category: "food",
    price: 12,
    limit: 10,
    icon: "🥟",
    description: "Fresh crispy aloo samosa served with meethi and teekhi chutney.",
    flavourResponses: [
      "Bhaiya ne doono mein garam samosa aur extra meethi chutney di: 'Khao saheb, fresh ghani ka hai!'",
      "Samosa tod ke hari mirch ke saath khaya: 'Waah, maza aa gaya!'",
    ],
  },
  pani_puri: {
    id: "pani_puri",
    name: "Pani Puri Plate",
    category: "food",
    price: 16,
    limit: 10,
    icon: "🥣",
    description: "6 crispy puris with khatta-meetha-teekha pani.",
    flavourResponses: [
      "Chhe ke chhe teekhe golgappe daba ke khaye! Bhaiya bole: 'Ek sookhi papdi to banti hai aakhri mein!'",
      "Pani puri wale bhaiya ne bina dare extra teekha pani banaya. Aankh se aansu, dil se khushi!",
    ],
  },
  chowmein: {
    id: "chowmein",
    name: "Desi Chowmein",
    category: "food",
    price: 20,
    limit: 10,
    icon: "🍜",
    description: "Roadside thela spicy veg chowmein with extra cabbage and chilli sauce.",
    flavourResponses: [
      "Bhaiya ne bade tava pe chowmein uchhal ke plate mein di: 'Thoda red chilli sauce aur daal du?'",
      "Desi street chowmein khayi. Aisi spicy noodles kisi restaurant mein nahi milti!",
    ],
  },
  momos: {
    id: "momos",
    name: "Steamed Momos",
    category: "food",
    price: 24,
    limit: 10,
    icon: "🥟",
    description: "Steamed veg momos with deadly red garlic chutney.",
    flavourResponses: [
      "Bhaiya bole: 'Bhaiya mayo alag se lena, laal chutney mein seedha mirchi ka atom bomb hai!'",
      "Garam garam momos spicy red sauce mein doobokar khaye. Kaano se dhuwan nikal gaya!",
    ],
  },
  gloves: {
    id: "gloves",
    name: "Safety Gloves",
    category: "equipment",
    price: 160,
    limit: 1,
    icon: "🧤",
    description: "Heavy-duty construction gloves. Unlocks higher Gloves pay tier across jobs.",
    effectDescription: "Increases base pay on completed shifts by +8 paise permanently.",
  },
  cycle: {
    id: "cycle",
    name: "Atlas Delivery Cycle",
    category: "equipment",
    price: 480,
    limit: 1,
    icon: "🚲",
    requiresShifts: 12,
    description: "Sturdy black delivery bicycle with a strong carrier for quick deliveries.",
    effectDescription: "Unlocks high-tier modern Quick-Commerce Gig Work ('Jhatpat Delivery') with +16 base pay.",
  },
};

export const JOBS: Record<string, JobDefinition> = {
  maal_utaro: {
    id: "maal_utaro",
    name: "Maal Utaro",
    category: "site",
    tagline: "Unload delivery truck at the construction site.",
    minShifts: 0,
    basePay: 24,
    roundBonus: 8,
    rounds: 3,
    questions: [
      {
        prompt: "Truck Invoice: '40 bori cement aur 15 sariya'. Kounsa load utarna hai?",
        options: [
          "40 bori cement, 15 sariya",
          "50 bori cement, 10 sariya",
          "30 bori cement, 25 sariya",
        ],
        correctIndex: 0,
        explanation: "Invoice ke mutabiq 40 bori cement aur 15 sariya the.",
      },
      {
        prompt: "Contractor order: '25 laal eent (bricks) aur 4 balti paani'. Check karo:",
        options: [
          "20 laal eent, 5 balti paani",
          "25 laal eent, 4 balti paani",
          "30 laal eent, 2 balti paani",
        ],
        correctIndex: 1,
        explanation: "25 laal eent aur 4 balti paani bilkul sahi count tha.",
      },
      {
        prompt: "Supervisor note: '12 lohe ke pipe aur 8 safety helmet'. Kaunsa crate uthaye?",
        options: [
          "12 lohe ke pipe, 8 safety helmet",
          "15 lohe ke pipe, 6 safety helmet",
          "10 lohe ke pipe, 10 safety helmet",
        ],
        correctIndex: 0,
        explanation: "Invoice count exact match tha: 12 pipe aur 8 helmet.",
      },
      {
        prompt: "Godown challan: '60 tile ke dabbe aur 2 fevicol ke can'. Verify karo:",
        options: [
          "50 tile dabbe, 4 can",
          "60 tile ke dabbe, 2 fevicol ke can",
          "70 tile dabbe, 1 can",
        ],
        correctIndex: 1,
        explanation: "60 tile ke dabbe aur 2 fevicol can unload hue.",
      },
      {
        prompt: "Tempo delivery: '18 bori ret (sand) aur 6 tasla cement'. Kaunsa tempo khali kare?",
        options: [
          "18 bori ret, 6 tasla cement",
          "12 bori ret, 8 tasla cement",
          "24 bori ret, 4 tasla cement",
        ],
        correctIndex: 0,
        explanation: "18 bori ret aur 6 tasla cement unload kiya.",
      },
      {
        prompt: "Site manager: '8 bori white cement aur 10 paint ke dabbe'. Kisko floor pe bheje?",
        options: [
          "10 bori white cement, 8 paint dabbe",
          "8 bori white cement, 10 paint ke dabbe",
          "6 bori white cement, 12 paint dabbe",
        ],
        correctIndex: 1,
        explanation: "8 bori white cement aur 10 paint box verify ho gaye.",
      },
      {
        prompt: "Invoice #104: '35 lakdi ke patte aur 500 keel (nails)'. Cargo load select karo:",
        options: [
          "35 lakdi ke patte, 500 keel",
          "45 lakdi ke patte, 300 keel",
          "30 lakdi ke patte, 600 keel",
        ],
        correctIndex: 0,
        explanation: "35 lakdi patte aur 500 keel delivery tally se match hue.",
      },
      {
        prompt: "Urgent shipment: '14 marble slab aur 4 bori adhesive'. Kaunsa bundle utaroge?",
        options: [
          "10 slab, 6 bori adhesive",
          "14 marble slab, 4 bori adhesive",
          "18 slab, 2 bori adhesive",
        ],
        correctIndex: 1,
        explanation: "14 marble slab aur 4 adhesive bori delivery se utari gayi.",
      },
      {
        prompt: "Gate slip: '22 wiring bundle aur 16 switchboard box'. Kaunsa carton uthaye?",
        options: [
          "22 wiring bundle, 16 switchboard box",
          "20 wiring bundle, 18 switchboard box",
          "25 wiring bundle, 12 switchboard box",
        ],
        correctIndex: 0,
        explanation: "22 wiring bundle aur 16 switchboard box receipt se match hua.",
      },
      {
        prompt: "Evening delivery: '9 steel girder aur 3 chain pulley'. Kon sa cargo unload kare?",
        options: [
          "7 girder, 5 pulley",
          "9 steel girder, 3 chain pulley",
          "11 girder, 2 pulley",
        ],
        correctIndex: 1,
        explanation: "9 steel girder aur 3 chain pulley bilkul theek utar gaye.",
      },
    ],
  },
  stall_majdoori: {
    id: "stall_majdoori",
    name: "Stall Pe Majdoori",
    category: "stall",
    tagline: "Serve customers at the local chai-samosa food stall.",
    minShifts: 0,
    basePay: 24,
    roundBonus: 8,
    rounds: 3,
    questions: [
      {
        prompt: "Customer 1: '2 cutting chai, chini kam, aur 1 garam samosa hari chutney ke saath.'",
        options: [
          "2 chai (chini kam) + 1 samosa (hari chutney)",
          "2 chai (normal) + 2 samosa (meethi chutney)",
          "1 chai (chini kam) + 1 samosa (sukha)",
        ],
        correctIndex: 0,
        explanation: "Customer ko chini kam chai aur hari chutney wala samosa pasand aaya!",
      },
      {
        prompt: "Customer 2: 'Bhaiya 1 adrak chai aur 2 samosa, dono meethi chutney mein dubo ke.'",
        options: [
          "1 adrak chai + 1 samosa (hari chutney)",
          "1 adrak chai + 2 samosa (meethi chutney)",
          "2 adrak chai + 2 samosa (sukha)",
        ],
        correctIndex: 1,
        explanation: "1 adrak chai aur 2 samosa meethi chutney ke saath serve kiya.",
      },
      {
        prompt: "Customer 3: '3 special kadak chai aur 1 samosa bina mirchi ke.'",
        options: [
          "3 kadak chai + 1 samosa (bina mirchi)",
          "2 kadak chai + 2 samosa (extra mirchi)",
          "3 fiki chai + 1 samosa (hari chutney)",
        ],
        correctIndex: 0,
        explanation: "3 kadak chai aur non-spicy samosa time pe deliver hua.",
      },
      {
        prompt: "Customer 4: '4 cutting chai aur 4 samosa, sabke liye alag alag hari-meethi mix chutney.'",
        options: [
          "4 chai + 2 samosa",
          "4 cutting chai + 4 samosa (mix chutney)",
          "3 cutting chai + 4 samosa",
        ],
        correctIndex: 1,
        explanation: "4 cutting chai aur 4 samosa mix chutney ke saath order ready!",
      },
      {
        prompt: "Customer 5: 'Sirf 2 kali chai (black tea) bina cheeni ke aur 1 samosa sukha.'",
        options: [
          "2 black tea (no sugar) + 1 samosa (sukha)",
          "2 milk chai + 1 samosa",
          "1 black tea + 2 samosa",
        ],
        correctIndex: 0,
        explanation: "Fitness wale babu ko black tea aur sukha samosa diya.",
      },
      {
        prompt: "Customer 6: '1 masala chai adrak wali aur 3 garam samose extra fried mirchi ke saath.'",
        options: [
          "2 masala chai + 2 samose",
          "1 masala chai (adrak) + 3 samose (extra fried mirchi)",
          "1 normal chai + 3 samose (bina mirchi)",
        ],
        correctIndex: 1,
        explanation: "Spicy lover customer ko 1 chai aur 3 samose extra mirchi ke saath diye.",
      },
      {
        prompt: "Customer 7: '5 cutting chai tapri style jaldi se, office break khatam ho raha hai!'",
        options: [
          "5 cutting chai",
          "4 cutting chai + 1 samosa",
          "3 full chai",
        ],
        correctIndex: 0,
        explanation: "5 cutting chai fatafat tray mein laga ke de di!",
      },
      {
        prompt: "Customer 8: '2 elaichi chai aur 1 samosa meethi chutney mein tod ke chaat bana ke do.'",
        options: [
          "2 elaichi chai + 1 samosa chaat (meethi chutney)",
          "2 normal chai + 1 samosa sukha",
          "1 elaichi chai + 2 samosa chaat",
        ],
        correctIndex: 0,
        explanation: "Samosa chaat aur elaichi chai ka order perfect serve hua.",
      },
      {
        prompt: "Customer 9: '1 cutting chai thandi hone se pehle do, aur 2 samosa parcel kardo.'",
        options: [
          "1 cutting chai (table) + 2 samosa (parcel)",
          "2 cutting chai + 1 samosa",
          "1 cutting chai + 1 samosa (parcel)",
        ],
        correctIndex: 0,
        explanation: "Table pe garam chai aur 2 samosa paper bag mein parcel!",
      },
      {
        prompt: "Customer 10: '3 chai chini tez aur 2 samosa dono hari chutney mein.'",
        options: [
          "3 chai (chini kam) + 2 samosa",
          "3 chai (chini tez) + 2 samosa (hari chutney)",
          "2 chai (chini tez) + 3 samosa",
        ],
        correctIndex: 1,
        explanation: "Meethi kadak chai aur teekhe samose customer ne khushi se khaye.",
      },
    ],
  },
  mix_banao: {
    id: "mix_banao",
    name: "Mix Banao",
    category: "site",
    tagline: "Calculate mortar and concrete mixing ratios on site.",
    minShifts: 3,
    basePay: 24,
    roundBonus: 8,
    rounds: 3,
    questions: [
      {
        prompt: "Recipe: Plaster mortar ratio hai 1:4 (1 cement : 4 ret). Agar 3 bori cement li hai, kitni bori ret chahiye?",
        options: ["8 bori ret", "12 bori ret", "16 bori ret"],
        correctIndex: 1,
        explanation: "3 cement * 4 = 12 bori ret bilkul sahi hisaab hai.",
      },
      {
        prompt: "Concrete ratio hai 1:2:4 (1 cement : 2 ret : 4 bajri). 2 bori cement ke liye kitni bajri lagegi?",
        options: ["8 bori bajri", "6 bori bajri", "4 bori bajri"],
        correctIndex: 0,
        explanation: "2 cement * 4 = 8 bori bajri (gravel).",
      },
      {
        prompt: "Water-Cement ratio: 1 bori cement ke liye 28 litre paani lagta hai. 2 bori ke liye kitna paani daaloge?",
        options: ["56 litre", "50 litre", "64 litre"],
        correctIndex: 0,
        explanation: "28 * 2 = 56 litre paani sahi consistency deta hai.",
      },
      {
        prompt: "Masonry mix: 1 bori cement ke sath 6 bori sand lagti hai. 4 bori cement ke liye sand batao:",
        options: ["20 bori sand", "24 bori sand", "28 bori sand"],
        correctIndex: 1,
        explanation: "4 * 6 = 24 bori sand.",
      },
      {
        prompt: "Slab casting: Ratio 1:1.5:3. Agar 4 bori cement hai, toh ret kitni lagegi?",
        options: ["6 bori ret", "8 bori ret", "4 bori ret"],
        correctIndex: 0,
        explanation: "4 * 1.5 = 6 bori ret.",
      },
      {
        prompt: "Coloured tile adhesive: Har 5 kg powder mein 1.5 litre chemical. 20 kg powder ke liye kitna chemical?",
        options: ["4.5 litre", "6 litre", "7.5 litre"],
        correctIndex: 1,
        explanation: "(20 / 5) * 1.5 = 6 litre chemical.",
      },
      {
        prompt: "Brick laying mix: Har 100 eent ke liye 1 bori cement mix. 800 eent ke liye kitna mix chahiye?",
        options: ["6 bori", "8 bori", "10 bori"],
        correctIndex: 1,
        explanation: "800 / 100 = 8 bori cement mix.",
      },
      {
        prompt: "High-strength foundation: Ratio 1:1:2. Agar 5 bori cement hai, toh bajri kitni lagegi?",
        options: ["10 bori bajri", "8 bori bajri", "12 bori bajri"],
        correctIndex: 0,
        explanation: "5 * 2 = 10 bori bajri.",
      },
      {
        prompt: "Wall putty mix: 1 kg powder mein 400 ml paani. 10 kg putty ke liye kitna paani chahiye?",
        options: ["3 litre", "4 litre", "5 litre"],
        correctIndex: 1,
        explanation: "10 * 0.4 = 4 litre paani.",
      },
      {
        prompt: "Waterproofing mix: Har 50 kg cement bag mein 200 ml waterproof liquid. 6 bags ke liye kitna liquid?",
        options: ["1000 ml", "1200 ml", "1500 ml"],
        correctIndex: 1,
        explanation: "6 * 200 ml = 1200 ml (1.2 litre).",
      },
    ],
  },
  hisaab_milao: {
    id: "hisaab_milao",
    name: "Hisaab Milao",
    category: "site",
    tagline: "Audit contractor billing receipts and daily wage tallies.",
    minShifts: 6,
    basePay: 24,
    roundBonus: 8,
    rounds: 3,
    questions: [
      {
        prompt: "Tally Check: Majdoor A ko 24 paise, Majdoor B ko 32 paise, Chai wala ko 16 paise. Total kitna banta hai?",
        options: ["72 paise", "68 paise", "76 paise"],
        correctIndex: 0,
        explanation: "24 + 32 + 16 = 72 paise.",
      },
      {
        prompt: "Cement bill: 3 bori cement at 28 paise per bori. Total bill kya hona chahiye?",
        options: ["80 paise", "84 paise", "88 paise"],
        correctIndex: 1,
        explanation: "3 * 28 = 84 paise.",
      },
      {
        prompt: "Audit finding: Contractor ne likha 'Sand: 40 paise, Sariya: 48 paise, Transport: 16 paise = 100 paise'. Sahi total kya hai?",
        options: ["104 paise", "100 paise", "108 paise"],
        correctIndex: 0,
        explanation: "40 + 48 + 16 = 104 paise (contractor ne 4 paise kam likhe the!).",
      },
      {
        prompt: "Truck diesel: 40 litre diesel, rate 4 paise/litre. Kitna kharcha hua?",
        options: ["150 paise", "160 paise", "180 paise"],
        correctIndex: 1,
        explanation: "40 * 4 = 160 paise.",
      },
      {
        prompt: "Weekly safety gear: 4 gloves set at 20 paise each. Total reimbursement amount kitna hoga?",
        options: ["80 paise", "76 paise", "84 paise"],
        correctIndex: 0,
        explanation: "4 * 20 = 80 paise.",
      },
      {
        prompt: "Eent khareed: 500 eent 60 paise mein, unloading 12 paise, entry tax 8 paise. Total cost:",
        options: ["84 paise", "80 paise", "76 paise"],
        correctIndex: 1,
        explanation: "60 + 12 + 8 = 80 paise.",
      },
      {
        prompt: "Mistri attendance: 5 din kaam, daily 24 paise majdoori. Kitna payment banega?",
        options: ["116 paise", "120 paise", "124 paise"],
        correctIndex: 1,
        explanation: "5 * 24 = 120 paise.",
      },
      {
        prompt: "Pani tanker bill: 2 tanker at 36 paise each. Advance 20 paise diya tha. Baaki kitna bacha?",
        options: ["48 paise", "52 paise", "56 paise"],
        correctIndex: 1,
        explanation: "(2 * 36) - 20 = 72 - 20 = 52 paise.",
      },
      {
        prompt: "Scaffolding rent: 3 din ka rent at 16 paise per din, plus 4 paise transport. Total bill:",
        options: ["52 paise", "48 paise", "56 paise"],
        correctIndex: 0,
        explanation: "(3 * 16) + 4 = 48 + 4 = 52 paise.",
      },
      {
        prompt: "Snack bill: 6 samosa at 12 paise each. Contractor ne 80 paise diye. Kitna change wapas milega?",
        options: ["4 paise", "8 paise", "12 paise"],
        correctIndex: 1,
        explanation: "80 - (6 * 12) = 80 - 72 = 8 paise change.",
      },
    ],
  },
  bhookhmato_delivery: {
    id: "bhookhmato_delivery",
    name: "Bhookhmato Delivery",
    brandName: "Bhookhmato",
    category: "gig",
    tagline: "Deliver piping hot food orders as a Bhookhmato delivery partner.",
    minShifts: 4,
    basePay: 32,
    roundBonus: 8,
    rounds: 3,
    questions: [
      {
        prompt: "Bhookhmato Order #420: Halwai se 2 chole bhature aur 1 lassi pick karni hai. Halwai bola 'Bhaiya 2 minute ruko pack ho raha hai'. 15 minute ho gaye. Kya karoge?",
        options: [
          "Bhaiya ko pyaar se bolo: 'Customer cancel kar dega, jaldi do!'",
          "Halwai ki kadhai mein khud kood jao",
          "Customer ko bolo khana khud aakar bana le",
        ],
        correctIndex: 0,
        explanation: "Delivery partner ne politely follow-up kiya aur garam packet secure kiya!",
      },
      {
        prompt: "Customer Instruction: 'Note: Flat 402, lift kharab hai stairs se aana, aur restaurant se free hari chutney pack karwa lena.'",
        options: [
          "4th floor seediyan chadh ke OTP leke packet do",
          "Ground floor se packet chhat pe phenk do",
          "Chutney na milne par customer se ladne lago",
        ],
        correctIndex: 0,
        explanation: "Bhookhmato partner ne 4 floor paidal chadh ke 5-star rating bacha li!",
      },
      {
        prompt: "Order Delivery Gate: Security guard bola 'Delivery boys gate ke bahar bike lagao, register mein 10 jagah sign karo'.",
        options: [
          "Fatafat register sign karo aur packet leke flat jao",
          "Guard ke sath boxing match shuru karo",
          "Guard ko pizza khilakar ghar laut jao",
        ],
        correctIndex: 0,
        explanation: "Shaanti se register entry ki aur time pe deliver kar diya.",
      },
      {
        prompt: "Achanak tezz baarish shuru ho gayi! Bhookhmato bag mein 2 burger aur fries hain. Khana kaise bachaoge?",
        options: [
          "Waterproof rain cover tightly lagakar safe ride karo",
          "Burger ko khud khakar bhookh mitao",
          "Bag kholkar baarish ka maza lo",
        ],
        correctIndex: 0,
        explanation: "Rain cover ne order geela hone se bacha liya. Customer impressed!",
      },
      {
        prompt: "Customer ka call: 'Bhaiya location galat lag gayi thi, main 500 meter aage wali gali mein khada hoon red shirt mein.'",
        options: [
          "Call pe landmark confirm karo aur red shirt wale bhai ko handover karo",
          "Raste mein kisi aur ko parcel bech do",
          "Phone switch off karke so jao",
        ],
        correctIndex: 0,
        explanation: "Landmark match karke customer ko exact location pe packet deliver kiya.",
      },
      {
        prompt: "Payment Mode: 'Cash On Delivery - 88 paise collect karne hain'. Customer ne 100 paise diye. Kitna change wapas doge?",
        options: [
          "12 paise",
          "16 paise",
          "8 paise",
        ],
        correctIndex: 0,
        explanation: "100 - 88 = 12 paise change wapas kiya.",
      },
      {
        prompt: "Late Night Order: 'Doorbell mat bajana, baby so raha hai, bas door ke bahar rakh ke doorbell ke bagal mein photo kheecho.'",
        options: [
          "Quietly door pe rakho, photo upload karo aur OTP message karo",
          "Full volume mein dhol bajao",
          "Khana wapas restaurant le jao",
        ],
        correctIndex: 0,
        explanation: "Zero noise delivery! Baby so raha hai, 5-star rating pakki.",
      },
      {
        prompt: "Customer ne OTP share karne se mana kiya: 'Pehle khana kholke check karunga phir OTP dunga'.",
        options: [
          "Politely samjhao: 'Sir parcel seal intact hai, app policy ke hisaab se OTP mandatory hai'",
          "Customer ka khana chheen kar bhaag jao",
          "Farzi OTP daal kar account block karwao",
        ],
        correctIndex: 0,
        explanation: "Professional communication se customer ne OTP verify kiya!",
      },
      {
        prompt: "Restaurant pickup: Manager ne galti se dusre order ka parcel de diya. Packet pe naam 'Rahul' hai par app pe 'Amit'.",
        options: [
          "Fauran order id check karke Amit ka sahi parcel manga",
          "Rahul ka parcel leke Amit ko deliver kar diya",
          "Dono parcel bag mein rakh liye",
        ],
        correctIndex: 0,
        explanation: "Order ID check karne se galat delivery hone se bach gayi!",
      },
      {
        prompt: "Customer review request: Khana handover karne ke baad kya bolna sabse safe rehta hai?",
        options: [
          "'Thank you sir, enjoy your food! Kripya app par 5-star rating de dena!'",
          "'Sir tip nahi diya toh agle baar order thanda aayega'",
          "'Sir apna phone do main khud rating de deta hoon'",
        ],
        correctIndex: 0,
        explanation: "Polite customer service se tip aur 5-star rating dono mil gaye!",
      },
    ],
  },
  jhatpat_delivery: {
    id: "jhatpat_delivery",
    name: "Jhatpat 10-Min Delivery",
    brandName: "Jhatpat",
    category: "gig",
    tagline: "Ultra-fast 10-minute grocery delivery rider for Jhatpat Quick Mart.",
    minShifts: 8,
    requiredItem: "cycle",
    basePay: 40,
    roundBonus: 8,
    rounds: 3,
    questions: [
      {
        prompt: "Jhatpat Dark-Store Alert! 8 minute bache hain! Picking List: '1 loaf bread, 2 packet doodh, aur 1 cold drink'. Kaunsa crate uthaye?",
        options: [
          "1 bread, 2 doodh, 1 cold drink",
          "2 bread, 1 doodh, 2 cold drink",
          "1 bread, 1 doodh, 1 juice",
        ],
        correctIndex: 0,
        explanation: "30 second mein exact items pack karke delivery bag mein daale!",
      },
      {
        prompt: "Rider Challenge: Gali ke mod par 3 kutte bhauk rahe hain aur samne customer ka gate hai. Cycle kaise nikaloge?",
        options: [
          "Shaant reh kar dheere se cycle side se nikaal lo bina panic kiye",
          "Kutto par delivery bag phenk do",
          "Cycle wahin chhod kar ped par chadh jao",
        ],
        correctIndex: 0,
        explanation: "Pro-rider move! Bina kisi jhamela ke gate par pahunch gaye.",
      },
      {
        prompt: "Speed Check: Customer ne order kiya '2 kilo pyaaz aur 1 Cornetto ice cream'. Dhoop mein ice cream pighalne ka khatra hai!",
        options: [
          "Ice cream ko thermal pouch mein pack karke fast route lo",
          "Ice cream pehle hi kha jao taaki pighle na",
          "Dhoop mein khade hoke phone chalao",
        ],
        correctIndex: 0,
        explanation: "Thermal pouch ne ice cream ko pighalne se bacha liya. 7 minute mein deliver!",
      },
      {
        prompt: "Apartment Riddle: 'Tower B, Flat 703'. Lift par board laga hai 'Maintenance in Progress - 30 minutes'.",
        options: [
          "7th floor tak stairs tezi se chadho, stamina dikhao!",
          "Lift ke door ko laat maar ke kholo",
          "Ground floor par packet chhod kar bhaag jao",
        ],
        correctIndex: 0,
        explanation: "7 floors stairs climb! 10-minute timer expiry se pehle delivery done.",
      },
      {
        prompt: "Item verification: Customer ne mangi thi 'Dolo-650 aur 100g Dhaniya'. Packer ne galti se pudina daal diya.",
        options: [
          "Fatafat store shelf se fresh dhaniya replace karke packet pack kiya",
          "Customer ko bol diya 'Aaj pudina ki chai bana lo'",
          "Pudina phenk ke khali bag le gaye",
        ],
        correctIndex: 0,
        explanation: "Item cross-check karne se return complaint bach gayi!",
      },
      {
        prompt: "Customer Instruction: 'Gate bell kharab hai, 3 baar darwaza knock karo aur code bolo: Jhatpat OP'.",
        options: [
          "3 baar knock kiya aur bola 'Jhatpat OP!'",
          "Darwaza todne ki koshish ki",
          "Padosi ki bell baja ke bhaag gaye",
        ],
        correctIndex: 0,
        explanation: "Customer ne muskura ke darwaza khola aur 8 paise ki extra tip di!",
      },
      {
        prompt: "Delivery OTP check: Customer ne OTP bola '7420'. App par verify karke kya karoge?",
        options: [
          "App par 7420 enter karke delivery mark complete kiya",
          "Customer se 50 paise maange",
          "OTP cancel karke order dubara pack karwaya",
        ],
        correctIndex: 0,
        explanation: "Order verified and closed successfully in 9 minutes!",
      },
      {
        prompt: "Rush Hour Traffic: Main chowk par traffic jam laga hai. Cycle rider kahan se niklega?",
        options: [
          "Side wali patli gali se shortcut nikaal kar jam bypass kiya",
          "Truck ke piche cycle khadi karke so gaye",
          "Cycle uthakar divider par baith gaye",
        ],
        correctIndex: 0,
        explanation: "Shortcut se 4 minute bacha liye! True Indian gig worker speed.",
      },
      {
        prompt: "Order Bag Balance: Bag mein 5 packet dahi aur 6 kande (eggs) hain. Cycle kaise chalaoge?",
        options: [
          "Smooth paddling taaki koi bhi egg na toote",
          "Speed breaker par cycle uchhal do",
          "Bag ko handle par latka ke wheelie maaro",
        ],
        correctIndex: 0,
        explanation: "Zero damage delivery! Ek bhi anda nahi toota.",
      },
      {
        prompt: "Shift End Bonus: Jhatpat Store Manager ne bola 'Aapne lagataar 3 deliveries under 10 minutes ki hain!'",
        options: [
          "Smilingly attendance lagwayi aur payout collect kiya",
          "Manager par gussa kiya",
          "Cycle store ke andar chala di",
        ],
        correctIndex: 0,
        explanation: "Top performer of the shift! Full attendance and bonus credited.",
      },
    ],
  },
};
