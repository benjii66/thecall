import { prisma } from './lib/prisma';
async function main() { 
  console.log('Matches with JSON:', await prisma.match.count({where: {hasMatchJson: true}})); 
  console.log('Matches total:', await prisma.match.count()); 
} 
main().catch(console.error).finally(() => process.exit(0));
