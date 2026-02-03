export interface Story {
  id: string;
  title: string;
  coverUrl: string;
  duration: string;
  ageRange: string;
  category: string;
  status: 'NEW' | 'POPULAR' | 'DOWNLOADED';
  summary: string;
  text: string[];
}

export const stories: Story[] = [
  {
    id: '1',
    title: 'The Moon\'s Lullaby',
    coverUrl: 'https://picsum.photos/seed/story1/400/600',
    duration: '12 min',
    ageRange: '3-6',
    category: 'Nature',
    status: 'POPULAR',
    summary: 'A gentle tale about the moon singing bedtime songs to all the children of the world.',
    text: [
      'High above the sleeping world, the moon floated gently in the starry sky. Every night, she had a special job to do - to sing lullabies to all the children who were going to sleep.',
      'Tonight, the moon\'s silvery voice carried across mountains and oceans, through open windows and cozy bedrooms. Her song was soft and soothing, like a warm blanket made of stardust.',
      'As she sang, little stars joined in, twinkling in harmony. The clouds swayed gently, dancing to the peaceful melody that filled the night air.',
      'And one by one, children all around the world closed their eyes, smiled softly, and drifted into the most wonderful dreams, knowing the moon was watching over them until morning came.'
    ]
  },
  {
    id: '2',
    title: 'The Sleepy Cloud Village',
    coverUrl: 'https://picsum.photos/seed/story2/400/600',
    duration: '10 min',
    ageRange: '4-7',
    category: 'Fantasy',
    status: 'NEW',
    summary: 'Journey to a magical village built on clouds where everything is soft and peaceful.',
    text: [
      'Far above the world, there existed a secret village made entirely of clouds. The houses were fluffy and white, and the streets were soft beneath everyone\'s feet.',
      'In this cloud village lived the Dreamweavers - gentle beings who spent their days creating beautiful dreams for children. They worked in cozy workshops, spinning threads of starlight and moonbeams.',
      'Every evening, as the sun set and painted the sky in pinks and purples, the Dreamweavers would carefully package each dream and send it floating down to Earth on gentle breezes.',
      'Tonight, they had created an especially wonderful dream just for you - filled with adventures, laughter, and all the things that make you happiest. Close your eyes, and it will find you soon.'
    ]
  },
  {
    id: '3',
    title: 'The Whispering Forest',
    coverUrl: 'https://picsum.photos/seed/story3/400/600',
    duration: '15 min',
    ageRange: '5-8',
    category: 'Nature',
    status: 'POPULAR',
    summary: 'Trees share their ancient bedtime wisdom with forest creatures.',
    text: [
      'Deep in an ancient forest, the old trees knew a secret. Every night, when the world grew quiet, they would whisper stories to each other - tales they had witnessed over hundreds of years.',
      'The baby fox curled up beneath the grandfather oak always loved to listen. The tree\'s voice was like rustling leaves, telling of seasons long past, of snowflakes and sunshine, of patience and growth.',
      'Other forest animals gathered too - rabbits, deer, and sleepy birds. They nestled in roots and branches, listening to the wisdom of the trees who knew that rest was just as important as activity.',
      'As the stories continued, the forest creatures felt peace wash over them. They learned that tomorrow would bring new adventures, but tonight was for rest, safety, and gentle dreams beneath the protective branches.'
    ]
  },
  {
    id: '4',
    title: 'The Dreamboat Journey',
    coverUrl: 'https://picsum.photos/seed/story4/400/600',
    duration: '8 min',
    ageRange: '3-5',
    category: 'Adventure',
    status: 'DOWNLOADED',
    summary: 'Sail on a magical boat through the sea of dreams.',
    text: [
      'Every night, a special boat appears at the edge of sleep. It\'s made of moonlight and has sails woven from the softest clouds. This is the Dreamboat, and it\'s ready to take you on a journey.',
      'As you climb aboard, the boat begins to glide across a calm, shimmering sea. The water sparkles with reflections of stars, and gentle waves rock you softly back and forth.',
      'The Dreamboat captain is a friendly owl who guides the vessel through peaceful waters, past islands made of pillows and shores lined with sleeping flowers that glow softly in the night.',
      'Your journey continues through warm, gentle currents until you reach the Island of Rest, where the boat anchors for the night and you drift into the deepest, most peaceful sleep.'
    ]
  },
  {
    id: '5',
    title: 'The Star Collector',
    coverUrl: 'https://picsum.photos/seed/story5/400/600',
    duration: '11 min',
    ageRange: '4-7',
    category: 'Fantasy',
    status: 'NEW',
    summary: 'A gentle giant collects falling stars and returns them to the sky.',
    text: [
      'In a quiet corner of the universe lived a gentle giant named Stellan. His job was very important - he collected any stars that fell from the sky and helped them find their way back home.',
      'Stellan worked slowly and carefully, treating each star with tender care. He would polish them gently until they sparkled brightly again, then lift them high above his head to return them to their place.',
      'The stars were always grateful, and as they returned to the sky, they would shine extra bright just for Stellan, creating beautiful patterns that looked like thank-you notes written in light.',
      'Tonight, as Stellan finishes his work and settles down to rest, he looks up at the sky he helped make beautiful. And all the stars twinkle down at you too, grateful for the chance to shine and watch over your sleep.'
    ]
  },
  {
    id: '6',
    title: 'The Cozy Burrow',
    coverUrl: 'https://picsum.photos/seed/story6/400/600',
    duration: '9 min',
    ageRange: '3-6',
    category: 'Animals',
    status: 'POPULAR',
    summary: 'A rabbit family prepares their underground home for the perfect sleep.',
    text: [
      'Beneath a meadow of soft grass, the rabbit family had the coziest burrow in the whole forest. Mama Rabbit was fluffing up the moss bedding, making it extra soft and comfortable.',
      'Papa Rabbit checked that all the roots and earth walls were secure, creating a snug space where his family would be safe and warm all night long.',
      'The little bunnies helped by arranging their favorite smooth pebbles and bringing in sweet-smelling clover to make the burrow smell nice and fresh.',
      'When everything was perfect, the rabbit family snuggled close together in their cozy burrow. They felt the gentle earth surrounding them, keeping them safe and peaceful. And that\'s how they drifted off to sleep, warm and content.'
    ]
  },
  {
    id: '7',
    title: 'The Night Garden',
    coverUrl: 'https://picsum.photos/seed/story7/400/600',
    duration: '13 min',
    ageRange: '5-8',
    category: 'Nature',
    status: 'DOWNLOADED',
    summary: 'Discover the magical garden that only blooms at night.',
    text: [
      'While most gardens sleep at night, there was one very special garden that came alive when the sun went down. This was the Night Garden, where flowers only opened their petals under the moon and stars.',
      'The Night Bloom flowers glowed softly in shades of silver, blue, and gentle purple. They swayed to music that only they could hear - the quiet symphony of the nighttime world.',
      'Fireflies danced between the blossoms, adding their own sparkles to the magical scene. A gentle breeze carried the sweetest fragrance, a scent that helped all who smelled it feel calm and ready for sleep.',
      'As midnight approached, the flowers began their lullaby, a soft humming that seemed to come from the earth itself. Anyone who visited the Night Garden would leave feeling peaceful, carrying a little bit of its magic with them into their dreams.'
    ]
  },
  {
    id: '8',
    title: 'The Lighthouse Keeper\'s Tale',
    coverUrl: 'https://picsum.photos/seed/story8/400/600',
    duration: '14 min',
    ageRange: '6-9',
    category: 'Adventure',
    status: 'NEW',
    summary: 'An old lighthouse keeper shares stories with the sea.',
    text: [
      'On a rocky shore stood an old lighthouse, its light sweeping across the dark waters every night. Inside lived a kind lighthouse keeper who had watched over the sea for many, many years.',
      'Each evening, the lighthouse keeper would light the great lamp at the top of the tower. As it began to shine, she would talk to the sea, sharing stories of all the ships she had guided safely to harbor.',
      'The sea would respond with gentle waves, a rhythmic sound that seemed to say "thank you" over and over. Sometimes dolphins would leap in the lighthouse beam, adding their own playful notes to the nighttime conversation.',
      'Tonight, as the lighthouse keeper settles into her chair with a cup of warm tea, she smiles knowing that her light helps everyone feel safe. And just like the ships she guides, you too are safe and protected as you drift off to sleep.'
    ]
  },
  {
    id: '9',
    title: 'The Snowy Owl\'s Watch',
    coverUrl: 'https://picsum.photos/seed/story9/400/600',
    duration: '10 min',
    ageRange: '4-7',
    category: 'Animals',
    status: 'POPULAR',
    summary: 'A wise owl watches over the winter forest while everyone sleeps.',
    text: [
      'In the heart of winter, when snow covered everything in a peaceful blanket of white, a beautiful snowy owl sat perched in the tallest tree. Her name was Luna, and she was the guardian of the sleeping forest.',
      'Luna\'s keen eyes watched over all the animals tucked safely in their warm burrows and nests. She listened to the soft sound of snowflakes falling and the quiet breathing of the sleeping woods.',
      'Sometimes she would hoot softly - not to wake anyone, but to let them know in their dreams that someone kind was watching over them. Her call was gentle and reassuring, like a mother\'s voice saying "all is well."',
      'As the night deepened, Luna fluffed her feathers against the cold and continued her watch. She would stay awake through the night so everyone else could sleep soundly, safe under her careful, caring gaze.'
    ]
  },
  {
    id: '10',
    title: 'The Rainbow Bridge to Dreams',
    coverUrl: 'https://picsum.photos/seed/story10/400/600',
    duration: '12 min',
    ageRange: '5-8',
    category: 'Fantasy',
    status: 'DOWNLOADED',
    summary: 'Cross a magical rainbow bridge into the land of beautiful dreams.',
    text: [
      'At the very edge of wakefulness, where sleep begins, there appears a magnificent bridge made of rainbow light. This is the Rainbow Bridge, and it leads to the most wonderful place - the Land of Dreams.',
      'The bridge is soft beneath your feet, and each color you walk across fills you with a different peaceful feeling. Red brings warmth, orange brings comfort, yellow brings happiness, green brings calm.',
      'Blue brings serenity, indigo brings deep rest, and violet brings the sweetest, most magical dreams. As you cross the bridge, you feel lighter and more relaxed with each step.',
      'At the end of the bridge, the Land of Dreams welcomes you with open arms. Everything here is exactly as you\'d wish it to be - safe, joyful, and filled with wonder. And here, on the other side of the Rainbow Bridge, you stay until morning comes and brings you gently back home.'
    ]
  }
];

export const listeningSessionsData = [
  { day: 'Mon', sessions: 3 },
  { day: 'Tue', sessions: 5 },
  { day: 'Wed', sessions: 4 },
  { day: 'Thu', sessions: 6 },
  { day: 'Fri', sessions: 7 },
  { day: 'Sat', sessions: 5 },
  { day: 'Sun', sessions: 4 }
];

export const sleepScoreData = [
  { day: 1, score: 75, optimal: 80 },
  { day: 5, score: 78, optimal: 80 },
  { day: 10, score: 82, optimal: 80 },
  { day: 15, score: 85, optimal: 80 },
  { day: 20, score: 88, optimal: 80 },
  { day: 25, score: 90, optimal: 80 },
  { day: 30, score: 92, optimal: 80 }
];

export const downloadedStories = stories.filter(s => s.status === 'DOWNLOADED');
