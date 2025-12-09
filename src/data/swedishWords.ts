export interface FlashCardItem {
  id: string;
  front: string;
  back: string;
  category: string;
}

export const swedishWords: FlashCardItem[] = [
  // Djur
  { id: "sw-1", front: "Hund 🐕", back: "Dog", category: "djur" },
  { id: "sw-2", front: "Katt 🐱", back: "Cat", category: "djur" },
  { id: "sw-3", front: "Häst 🐴", back: "Horse", category: "djur" },
  { id: "sw-4", front: "Fågel 🐦", back: "Bird", category: "djur" },
  { id: "sw-5", front: "Fisk 🐟", back: "Fish", category: "djur" },
  
  // Färger
  { id: "sw-6", front: "Röd 🔴", back: "Red", category: "färger" },
  { id: "sw-7", front: "Blå 🔵", back: "Blue", category: "färger" },
  { id: "sw-8", front: "Grön 🟢", back: "Green", category: "färger" },
  { id: "sw-9", front: "Gul 🟡", back: "Yellow", category: "färger" },
  { id: "sw-10", front: "Lila 🟣", back: "Purple", category: "färger" },
  
  // Mat
  { id: "sw-11", front: "Äpple 🍎", back: "Apple", category: "mat" },
  { id: "sw-12", front: "Bröd 🍞", back: "Bread", category: "mat" },
  { id: "sw-13", front: "Ost 🧀", back: "Cheese", category: "mat" },
  { id: "sw-14", front: "Mjölk 🥛", back: "Milk", category: "mat" },
  { id: "sw-15", front: "Vatten 💧", back: "Water", category: "mat" },
  
  // Familj
  { id: "sw-16", front: "Mamma 👩", back: "Mother", category: "familj" },
  { id: "sw-17", front: "Pappa 👨", back: "Father", category: "familj" },
  { id: "sw-18", front: "Syster 👧", back: "Sister", category: "familj" },
  { id: "sw-19", front: "Bror 👦", back: "Brother", category: "familj" },
  { id: "sw-20", front: "Bebis 👶", back: "Baby", category: "familj" },
];

export const getWordsByCategory = (category: string) => {
  return swedishWords.filter((w) => w.category === category);
};

export const getCategories = () => {
  return [...new Set(swedishWords.map((w) => w.category))];
};

export const getRandomWords = (count: number) => {
  const shuffled = [...swedishWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
