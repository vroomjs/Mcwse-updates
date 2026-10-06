// Hunger values are the visible food points restored by each food item.
// Saturation values are the points added to the hidden saturation reservoir.
export const FOOD_STATS = Object.freeze({
    260: { hunger: 3, saturation: 2.4 },   // Apple
    282: { hunger: 6, saturation: 7.2 },   // Mushroom Stew
    357: { hunger: 2, saturation: 0.4 },   // Cookie
    494: { hunger: 2, saturation: 1.2 },   // Raw Mutton
    495: { hunger: 6, saturation: 9.6 },   // Cooked Mutton
    322: { hunger: 5, saturation: 9.6 },   // Golden Apple
    404: { hunger: 6, saturation: 14.4 },  // Golden Carrot
    297: { hunger: 5, saturation: 6.0 },   // Bread
    319: { hunger: 3, saturation: 1.8 },   // Raw Porkchop
    320: { hunger: 8, saturation: 12.8 },  // Cooked Porkchop
    363: { hunger: 3, saturation: 1.8 },   // Raw Beef
    364: { hunger: 8, saturation: 12.8 },  // Steak
    365: { hunger: 4.5, saturation: 1.2 }, // Raw Chicken
    366: { hunger: 7, saturation: 7.2 },   // Cooked Chicken
    367: { hunger: 4, saturation: 0.8 },   // Rotten Flesh
    349: { hunger: 2, saturation: 0.4 },   // Raw Cod
    350: { hunger: 5, saturation: 6.0 },   // Cooked Cod
    354: { hunger: 2, saturation: 0.4 },   // Raw Salmon
    355: { hunger: 6, saturation: 9.6 },   // Cooked Salmon
    403: { hunger: 3, saturation: 3.6 },   // Carrot
    405: { hunger: 1, saturation: 0.6 },   // Potato
    406: { hunger: 5, saturation: 6.0 },   // Baked Potato
    422: { hunger: 1, saturation: 1.2 },   // Beetroot
    423: { hunger: 6, saturation: 7.2 },   // Beetroot Soup
    34: { hunger: 1, saturation: 0.4 },    // Red Mushroom
    35: { hunger: 1, saturation: 0.4 },    // Brown Mushroom
    570: { hunger: 2, saturation: 0.4 }    // Sweet Berries
});

export function getFoodStats(itemId) {
    return FOOD_STATS[itemId] || null;
}
