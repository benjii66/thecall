import { config } from 'dotenv';
config({path: '.env'});
config({path: '.env.local'});
import { getRedisClient } from './lib/redis';

async function main() {
  const r = getRedisClient();
  if (r) {
    const keys = await r.keys('profile:agg*');
    if (keys.length > 0) {
      await r.del(...keys);
      console.log('Cleared redis keys:', keys);
    } else {
      console.log('No redis keys to clear.');
    }
  } else {
    console.log('Redis client is null.');
  }
}
main().catch(console.error).finally(()=>process.exit());
