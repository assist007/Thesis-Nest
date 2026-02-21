import { seedDatabase } from "../server/seed";

seedDatabase()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  });
