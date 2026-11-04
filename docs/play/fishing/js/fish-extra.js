/* =========================================================
   ปลาเพิ่มเติม (EduPlay) — รวมทั้งเกม 150 ชนิด (ระดับละ 30)
   ---------------------------------------------------------
   สไปรต์ทุกตัวสร้างด้วยโค้ดจาก: รูปทรง (= ช่องในกระเป๋า) · ทรงลำตัว · ลาย · ชุดสี
   แถวข้อมูล: [id, ชื่อไทย, ชื่ออังกฤษ, ดาว, แบบรูปทรง, ลาย, สีลำตัว, สีครีบ, สีลาย, {เพิ่มเติม}]
   ลาย: none stripes bands spots lateral scales gold
   ========================================================= */
(function(){
const D = window.DATA;

// แบบรูปทรง: shape (T หาง · B ลำตัว · H หัว · F ครีบ · S จะงอย · L เหยื่อล่อ) + ทรงลำตัว
const TPL = {
  tiny:   { shape:['TH'],                          body:'fish'  },
  small:  { shape:['TBH'],                         body:'fish'  },
  smallD: { shape:['TBH'],                         body:'deep'  },
  smallR: { shape:['TBH'],                         body:'round' },
  eelS:   { shape:['TBBH'],                        body:'eel'   },
  rayS:   { shape:['.F.','TBH','.F.'],             body:'deep'  },
  slim:   { shape:['TBBH'],                        body:'fish'  },
  needle: { shape:['TBBS'],                        body:'eel'   },
  eel:    { shape:['TBBBH'],                       body:'eel'   },
  eelL:   { shape:['TBBBBH'],                      body:'eel'   },
  squid:  { shape:['TBBH'],                        body:'eel'   },
  deep:   { shape:['.F.','TBH'],                   body:'deep'  },
  deepL:  { shape:['.F.','TBH','TBH'],             body:'deep'  },
  round:  { shape:['TBH','TBH'],                   body:'round' },
  roundF: { shape:['.F.','TBH','TBH'],             body:'round' },
  mola:   { shape:['.F.','TBH','TBH','.F.'],       body:'round' },
  big:    { shape:['.FF.','TBBH','TBBH'],          body:'fish'  },
  bigD:   { shape:['.FF.','TBBH','TBBH'],          body:'deep'  },
  tuna:   { shape:['.FF.','TBBH','TBBH','..F.'],   body:'fish'  },
  ray:    { shape:['.FF.','TBBH','TBBH','.FF.'],   body:'deep'  },
  shark:  { shape:['..F..','TBBBH','TBBBH'],       body:'shark' },
  sharkL: { shape:['...F..','TBBBBH','TBBBBH'],    body:'shark' },
  sword:  { shape:['..F...','TBBBHS'],             body:'shark' },
  sail:   { shape:['.FFF..','TBBBHS'],             body:'shark' },
  saw:    { shape:['TBBBHS'],                      body:'shark' },
  lure:   { shape:['..L','TBH','TBH'],             body:'round' },
  dragon: { shape:['FFFFF.','TBBBBH'],             body:'eel'   },
  dragonL:{ shape:['FFFFFF.','TBBBBBH'],           body:'eel'   },
};

// ชุดสีจากสีหลัก: เส้นขอบ · เงา · สีลำตัว · ไฮไลต์ · ครีบ · ครีบเข้ม · ลาย
function hex2rgb(h){ h=h.replace('#',''); return [0,2,4].map(i=>parseInt(h.substr(i,2),16)); }
function rgb2hex(c){ return '#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
const mix=(a,b,t)=>rgb2hex(hex2rgb(a).map((v,i)=>v+(hex2rgb(b)[i]-v)*t));
function palette(base, fin, pat, glow){
  fin = fin || mix(base,'#000000',0.18);
  const p = { o:mix(base,'#05060a',0.86), d:mix(base,'#000000',0.42), b:base, l:mix(base,'#ffffff',0.55),
              f:fin, fd:mix(fin,'#000000',0.4), p:pat || mix(base,'#000000',0.55) };
  if(glow) p.gl = glow;
  return p;
}

const NEW = [
  // ---------------- ★1 ----------------
  ['mullet','ปลากระบอก','Mullet',1,'small','lateral','#8a9aa8'],
  ['guppy','ปลาหางนกยูง','Guppy',1,'tiny','spots','#f0a040','#e83a5a','#3a8ae0'],
  ['salmonfry','ปลาแซลมอนเล็ก','Salmon Fry',1,'small','spots','#9ab8b0','#7a9a90','#e06a7a'],
  ['atlmack','ปลาแมคเคอเรล','Atlantic Mackerel',1,'small','stripes','#5a9ab0','#4a7a90','#1e3a50'],
  ['minimack','ปลาอินทรีจิ๋ว','Spanish Mackerel Fry',1,'slim','spots','#7a96c8','#5a76a8','#2e4a7a'],
  ['ricefish','ปลาข้าวสาร','Ricefish',1,'tiny','lateral','#c8d8e8','#a8b8c8','#5a7090'],
  ['greenback','ปลาหลังเขียว','Greenback Herring',1,'small','scales','#6aa86a','#4a884a'],
  ['ponyfish','ปลาแป้น','Ponyfish',1,'smallD','none','#c8ccd8','#a8acb8'],
  ['moztilapia','ปลาหมอเทศ','Mozambique Tilapia',1,'smallD','scales','#8a8a6a','#6a6a4a'],
  ['silverbarb','ปลาตะเพียน','Silver Barb',1,'smallD','scales','#c0b890','#e0a040'],
  ['niletilapia','ปลานิล','Nile Tilapia',1,'smallD','stripes','#8a9488','#a8584a','#4a544a'],
  ['gourami','ปลาสลิด','Snakeskin Gourami',1,'smallD','bands','#8a8a5a','#6a6a3a','#4a4a2a'],
  ['herring','ปลาเฮอริ่ง','Herring',1,'small','lateral','#a0b4d0','#80a0c0'],
  ['toadfish','ปลาคางคก','Toadfish',1,'smallR','spots','#8a7a5a','#6a5a3a','#3a2e1a'],
  ['goldfish','ปลาทองเล็ก','Goldfish',1,'tiny','none','#f07a20','#ffb050'],
  ['climbperch','ปลาหมอ','Climbing Perch',1,'small','scales','#7a7458','#5a5438'],
  ['sheatfish','ปลาแดง','Red Sheatfish',1,'small','none','#e06a6a','#c04a4a'],
  ['shortfin','ปลาครีบสั้น','Shortfin Fish',1,'small','spots','#7a8ac0','#5a6aa0'],
  ['babycat','ปลาดุกจิ๋ว','Baby Catfish',1,'small','none','#6a6474','#4a4454'],
  ['seacat','ปลาดุกทะเล','Sea Catfish',1,'slim','lateral','#7a7a90','#5a5a70','#c8c8d8'],
  ['porcupine','ปลาเม่นทะเล','Porcupinefish',1,'smallR','spots','#c8c0a0','#a8a080','#3a3428'],
  ['swampeel','ปลาไหลน้ำจืด','Swamp Eel',1,'eelS','spots','#8a7448','#6a5428','#3a2c14'],
  ['rasbora','ปลาซิว','Rasbora',1,'tiny','lateral','#d0a888','#e86a3a','#2a2a2a'],
  ['betta','ปลากัด','Siamese Fighting Fish',1,'tiny','scales','#3a4ad0','#e03a6a'],
  ['mudcarp','ปลาสร้อย','Mud Carp',1,'small','scales','#a8a8a0','#888880'],
  ['molly','ปลาสอด','Molly',1,'tiny','spots','#2a2a2e','#ffcc40','#e8e8e8'],
  // ---------------- ★2 ----------------
  ['barra','ปลากะพงขาว','Barramundi',2,'slim','scales','#b0bcc8','#90a0b0'],
  ['stingray','ปลากระเบน','Stingray',2,'rayS','spots','#6a7aa0','#4a5a80','#2a3450'],
  ['hampala','ปลากระสูบ','Hampala Barb',2,'slim','bands','#c8b090','#e04a2a','#3a2a1a'],
  ['gianttgour','ปลาแรด','Giant Gourami',2,'deep','scales','#a08a6a','#806a4a'],
  ['snakehead','ปลาช่อน','Snakehead',2,'eelS','spots','#6a6a4a','#4a4a2a','#2a2a14'],
  ['walkcat','ปลาดุกด้าน','Walking Catfish',2,'eelS','none','#5a5464','#3a3444'],
  ['cichlid','ปลาหมอสี','Flowerhorn Cichlid',2,'deep','spots','#e04a3a','#2a3aa0','#ffe080'],
  ['halfbeak','ปลาเข็ม','Halfbeak',2,'needle','lateral','#a8c8e0','#88a8c0'],
  ['siamcat','ปลาสังกะวาด','Siamese Catfish',2,'slim','lateral','#c87a7a','#a85a5a'],
  ['barracuda','ปลาสาก','Barracuda',2,'eel','stripes','#a0b8b0','#80a098','#4a5a54'],
  ['threadfin','ปลากุเรา','Threadfin',2,'slim','lateral','#c0c8d8','#e0c060'],
  ['indmack','ปลาลัง','Indian Mackerel',2,'slim','stripes','#6aa0c8','#4a80a8','#2a4a6a'],
  ['blkgrouper','ปลาเก๋าดำ','Black Grouper',2,'deep','spots','#4a4a58','#2a2a38','#1a1a24'],
  ['blackear','ปลาเทโพ','Black-ear Catfish',2,'slim','spots','#7a8ab0','#5a6a90','#1a2030'],
  ['knifefish','ปลากราย','Clown Knifefish',2,'eelS','spots','#a8a8b0','#888890','#2a2a30'],
  ['archer','ปลาเสือพ่น','Archerfish',2,'deep','bands','#e0c060','#c0a040','#2a2a20'],
  ['tigernandus','ปลาหมอช้างเหยียบ','Tiger Nandus',2,'deep','bands','#b0a090','#908070','#4a3a2a'],
  ['scat','ปลาตะกรับ','Scat',2,'deep','spots','#c8b880','#a89860','#3a3020'],
  ['hardtail','ปลาหางแข็ง','Hardtail Scad',2,'slim','lateral','#90b0d0','#7090b0','#e0d040'],
  ['goby','ปลาบู่','Marble Goby',2,'slim','spots','#a08a6a','#806a4a','#3a2a1a'],
  ['giantsnake','ปลาชะโด','Giant Snakehead',2,'eel','bands','#4a5a7a','#e0c040','#1a2030'],
  ['mrigal','ปลานวลจันทร์','Mrigal',2,'slim','scales','#c8b0b8','#e07a7a'],
  ['wallago','ปลาเค้า','Wallago Catfish',2,'eelS','none','#9a9aa8','#7a7a88'],
  ['pomfret','ปลาจะละเม็ด','Pomfret',2,'deep','none','#c8ccd8','#a8acb8'],
  ['pangasius','ปลาสวาย','Iridescent Shark',2,'slim','lateral','#8a9aa8','#6a7a88','#c8d8e0'],
  ['yellowcat','ปลากดเหลือง','Yellow Catfish',2,'slim','none','#c8b060','#a89040'],
  // ---------------- ★3 ----------------
  ['blacktip','ปลาฉลามหูดำ','Blacktip Reef Shark',3,'shark','none','#8a96a8','#1a1e24'],
  ['whitetip','ปลาฉลามครีบขาว','Whitetip Reef Shark',3,'shark','none','#7a8494','#f0f0f0'],
  ['spotsnap','ปลากะพงจุด','Spotted Snapper',3,'deepL','spots','#e08a7a','#c06a5a','#3a1a14'],
  ['butterfly','ปลาผีเสื้อ','Butterflyfish',3,'deep','bands','#f0d040','#d0b020','#1a1a1a'],
  ['coralgrp','ปลากะรัง','Coral Grouper',3,'bigD','spots','#d0503a','#b0301a','#4ab0f0'],
  ['albacore','ปลาทูน่าครีบยาว','Albacore Tuna',3,'big','lateral','#3a5a9a','#d0d8e8'],
  ['reefsquid','ปลาหมึกหอม','Bigfin Reef Squid',3,'squid','spots','#e8a8b0','#c8889a','#a03a5a'],
  ['octopus','ปลาหมึกสาย','Octopus',3,'round','spots','#c85a6a','#a83a4a','#f0c0c8'],
  ['salmon','ปลาแซลมอน','Atlantic Salmon',3,'big','spots','#9ab0b8','#7a9098','#2a3a40'],
  ['cod','ปลาค็อด','Atlantic Cod',3,'big','spots','#b0a07a','#90805a','#4a3a20'],
  ['redtilapia','ปลาทับทิม','Red Tilapia',3,'deepL','scales','#e85a6a','#c83a4a'],
  ['yelgrouper','ปลาเก๋าเหลือง','Yellow Grouper',3,'bigD','spots','#e0c060','#c0a040','#5a4a20'],
  ['seacatfish','ปลากดทะเล','Giant Sea Catfish',3,'big','none','#a8a090','#888070'],
  ['giantcarp','ปลากระโห้','Siamese Giant Carp',3,'bigD','scales','#c0b8a0','#a09880'],
  ['queenfish','ปลาสีเสียด','Queenfish',3,'slim','spots','#a0a8c8','#8088a8','#2a2e40'],
  ['hairtail','ปลาดาบเงิน','Largehead Hairtail',3,'eelL','none','#d8e0f0','#b8c0d0'],
  ['redtailcat','ปลากดคัง','Asian Redtail Catfish',3,'eel','none','#8a7a6a','#e04a2a'],
  ['mandarin','ปลาแมนดาริน','Mandarinfish',3,'smallD','stripes','#f08a20','#3a6ae0','#1ab0c0'],
  ['conger','ปลาไหลทะเล','Conger Eel',3,'eelL','lateral','#7a7a9a','#5a5a7a'],
  ['bighead','ปลาหัวโต','Bighead Carp',3,'big','spots','#a0a098','#808078','#4a4a44'],
  ['redgrouper','ปลากะรังแดง','Red Grouper',3,'bigD','spots','#e04a4a','#c02a2a','#f0d0d0'],
  ['arowana','ปลาตะพัด','Asian Arowana',3,'eel','scales','#e0b040','#c09020'],
  ['wrasse','ปลานกขุนทอง','Wrasse',3,'slim','stripes','#40c0a0','#2090e0','#f0e060'],
  ['batfish','ปลาหูช้าง','Batfish',3,'mola','bands','#c8c0b0','#a8a090','#3a3428'],
  ['croaker','ปลาม้า','Boeseman Croaker',3,'big','scales','#c8b8a0','#a89880'],
  ['sillago','ปลาเห็ดโคน','Sillago',3,'slim','lateral','#d8d0b8','#b8b098'],
  // ---------------- ★4 ----------------
  ['whaleshark','ฉลามวาฬ','Whale Shark',4,'sharkL','spots','#4a5a8a','#3a4a7a','#e8f0ff'],
  ['orca','วาฬเพชฌฆาต','Orca',4,'sharkL','bands','#1a1a20','#1a1a20','#f4f4f8'],
  ['manta','ปลากระเบนราหู','Manta Ray',4,'ray','none','#2a3a5a','#1a2a4a'],
  ['trout','ปลาเทราท์สายรุ้ง','Rainbow Trout',4,'big','spots','#9ab090','#e06a8a','#3a3a2a'],
  ['giantoct','ปลาหมึกยักษ์','Giant Octopus',4,'roundF','spots','#c83a4a','#a01a2a','#f0a0b0'],
  ['giantgrp','ปลาเก๋ายักษ์','Giant Grouper',4,'bigD','spots','#6a6a5a','#4a4a3a','#2a2a1a'],
  ['skipjack','ปลาโอ','Skipjack Tuna',4,'tuna','stripes','#3a4a7a','#c8d0e8','#1a2040'],
  ['yellowfin','ปลาทูน่าครีบเหลือง','Yellowfin Tuna',4,'tuna','lateral','#2a3a6a','#f0d030','#f0d030'],
  ['sheat','ปลาเนื้ออ่อน','Glass Catfish',4,'eel','none','#d0d8e8','#b0b8c8'],
  ['sawfish','ปลาฉนาก','Sawfish',4,'saw','none','#8a8070','#6a6050'],
  ['dolphin','ปลาโลมา','Dolphin',4,'shark','none','#7a90b0','#5a7090'],
  ['seadragon','ปลามังกรทะเล','Leafy Seadragon',4,'dragon','spots','#d0a040','#a0c040','#f0e0a0'],
  ['lionfish','ปลาสิงโต','Lionfish',4,'deep','bands','#e05a3a','#f0e0d0','#f4f0ea'],
  ['blksnap','ปลากะพงดำ','Black Snapper',4,'bigD','scales','#3a3a48','#2a2a38'],
  ['tigershark','ฉลามเสือ','Tiger Shark',4,'sharkL','stripes','#7a8070','#5a6050','#3a4030'],
  ['cuttle','ปลาหมึกกระดอง','Cuttlefish',4,'round','bands','#c8a890','#a88870','#5a3a2a'],
  ['angelfish','ปลานางฟ้า','Emperor Angelfish',4,'deepL','stripes','#3a5ad0','#f0d040','#f0d040'],
  ['giantray','ปลากระเบนยักษ์','Giant Freshwater Stingray',4,'ray','spots','#7a6a5a','#5a4a3a','#2a2018'],
  ['blackchin','ปลาหมอคางดำ','Blackchin Tilapia',4,'deepL','none','#9a9aa8','#2a2a30'],
  ['mekongcat','ปลาบึก','Mekong Giant Catfish',4,'sharkL','none','#8a8a98','#6a6a78'],
  ['marlin','ปลามาร์ลิน','Blue Marlin',4,'sword','stripes','#2a4a9a','#1a2a6a','#8ab0ff'],
  ['sailfish','ปลากระโทงร่ม','Sailfish',4,'sail','spots','#3a5a9a','#2a4aa0','#9ac0ff'],
  ['hammerhead','ฉลามหัวค้อน','Hammerhead Shark',4,'sharkL','none','#6a7a88','#4a5a68'],
  ['electriceel','ปลาไหลไฟฟ้า','Electric Eel',4,'eelL','lateral','#4a4a3a','#2a2a1a','#f0e040',{gl:'#f8f070'}],
  ['mola','ปลาโมลา','Ocean Sunfish',4,'mola','spots','#a8b0c0','#8890a0','#e8ecf4'],
  ['arapaima','ปลาอะราไพม่า','Arapaima',4,'sharkL','scales','#6a7060','#c03a2a'],
  ['napoleon','ปลานโปเลียน','Napoleon Wrasse',4,'bigD','stripes','#3aa0a0','#1a8080','#a0f0e0'],
  // ---------------- ★5 ----------------
  ['brydes','วาฬบรูด้า','Bryde\'s Whale',5,'sharkL','lateral','#3a4a5a','#2a3a4a','#c8d0d8'],
  ['piranha','ปลาปิรันย่าราชา','Piranha King',5,'deepL','spots','#9a9aa8','#e02a2a','#f0f0f0'],
  ['greendragon','ปลามังกรเขียว','Green Dragon',5,'dragon','scales','#3ac04a','#f0e040',null,{gl:'#a0ff80'}],
  ['megalodon','เมกาโลดอน','Megalodon',5,'sharkL','none','#5a6470','#3a444e'],
  ['kraken','ปลาหมึกยักษ์คราเคน','Kraken',5,'mola','spots','#a01a3a','#701028','#f04a7a',{gl:'#ff80a0'}],
  ['flowerpuff','ปลาปักเป้าดอกไม้','Flower Puffer',5,'round','spots','#f0c0d0','#f080b0','#e04080'],
  ['demonray','ปลากระเบนมาร','Demon Ray',5,'ray','spots','#2a1a3a','#4a1a5a','#c04af0',{gl:'#e080ff'}],
  ['humpback','วาฬหลังค่อม','Humpback Whale',5,'sharkL','bands','#3a4048','#d8dce0','#e8ecf0'],
  ['firefly','ปลาหมึกเรืองแสง','Firefly Squid',5,'squid','gold','#2a4ad0','#4a7af0',null,{gl:'#80e0ff'}],
  ['abyssdragon','ปลามังกรทะเลลึก','Abyss Dragon',5,'dragonL','spots','#1a2a5a','#3a1a6a','#80a0ff',{gl:'#a0c0ff'}],
  ['skyblade','ปลาดาบฟ้า','Sky Blade',5,'sail','lateral','#60b0f0','#a0e0ff','#ffffff'],
  ['kingsalmon','ปลาแซลมอนราชา','King Salmon',5,'big','gold','#e05a4a','#f0a040',null,{gl:'#ffe080'}],
  ['firedragon','ปลามังกรไฟ','Fire Dragon',5,'dragon','gold','#e03a1a','#f0a020',null,{gl:'#ffd060'}],
  ['icedragon','ปลามังกรน้ำแข็ง','Ice Dragon',5,'dragon','spots','#8ad0f0','#d0f4ff','#ffffff',{gl:'#e0ffff'}],
  ['rainbow','ปลาสายรุ้ง','Rainbow Fish',5,'deepL','stripes','#3a8af0','#f04a8a','#f0e040'],
  ['fantasy','ปลาแฟนตาซี','Fantasy Fish',5,'bigD','spots','#c04af0','#40e0d0','#f0f080'],
  ['bluewhale','วาฬสีน้ำเงิน','Blue Whale',5,'sharkL','spots','#3a5a8a','#2a4a7a','#8aa8d0'],
  ['seagod','ปลาเทพเจ้า','Sea God',5,'tuna','gold','#f0f0f8','#f0d060',null,{gl:'#fff4c0'}],
  ['seafiend','ปลาอสูรทะเล','Sea Fiend',5,'lure','spots','#5a1a1a','#3a0a0a','#f04a2a',{gl:'#ff6040'}],
  ['shadowless','ปลาไร้เงา','Shadowless Fish',5,'big','none','#e8e4d8','#d0ccc0'],
  ['golddragon','ปลามังกรทอง','Golden Dragon',5,'dragonL','gold','#f0b020','#ffe060',null,{gl:'#fff0a0'}],
  ['anemone','ปลาดอกไม้ทะเล','Anemone Fish',5,'deepL','bands','#7a3ae0','#f04ac0','#f8f0ff'],
  ['vampire','ปลาหมึกแวมไพร์','Vampire Squid',5,'roundF','spots','#5a1a4a','#3a0a2a','#f04ab0',{gl:'#ff80d0'}],
  ['blackdragon','ปลามังกรดำ','Black Dragon',5,'dragonL','scales','#1a1a24','#3a3a4a',null,{gl:'#c0c0ff'}],
  ['seaempress','ปลานางพญาแห่งท้องทะเล','Sea Empress',5,'bigD','gold','#6a4ae0','#f0a0e0',null,{gl:'#f0d0ff'}],
  ['fatefish','ปลาแห่งโชคชะตา','Fish of Fate',5,'tuna','gold','#e04ac0','#40e0f0',null,{gl:'#fff0ff'}],
];

// ราคา: ช่วงตามดาว ปรับตามขนาด (จำนวนช่องในกระเป๋า)
const VAL = { 1:[5,16], 2:[18,38], 3:[42,78], 4:[88,155], 5:[185,330] };
const cells = (shape) => shape.join('').replace(/\./g,'').length;
const ZONE = { 1:[0,2], 2:[0,3], 3:[1,4], 4:[2,4], 5:[3,4] };
const MYTH = /dragon|kraken|seagod|fiend|shadowless|empress|fate|fantasy|skyblade|demon/;

NEW.forEach(([id,name,en,star,tpl,pat,base,fin,patc,extra], i) => {
  if(D.FISH.some(f=>f.id===id)) return;
  const t = TPL[tpl], n = cells(t.shape), [lo,hi] = VAL[star];
  const sizeK = Math.min(1, (n-1)/9), jitter = ((i*37)%11)/10 - 0.5;
  const val = Math.round(lo + (hi-lo)*(0.15 + 0.7*sizeK + 0.15*jitter));
  const z = star===5 && MYTH.test(id) ? [4,4] : ZONE[star].slice();
  D.FISH.push({ id, name, en, star, val, z, shape:t.shape.slice(), body:t.body, pat,
    col: palette(base, fin, patc, extra && extra.gl) });
});
// เรียงตามดาว (สมุดบันทึกปลาจะเรียงตามนี้) แล้วสร้างดัชนีใหม่
D.FISH.sort((a,b)=> a.star-b.star);
D.FISH_BY_ID = {}; D.FISH.forEach(f => D.FISH_BY_ID[f.id] = f);
})();
