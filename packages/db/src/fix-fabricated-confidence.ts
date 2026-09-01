import { prisma } from "./index.js";

async function main() {
  console.log("Running database cleanup for fabricated confidence and degenerate perceptual hashes...\n");

  // 1. Correct degenerate perceptual hashes
  const degeneratePhashResult = await prisma.document.updateMany({
    where: {
      phash: {
        in: ["0000000000000000", "ffffffffffffffff"],
      },
    },
    data: {
      phash: null,
    },
  });
  console.log(`Corrected degenerate phashes: ${degeneratePhashResult.count} row(s) updated to null.`);

  // 2. Correct fabricated ocrConfidence where ocrText is empty / unreadable or was hardcoded
  // Null out all ocrConfidence values where ocrText is null/empty or where ocrConfidence = 0.85
  const ocrConfidenceResult = await prisma.document.updateMany({
    where: {
      OR: [
        { ocrConfidence: { not: null }, ocrText: null },
        { ocrConfidence: { not: null }, ocrText: "" },
        { ocrConfidence: 0.85 },
      ],
    },
    data: {
      ocrConfidence: null,
    },
  });
  console.log(`Corrected fabricated ocrConfidence: ${ocrConfidenceResult.count} row(s) updated to null.`);

  console.log("\nCleanup complete.");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
