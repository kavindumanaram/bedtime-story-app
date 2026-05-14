export interface CommunityStory {
  id: string
  title: string
  summary: string
  theme: string
  coverGradient: string
  viewCount: number
  communityRank: number
  region?: string
  tags: string[]
  ageMin: number
  ageMax: number
}

export const COMMUNITY_STORIES: CommunityStory[] = [
  {
    id: 'cs-01',
    title: 'The Brave Little Firefly',
    summary: 'A tiny firefly discovers her light is the most magical gift of all, and helps her whole forest find their way home.',
    theme: 'adventure',
    coverGradient: 'linear-gradient(135deg, #1a1040 0%, #4c1d95 50%, #fbbf24 100%)',
    viewCount: 9420,
    communityRank: 1,
    tags: ['nature', 'courage', 'glow'],
    ageMin: 3,
    ageMax: 8,
  },
  {
    id: 'cs-02',
    title: "Luna and the Moon Garden",
    summary: "Every full moon, Luna tends a secret garden that only blooms at night — until a lonely star asks to plant something too.",
    theme: 'fantasy',
    coverGradient: 'linear-gradient(135deg, #0d1b2a 0%, #1e3a5f 50%, #7c3aed 100%)',
    viewCount: 8810,
    communityRank: 2,
    tags: ['moon', 'magic', 'friendship'],
    ageMin: 4,
    ageMax: 10,
  },
  {
    id: 'cs-03',
    title: "Captain Rex's Ocean Quest",
    summary: 'Captain Rex the crab sets off to find the lost treasure of the coral reef — but the real prize is the crew he makes along the way.',
    theme: 'ocean',
    coverGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 60%, #06b6d4 100%)',
    viewCount: 7650,
    communityRank: 3,
    tags: ['ocean', 'adventure', 'teamwork'],
    ageMin: 4,
    ageMax: 9,
  },
  {
    id: 'cs-04',
    title: 'The Friendship Forest',
    summary: 'When a new bunny moves into the forest, every animal is too shy to say hello — until a thunderstorm changes everything.',
    theme: 'friendship',
    coverGradient: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #4ade80 100%)',
    viewCount: 7340,
    communityRank: 4,
    tags: ['friendship', 'kindness', 'animals'],
    ageMin: 2,
    ageMax: 7,
  },
  {
    id: 'cs-05',
    title: 'Robot and the Rainbow Machine',
    summary: 'BEEP the robot has one dream: to build a machine that makes rainbows. The only problem? Rainbows need feelings — and robots are still learning.',
    theme: 'space',
    coverGradient: 'linear-gradient(135deg, #1e1b4b 0%, #7e22ce 50%, #ec4899 100%)',
    viewCount: 6900,
    communityRank: 5,
    tags: ['robots', 'creativity', 'feelings'],
    ageMin: 4,
    ageMax: 10,
  },
  {
    id: 'cs-06',
    title: "Princess Coral's Underwater Palace",
    summary: 'Princess Coral can talk to fish, grow sea-flowers, and ride seahorses — but she has never seen a sunrise. One day she swims up to find out.',
    theme: 'fantasy',
    coverGradient: 'linear-gradient(135deg, #0c4a6e 0%, #155e75 40%, #7c3aed 100%)',
    viewCount: 6450,
    communityRank: 6,
    tags: ['ocean', 'magic', 'wonder'],
    ageMin: 3,
    ageMax: 9,
  },
  {
    id: 'cs-07',
    title: 'The Lost Star of the Milky Way',
    summary: 'A young star tumbles from the sky and lands in a child\'s garden. Together they figure out how to get her home before sunrise.',
    theme: 'space',
    coverGradient: 'linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #818cf8 100%)',
    viewCount: 5880,
    communityRank: 7,
    tags: ['stars', 'space', 'kindness'],
    ageMin: 4,
    ageMax: 11,
  },
  {
    id: 'cs-08',
    title: "Grandma's Magic Garden",
    summary: 'Grandma says every plant in her garden has a story. This summer, a grandchild finally asks to hear them all.',
    theme: 'nature',
    coverGradient: 'linear-gradient(135deg, #422006 0%, #92400e 40%, #16a34a 100%)',
    viewCount: 5200,
    communityRank: 8,
    tags: ['family', 'nature', 'wonder'],
    ageMin: 3,
    ageMax: 10,
  },
  {
    id: 'cs-09',
    title: "The Giant's Lost Toy",
    summary: 'When a tiny blue button rolls into a village, no one knows it belongs to the friendly giant on the hill — until a child decides to return it.',
    theme: 'adventure',
    coverGradient: 'linear-gradient(135deg, #1c1917 0%, #44403c 50%, #7dd3fc 100%)',
    viewCount: 4750,
    communityRank: 9,
    tags: ['giant', 'kindness', 'adventure'],
    ageMin: 3,
    ageMax: 8,
  },
  {
    id: 'cs-10',
    title: 'Billy the Brave Bear',
    summary: 'Billy is afraid of the dark — but so is the darkness itself. One night they meet, and both learn something new about being brave.',
    theme: 'animals',
    coverGradient: 'linear-gradient(135deg, #431407 0%, #c2410c 50%, #fbbf24 100%)',
    viewCount: 4300,
    communityRank: 10,
    tags: ['animals', 'courage', 'bedtime'],
    ageMin: 2,
    ageMax: 7,
  },
  {
    id: 'cs-sydney-01',
    title: 'Taronga Zoo at Midnight',
    summary: 'When the gates close and visitors go home, the animals of Taronga Zoo put on their own show — starring a very surprised night-guard named Max.',
    theme: 'animals',
    coverGradient: 'linear-gradient(135deg, #052e16 0%, #166534 40%, #fbbf24 100%)',
    viewCount: 3800,
    communityRank: 1,
    region: 'sydney',
    tags: ['sydney', 'zoo', 'animals', 'magic'],
    ageMin: 3,
    ageMax: 9,
  },
  {
    id: 'cs-sydney-02',
    title: 'The Blue Mountains Dragon',
    summary: 'Hidden in the mist of the Blue Mountains lives a dragon who paints the rock walls with her breath. A bush walker stumbles upon her gallery.',
    theme: 'dragon',
    coverGradient: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #60a5fa 100%)',
    viewCount: 3200,
    communityRank: 2,
    region: 'sydney',
    tags: ['sydney', 'dragon', 'mountains', 'art'],
    ageMin: 4,
    ageMax: 11,
  },
]

export function getCommunityStories(region?: string, limit = 10): CommunityStory[] {
  let stories = COMMUNITY_STORIES
  if (region) {
    stories = stories.filter(s => s.region === region)
  } else {
    stories = stories.filter(s => !s.region)
  }
  return stories
    .sort((a, b) => a.communityRank - b.communityRank)
    .slice(0, limit)
}
