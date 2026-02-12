import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATALOG_ITEMS = [
  // Coffee & Tea
  { title: "Starbucks Gift Card", description: "Enjoy your favorite coffee drinks and snacks", priceCents: 1500, category: "Coffee & Tea", providerProductId: "starbucks-15", imageUrl: "/catalog/coffee.svg", popularity: 95 },
  { title: "Starbucks Gift Card", description: "A generous coffee budget for any occasion", priceCents: 2500, category: "Coffee & Tea", providerProductId: "starbucks-25", imageUrl: "/catalog/coffee.svg", popularity: 90 },
  { title: "Starbucks Gift Card", description: "Lots of lattes and pastries await", priceCents: 5000, category: "Coffee & Tea", providerProductId: "starbucks-50", imageUrl: "/catalog/coffee.svg", popularity: 80 },
  { title: "Blue Bottle Coffee", description: "Premium artisan coffee experience", priceCents: 3000, category: "Coffee & Tea", providerProductId: "bluebottle-30", imageUrl: "/catalog/coffee.svg", popularity: 60 },

  // Food Delivery
  { title: "DoorDash Gift Card", description: "Order from your favorite local restaurants", priceCents: 2500, category: "Food Delivery", providerProductId: "doordash-25", imageUrl: "/catalog/food.svg", popularity: 88 },
  { title: "DoorDash Gift Card", description: "Plenty of meals delivered to your door", priceCents: 5000, category: "Food Delivery", providerProductId: "doordash-50", imageUrl: "/catalog/food.svg", popularity: 85 },
  { title: "Uber Eats Gift Card", description: "Discover new cuisines with delivery", priceCents: 2500, category: "Food Delivery", providerProductId: "ubereats-25", imageUrl: "/catalog/food.svg", popularity: 82 },
  { title: "Uber Eats Gift Card", description: "Order from thousands of restaurants", priceCents: 5000, category: "Food Delivery", providerProductId: "ubereats-50", imageUrl: "/catalog/food.svg", popularity: 78 },
  { title: "Grubhub Gift Card", description: "Local food delivery made easy", priceCents: 3000, category: "Food Delivery", providerProductId: "grubhub-30", imageUrl: "/catalog/food.svg", popularity: 65 },

  // Books & Media
  { title: "Amazon Kindle Credit", description: "Choose from millions of ebooks", priceCents: 1500, category: "Books & Media", providerProductId: "kindle-15", imageUrl: "/catalog/book.svg", popularity: 75 },
  { title: "Audible Gift Card", description: "Audiobooks for your commute or workout", priceCents: 3000, category: "Books & Media", providerProductId: "audible-30", imageUrl: "/catalog/book.svg", popularity: 72 },
  { title: "Barnes & Noble Gift Card", description: "Books, games, and more", priceCents: 2500, category: "Books & Media", providerProductId: "bn-25", imageUrl: "/catalog/book.svg", popularity: 65 },
  { title: "Barnes & Noble Gift Card", description: "A book lover's dream come true", priceCents: 5000, category: "Books & Media", providerProductId: "bn-50", imageUrl: "/catalog/book.svg", popularity: 58 },

  // Gaming
  { title: "Steam Gift Card", description: "Thousands of PC games to choose from", priceCents: 2000, category: "Gaming", providerProductId: "steam-20", imageUrl: "/catalog/gaming.svg", popularity: 87 },
  { title: "Steam Gift Card", description: "Build your ultimate game library", priceCents: 5000, category: "Gaming", providerProductId: "steam-50", imageUrl: "/catalog/gaming.svg", popularity: 83 },
  { title: "Nintendo eShop Card", description: "Games for Switch and more", priceCents: 2000, category: "Gaming", providerProductId: "nintendo-20", imageUrl: "/catalog/gaming.svg", popularity: 78 },
  { title: "PlayStation Store Card", description: "PS5 games, DLC, and in-game currency", priceCents: 2500, category: "Gaming", providerProductId: "psn-25", imageUrl: "/catalog/gaming.svg", popularity: 76 },
  { title: "Xbox Gift Card", description: "Games and entertainment for Xbox", priceCents: 2500, category: "Gaming", providerProductId: "xbox-25", imageUrl: "/catalog/gaming.svg", popularity: 74 },

  // Streaming
  { title: "Netflix Gift Card", description: "Stream movies, series, and documentaries", priceCents: 2500, category: "Streaming", providerProductId: "netflix-25", imageUrl: "/catalog/streaming.svg", popularity: 92 },
  { title: "Netflix Gift Card", description: "Months of binge-worthy entertainment", priceCents: 5000, category: "Streaming", providerProductId: "netflix-50", imageUrl: "/catalog/streaming.svg", popularity: 88 },
  { title: "Spotify Gift Card", description: "Premium music streaming experience", priceCents: 1000, category: "Streaming", providerProductId: "spotify-10", imageUrl: "/catalog/streaming.svg", popularity: 86 },
  { title: "Spotify Gift Card", description: "Three months of Premium music", priceCents: 3000, category: "Streaming", providerProductId: "spotify-30", imageUrl: "/catalog/streaming.svg", popularity: 80 },
  { title: "Disney+ Gift Card", description: "Disney, Pixar, Marvel, and Star Wars", priceCents: 2500, category: "Streaming", providerProductId: "disney-25", imageUrl: "/catalog/streaming.svg", popularity: 75 },

  // Generic Gift Cards
  { title: "Visa Gift Card", description: "Use anywhere Visa is accepted", priceCents: 2500, category: "Generic Gift Cards", providerProductId: "visa-25", imageUrl: "/catalog/generic.svg", popularity: 93 },
  { title: "Visa Gift Card", description: "Maximum flexibility to spend anywhere", priceCents: 5000, category: "Generic Gift Cards", providerProductId: "visa-50", imageUrl: "/catalog/generic.svg", popularity: 91 },
  { title: "Visa Gift Card", description: "The ultimate gift of choice", priceCents: 10000, category: "Generic Gift Cards", providerProductId: "visa-100", imageUrl: "/catalog/generic.svg", popularity: 85 },
  { title: "Mastercard Gift Card", description: "Accepted worldwide for anything", priceCents: 2500, category: "Generic Gift Cards", providerProductId: "mc-25", imageUrl: "/catalog/generic.svg", popularity: 82 },
  { title: "Mastercard Gift Card", description: "Shop online or in-store anywhere", priceCents: 5000, category: "Generic Gift Cards", providerProductId: "mc-50", imageUrl: "/catalog/generic.svg", popularity: 79 },
  { title: "Amazon Gift Card", description: "Millions of items to choose from", priceCents: 2500, category: "Generic Gift Cards", providerProductId: "amazon-25", imageUrl: "/catalog/generic.svg", popularity: 96 },
  { title: "Amazon Gift Card", description: "Everything you need, delivered fast", priceCents: 5000, category: "Generic Gift Cards", providerProductId: "amazon-50", imageUrl: "/catalog/generic.svg", popularity: 94 },
  { title: "Amazon Gift Card", description: "The perfect gift for everyone", priceCents: 10000, category: "Generic Gift Cards", providerProductId: "amazon-100", imageUrl: "/catalog/generic.svg", popularity: 89 },
];

async function main() {
  console.log("Seeding catalog items...");

  // Clear existing
  await prisma.catalogItem.deleteMany();

  for (const item of CATALOG_ITEMS) {
    await prisma.catalogItem.create({
      data: {
        ...item,
        currency: "usd",
        active: true,
      },
    });
  }

  console.log(`Seeded ${CATALOG_ITEMS.length} catalog items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
