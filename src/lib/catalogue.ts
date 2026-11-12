// Public descriptions and prices; checkout always prices again on the server.
export const products = [{ id: 'orbit-city-cruiser', title: 'Orbit City Cruiser',
  description: 'A pocket-sized wooden cruiser for your desk or collection.', priceCents: 1800,
  category: 'Everyday collectibles', tags: ['cars', 'wood', 'desk', 'collector'] }] as const
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
