import { prisma } from "../../packages/db/src/index.js";

async function main() {
  console.log("Running database backfill to recalibrate signal severities...\n");

  // Recalibrate metadata_absent and duplicate_file_same_candidate from inconclusive to low_concern
  const result = await prisma.documentAnalysis.updateMany({
    where: {
      signalType: {
        in: ["metadata_absent", "duplicate_file_same_candidate"],
      },
      severity: "inconclusive",
    },
    data: {
      severity: "low_concern",
    },
  });

  console.log(`Updated ${result.count} DocumentAnalysis row(s) to severity 'low_concern'.`);

  // Verify breakdown
  const remainingInconclusive = await prisma.documentAnalysis.count({
    where: {
      signalType: {
        in: ["metadata_absent", "duplicate_file_same_candidate"],
      },
      severity: "inconclusive",
    },
  });

  console.log(`Remaining 'inconclusive' rows for metadata_absent or duplicate_file_same_candidate: ${remainingInconclusive}`);
}

main()
  .catch((e) => {
    console.error("Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
