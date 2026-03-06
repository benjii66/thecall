import { prisma } from "./lib/prisma";

async function main() {
  const count = await prisma.coachingReport.count();
  console.log("Total Coaching Reports:", count);
  const now = new Date();
  const and14DaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recentReports = await prisma.coachingReport.findMany({
    where: { createdAt: { gte: and14DaysAgo } },
    select: { id: true, createdAt: true }
  });
  console.log("Reports in last 14 days:", recentReports.length);
  recentReports.forEach(r => console.log(` - ${r.id}: ${r.createdAt.toISOString()}`));
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
