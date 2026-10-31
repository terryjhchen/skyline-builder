// The cities the player can pick from, and their famous places.
// Landmark positions are [x, y] on the 16x16 grid. Rivers run through
// x = 8..13, and the sea covers x >= 12, so landmarks sit clear of the water
// unless they are on an island.

export const CITIES = [
  { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', water: 'river', seed: 11,
    landmarks: [['eiffel', 5, 5], ['arc', 4, 11]] },
  { id: 'london', name: 'London', country: 'England', flag: '🇬🇧', water: 'river', seed: 23,
    landmarks: [['bigben', 6, 6], ['eye', 4, 11]] },
  { id: 'newyork', name: 'New York', country: 'the USA', flag: '🇺🇸', water: 'sea', seed: 31,
    landmarks: [['empire', 5, 6], ['liberty', 14, 10]] },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', water: 'river', seed: 41,
    landmarks: [['tokyotower', 5, 5], ['pagoda', 4, 11]] },
  { id: 'sydney', name: 'Sydney', country: 'Australia', flag: '🇦🇺', water: 'sea', seed: 53,
    landmarks: [['opera', 10, 5], ['harbour', 11, 10]] },
  { id: 'rome', name: 'Rome', country: 'Italy', flag: '🇮🇹', water: 'river', seed: 61,
    landmarks: [['colosseum', 5, 6], ['pantheon', 3, 11]] },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', flag: '🇪🇬', water: 'river', seed: 71, sand: true,
    landmarks: [['pyramid', 3, 4], ['sphinx', 5, 8]] },
  { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', water: 'sea', seed: 83,
    landmarks: [['christ', 4, 4], ['sugarloaf', 10, 11]] },
  { id: 'dubai', name: 'Dubai', country: 'the UAE', flag: '🇦🇪', water: 'sea', seed: 97, sand: true,
    landmarks: [['burj', 5, 6], ['burjarab', 13, 8]] },
];

// `name` is used inside sentences ("Build a road to the Eiffel Tower.").
export const LANDMARKS = {
  eiffel: { name: 'the Eiffel Tower', fact: 'This is the Eiffel Tower. It is made of iron. It is very tall!' },
  arc: { name: 'the Arc de Triomphe', fact: 'This is the Arc de Triomphe. It is a giant stone arch.' },
  bigben: { name: 'Big Ben', fact: 'This is Big Ben. It is a big clock tower. Bong, bong!' },
  eye: { name: 'the London Eye', fact: 'This is the London Eye. It is a giant wheel. You can see the whole city from the top!' },
  empire: { name: 'the Empire State Building', fact: 'This is the Empire State Building. It has 102 floors!' },
  liberty: { name: 'the Statue of Liberty', island: true, fact: 'This is the Statue of Liberty. She holds a torch up high. She lives on an island.' },
  tokyotower: { name: 'Tokyo Tower', fact: 'This is Tokyo Tower. It is red and white. It is a little taller than the Eiffel Tower!' },
  pagoda: { name: 'the pagoda', fact: 'This is a pagoda. It is a temple with five roofs.' },
  opera: { name: 'the Opera House', fact: 'This is the Sydney Opera House. Its roof looks like the sails of a boat.' },
  harbour: { name: 'the Harbour Bridge', overWater: true, fact: 'This is the Harbour Bridge. People call it the Coathanger!' },
  colosseum: { name: 'the Colosseum', fact: 'This is the Colosseum. It is almost 2,000 years old!' },
  pantheon: { name: 'the Pantheon', fact: 'This is the Pantheon. It has a giant round roof called a dome.' },
  pyramid: { name: 'the Great Pyramid', fact: 'This is the Great Pyramid. It is made of giant stone blocks. It is very, very old.' },
  sphinx: { name: 'the Sphinx', fact: 'This is the Sphinx. It has the body of a lion and the head of a person.' },
  christ: { name: 'Christ the Redeemer', fact: 'This is Christ the Redeemer. The big statue stands on top of a mountain.' },
  sugarloaf: { name: 'Sugarloaf Mountain', fact: 'This is Sugarloaf Mountain. A cable car takes people to the top.' },
  burj: { name: 'the Burj Khalifa', fact: 'This is the Burj Khalifa. It is the tallest building in the world!' },
  burjarab: { name: 'the Burj Al Arab', island: true, fact: 'This is the Burj Al Arab. It looks like a sail. It sits on its own island.' },
};

export function cityById(id) {
  return CITIES.find((c) => c.id === id);
}

export function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}
