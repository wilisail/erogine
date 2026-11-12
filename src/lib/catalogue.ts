// Public descriptions and prices; checkout always prices again on the server.
export const products = [
  { id: 'orbit-city-cruiser', title: 'Orbit City Cruiser', description: 'A pocket-sized wooden cruiser for your desk or collection.', priceCents: 1800, category: 'Collect', tags: ['cars', 'wood', 'desk', 'collector'], art: 'car', color: 'sage' },
  { id: 'little-city-blocks', title: 'Little City Blocks', description: 'Twelve wooden blocks for making tiny cities and big stories.', priceCents: 2400, category: 'Build', tags: ['building', 'wood', 'creative', 'cities'], art: 'blocks', color: 'peach' },
  { id: 'pocket-puzzle', title: 'Pocket Puzzle', description: 'A compact sliding puzzle for a thoughtful screen-free break.', priceCents: 1200, category: 'Play', tags: ['puzzles', 'travel', 'logic', 'quiet'], art: 'puzzle', color: 'lavender' },
  { id: 'moon-mission-kit', title: 'Moon Mission Kit', description: 'A snap-together rocket and moon base for space-inspired stories.', priceCents: 3200, category: 'Build', tags: ['space', 'building', 'science', 'creative'], art: 'rocket', color: 'blue' },
  { id: 'moss-bear', title: 'Moss Bear', description: 'A small soft bear with a calm green outfit for a cosy shelf.', priceCents: 2200, category: 'Collect', tags: ['plush', 'animals', 'cosy', 'gift'], art: 'bear', color: 'sage' },
  { id: 'tiny-robot', title: 'Tiny Robot', description: 'An articulated wooden robot ready for a new desk adventure.', priceCents: 2800, category: 'Collect', tags: ['robots', 'wood', 'desk', 'science'], art: 'robot', color: 'sand' },
  { id: 'story-starter-cards', title: 'Story Starter Cards', description: 'Thirty illustrated prompts for imaginative stories with friends.', priceCents: 1500, category: 'Play', tags: ['stories', 'creative', 'friends', 'travel'], art: 'cards', color: 'peach' },
  { id: 'balance-garden', title: 'Balance Garden', description: 'Five smooth wooden shapes to stack into a miniature desk garden.', priceCents: 2600, category: 'Build', tags: ['balance', 'wood', 'desk', 'quiet'], art: 'garden', color: 'lavender' },
] as const
export type Product = typeof products[number]
export const findProduct = (id: string) => products.find(product => product.id === id)
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
