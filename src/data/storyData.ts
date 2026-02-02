// Story type and mock data for Bedtime Story app
export type Story = {
  id: string;
  title: string;
  ageGroup: '4-5' | '6-8';
  coverImageUrl: string;
  shortDescription: string;
  paragraphs: string[];
  durationMin: number;
  // Full-page images for the story book (3 pages recommended)
  pages?: string[];
};

export const mockStories: Story[] = [
  {
    id: '1',
    title: 'The Sleepy Moon',
    ageGroup: '4-5',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    // Full-page images for an eye-catching child book
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A gentle bedtime story about the moon watching over sleepy children. Perfect for winding down.',
    paragraphs: [
      'Once upon a time, the moon yawned and stretched as it rose into the sky.',
      'It watched over the world, shining softly on sleeping children everywhere.',
      'The stars twinkled gently, keeping the moon company through the night.'
    ],
    durationMin: 3
  },
  {
    id: '2',
    title: 'The Brave Little Star',
    ageGroup: '6-8',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A sparkling adventure of a little star who learns that true bravery comes from kindness.',
    paragraphs: [
      'High above, a little star wished to shine brighter than all the rest.',
      'It tried and tried, learning that true brightness comes from kindness and helping others.',
      'The little star shared its light with friends, making the night sky even more beautiful.'
    ],
    durationMin: 4
  },
  {
    id: '3',
    title: 'The Forest Lullaby',
    ageGroup: '4-5',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'Whispers of the trees and a lullaby carried on the wind.',
    paragraphs: [
      'In a quiet forest, leaves rustled like a soft song.',
      'Animals curled up as the lullaby drifted through the branches.',
      'The moon listened and hummed along until every creature slept.'
    ],
    durationMin: 3
  },
  {
    id: '4',
    title: 'The Little Owl',
    ageGroup: '6-8',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A curious owl learns about the world at night.',
    paragraphs: [
      'The little owl opened its big eyes and peeked into the night.',
      'It met fireflies, listened to crickets, and learned the song of the wind.',
      'By dawn, it had discovered that the night is full of wonder.'
    ],
    durationMin: 4
  },
  {
    id: '5',
    title: 'The Cloud Ship',
    ageGroup: '6-8',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A magical ship that sails across the starlit sky.',
    paragraphs: [
      'High above, a ship made of clouds sailed between stars.',
      'Children waved from their windows as the ship hummed a gentle tune.',
      'It promised to carry dreams to every sleeping town it passed.'
    ],
    durationMin: 5
  },
  {
    id: '6',
    title: 'The Gentle Giant',
    ageGroup: '6-8',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A big but gentle friend who watches over the little ones.',
    paragraphs: [
      'There once was a giant who tiptoed so he would not wake anyone.',
      'He fixed crooked fences and tucked in the animals each night.',
      'Everyone felt safer with his quiet, kind presence nearby.'
    ],
    durationMin: 5
  },
  {
    id: '7',
    title: 'The Tiny Lighthouse',
    ageGroup: '4-5',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A small lighthouse with a very important job.',
    paragraphs: [
      'On a small coast stood a tiny lighthouse that never forgot to shine.',
      'Ships waved as they passed, and the lighthouse blinked back like a friend.',
      'Its little light guided many safely through the night.'
    ],
    durationMin: 3
  },
  {
    id: '8',
    title: 'The Moonlight Parade',
    ageGroup: '4-5',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A quiet parade of stars and friendly moonbeams.',
    paragraphs: [
      'Each night the stars marched in a gentle parade across the sky.',
      'Moonbeams twirled between them in delicate ribbons of light.',
      'The world below watched in peaceful wonder.'
    ],
    durationMin: 3
  },
  {
    id: '9',
    title: 'The Starlit Train',
    ageGroup: '6-8',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A tiny train that chugs along the Milky Way.',
    paragraphs: [
      'The starlit train whistled softly as it crossed the sky.',
      'Passengers of comets and friendly clouds waved as it passed.',
      'It always stopped at the Dream Station where wishes hopped on.'
    ],
    durationMin: 4
  },
  {
    id: '10',
    title: 'The Quiet Pond',
    ageGroup: '4-5',
    coverImageUrl: 'https://images.pexels.com/photos/30864661/pexels-photo-30864661.jpeg',
    pages: [
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
      'https://images.pexels.com/photos/35389652/pexels-photo-35389652.jpeg',
      'https://images.pexels.com/photos/1435075/pexels-photo-1435075.jpeg'
    ],
    shortDescription: 'A calm pond where frogs sing lullabies under the moon.',
    paragraphs: [
      'The pond shimmered under a silver moon.',
      'Frogs crooned a soft tune that drifted over the reeds.',
      'Soon every creature nearby sighed and slept contently.'
    ],
    durationMin: 3
  }
];
