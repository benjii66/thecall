import { config } from 'dotenv';
config({path: '.env.local'});

async function clearUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("Missing Upstash config");
    return;
  }
  
  // Get all keys
  const res = await fetch(`${url}/SCAN/0/MATCH/profile:*`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const keys = data.result[1];
  
  if (keys && keys.length > 0) {
     const delRes = await fetch(`${url}/DEL/${keys.join('/')}`, {
         headers: { Authorization: `Bearer ${token}` }
     });
     console.log("Deleted keys:", keys, await delRes.json());
  } else {
     console.log("No keys to delete");
  }
}

clearUpstash().catch(console.error);
