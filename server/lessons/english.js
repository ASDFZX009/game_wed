// ภาษาอังกฤษ: คำศัพท์ (เล่นเรียงตัวอักษรได้) กริยาช่อง 2 คำตรงข้าม ไวยากรณ์ บทสนทนา
module.exports = [
  { id: "en-vocab", cat: "english", icon: "🍎", title: "คำศัพท์ภาษาอังกฤษ", desc: "คำศัพท์รอบตัว สัตว์ อาหาร สถานที่ อาชีพ จากง่ายไปยาก", age: [5, 15], scramble: true,
    legacy: ["Word Scramble ภาษาอังกฤษ", "จับคู่คำศัพท์อังกฤษ–ไทย"], legacyPair: "“{x}” แปลว่าอะไร",
    pairs: { q: "“{x}” แปลว่าอะไร", rev: "“{y}” ภาษาอังกฤษคือคำใด", revLift: 0, list: [
      [1, "cat", "แมว"], [1, "dog", "สุนัข"], [1, "fish", "ปลา"], [1, "bird", "นก"], [1, "red", "สีแดง"], [1, "blue", "สีฟ้า"], [1, "book", "หนังสือ"], [1, "milk", "นม"], [1, "sun", "ดวงอาทิตย์"], [1, "egg", "ไข่"],
      [2, "teacher", "ครู"], [2, "school", "โรงเรียน"], [2, "kitchen", "ห้องครัว"], [2, "rabbit", "กระต่าย"], [2, "orange", "ส้ม"], [2, "flower", "ดอกไม้"], [2, "chair", "เก้าอี้"], [2, "window", "หน้าต่าง"], [2, "river", "แม่น้ำ"], [2, "rain", "ฝน"],
      [3, "doctor", "หมอ"], [3, "library", "ห้องสมุด"], [3, "hospital", "โรงพยาบาล"], [3, "elephant", "ช้าง"], [3, "vegetable", "ผัก"], [3, "mountain", "ภูเขา"], [3, "weather", "สภาพอากาศ"], [3, "breakfast", "อาหารเช้า"], [3, "village", "หมู่บ้าน"],
      [4, "environment", "สิ่งแวดล้อม"], [4, "government", "รัฐบาล"], [4, "knowledge", "ความรู้"], [4, "important", "สำคัญ"], [4, "dangerous", "อันตราย"], [4, "neighbor", "เพื่อนบ้าน"], [4, "festival", "เทศกาล"], [4, "journey", "การเดินทาง"],
      [5, "responsibility", "ความรับผิดชอบ"], [5, "opportunity", "โอกาส"], [5, "achievement", "ความสำเร็จ"], [5, "curious", "อยากรู้อยากเห็น"], [5, "pollution", "มลพิษ"], [5, "volunteer", "อาสาสมัคร"], [5, "independent", "เป็นอิสระ"], [5, "ancient", "โบราณ"] ] } },
  { id: "en-verbs", cat: "english", icon: "🏃", title: "Verb 3 ช่อง", desc: "กริยาช่องที่ 2 (อดีต) ของคำกริยาปกติและไม่ปกติ", age: [9, 16], scramble: true,
    pairs: { q: "กริยาช่อง 2 (อดีต) ของ “{x}” คือ", list: [
      [1, "play", "played"], [1, "walk", "walked"], [1, "jump", "jumped"], [1, "cook", "cooked"], [2, "go", "went"], [2, "eat", "ate"], [2, "see", "saw"], [2, "have", "had"], [2, "come", "came"], [2, "study", "studied"],
      [3, "write", "wrote"], [3, "drink", "drank"], [3, "swim", "swam"], [3, "buy", "bought"], [3, "make", "made"], [3, "run", "ran"], [3, "sleep", "slept"], [4, "teach", "taught"], [4, "catch", "caught"], [4, "think", "thought"],
      [4, "begin", "began"], [4, "fly", "flew"], [4, "speak", "spoke"], [4, "forget", "forgot"], [5, "choose", "chose"], [5, "freeze", "froze"], [5, "bring", "brought"], [5, "seek", "sought"], [5, "lie (นอน)", "lay"], [5, "bite", "bit"] ] } },
  { id: "en-opposite", cat: "english", icon: "↔️", title: "คำตรงข้าม Opposites", desc: "คำคุณศัพท์และคำกริยาที่มีความหมายตรงข้ามกัน", age: [7, 15], scramble: true,
    pairs: { q: "คำตรงข้ามของ “{x}” คือ", list: [
      [1, "big", "small"], [1, "hot", "cold"], [1, "up", "down"], [1, "happy", "sad"], [1, "open", "close"], [2, "fast", "slow"], [2, "tall", "short"], [2, "old", "new"], [2, "day", "night"], [2, "full", "empty"],
      [3, "heavy", "light"], [3, "early", "late"], [3, "easy", "difficult"], [3, "cheap", "expensive"], [3, "strong", "weak"], [4, "brave", "afraid"], [4, "polite", "rude"], [4, "remember", "forget"], [4, "arrive", "leave"],
      [5, "ancient", "modern"], [5, "generous", "selfish"], [5, "increase", "decrease"], [5, "victory", "defeat"], [5, "permanent", "temporary"] ] } },
  { id: "en-grammar", cat: "english", icon: "📝", title: "ไวยากรณ์และบทสนทนา", desc: "เติมคำในประโยค tense คำบุพบท และการโต้ตอบในชีวิตประจำวัน", age: [8, 16], match: false,
    qa: [
      [1, "I ___ a student.", "am", "is", "are", "be"], [1, "She ___ a cat.", "has", "have", "having", "haves"], [1, "They ___ my friends.", "are", "is", "am", "be"],
      [1, "“Hello! How are you?” — ตอบว่า", "I'm fine, thank you.", "I'm ten.", "Goodbye.", "It's a pen."], [1, "“What is your name?” — ตอบว่า", "My name is Nok.", "I'm fine.", "Yes, it is.", "At school."],
      [2, "He ___ to school every day.", "goes", "go", "going", "gone"], [2, "There ___ two apples on the table.", "are", "is", "am", "be"], [2, "The book is ___ the table. (อยู่บนโต๊ะ)", "on", "in", "at", "under"],
      [2, "“Thank you very much.” — ตอบว่า", "You're welcome.", "Sorry.", "Good morning.", "See you."], [2, "I have ___ umbrella.", "an", "a", "the", "some"],
      [3, "Yesterday, we ___ football.", "played", "play", "plays", "playing"], [3, "She is ___ than her sister.", "taller", "tall", "tallest", "more tall"], [3, "Look! The baby ___.", "is sleeping", "sleeps", "slept", "sleep"],
      [3, "“May I borrow your pen?” — ตอบอย่างสุภาพว่า", "Sure, here you are.", "No, I am a pen.", "Yes, I'm hungry.", "I'm fine."], [3, "I was born ___ 2015.", "in", "on", "at", "of"],
      [4, "If it rains, I ___ at home.", "will stay", "stayed", "stay was", "staying"], [4, "This is the ___ book I have ever read.", "best", "better", "good", "most good"], [4, "She has lived here ___ 2020.", "since", "for", "from", "at"],
      [4, "The letter ___ by Tom yesterday.", "was written", "wrote", "is writing", "writes"], [4, "I'm interested ___ science.", "in", "on", "at", "for"],
      [5, "If I ___ a bird, I would fly.", "were", "am", "will be", "been"], [5, "By the time we arrived, the film ___.", "had started", "starts", "has start", "was start"], [5, "He suggested that we ___ early.", "leave", "leaving", "to leave", "left"],
      [5, "Neither the teacher nor the students ___ ready.", "were", "was", "is", "be"], [5, "I'd rather you ___ smoke here.", "didn't", "don't", "not", "won't"],
    ] },
  { id: "en-mix", cat: "english", icon: "🔤", title: "English รวมมิตร (คลังรวม)", desc: "คำถามภาษาอังกฤษหลากหลายจากเกมตกปลา", age: [7, 16], fish: ["อังกฤษ"] },
];
