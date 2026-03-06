import { prisma } from "./prisma";

/**
 * Hybrid configuration utility.
 * Looks up a value in the SystemSetting table first, 
 * then falls back to process.env.
 */
export async function getSystemSetting(key: string): Promise<string | undefined> {
  try {
    // 1. Try DB override
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    
    if (setting?.value) {
      return setting.value;
    }
  } catch (error) {
    console.warn(`[Settings] Failed to fetch key ${key} from database, falling back to env.`);
  }

  // 2. Fallback to process.env
  return process.env[key];
}

/**
 * Specifically for the Riot API Key which can have multiple names in env.
 */
export async function getRiotApiKey(): Promise<string | undefined> {
  return await getSystemSetting("RIOT_API_KEY");
}

/**
 * Specifically for the OpenAI API Key.
 */
export async function getOpenAIApiKey(): Promise<string | undefined> {
  return await getSystemSetting("OPENAI_API_KEY");
}
