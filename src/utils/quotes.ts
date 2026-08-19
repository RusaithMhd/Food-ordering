export const foodQuotes = [
  "Good food is the foundation of genuine happiness.",
  "First we eat, then we do everything else.",
  "People who love to eat are always the best people.",
  "Cooking is all about people. Food is maybe the only universal thing that really has the power to bring everyone together.",
  "One cannot think well, love well, sleep well, if one has not dined well.",
  "Life is uncertain. Eat dessert first.",
  "There is no sincerer love than the love of food.",
  "Food for the body is not enough. There must be food for the soul.",
  "The only time to eat diet food is while you're waiting for the steak to cook.",
  "A recipe has no soul. You as the cook must bring soul to the recipe."
];

export function getDailyQuote(): string {
  // Use the day of the year to pick a quote so it changes daily but stays consistent for all users on that day
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  return foodQuotes[dayOfYear % foodQuotes.length];
}
