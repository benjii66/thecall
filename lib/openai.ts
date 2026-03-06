import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { getOpenAIApiKey } from "./settings";

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

// 25s timeout as gpt-4o-mini might take longer for complex schemas
const TIMEOUT_MS = 25000;

let openaiClient: OpenAI | null = null;

async function getClient(): Promise<OpenAI> {
  if (!openaiClient) {
    const key = await getOpenAIApiKey();
    if (!key) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    openaiClient = new OpenAI({
      apiKey: key,
      timeout: TIMEOUT_MS,
    });
  }
  return openaiClient;
}

// Define the Strict JSON Schema for Structured Outputs
const COACHING_SCHEMA = {
  type: "object",
  properties: {
    turningPoint: {
      type: "object",
      properties: {
        type: { type: "string", const: "turning_point" },
        title: { type: "string" },
        description: { type: "string" },
        timestamp: { type: "string", description: "Format MM:SS or generic" },
        impact: { type: "string" }
      },
      required: ["type", "title", "description", "timestamp", "impact"],
      additionalProperties: false
    },
    focus: {
      type: "object",
      properties: {
        type: { type: "string", const: "focus" },
        title: { type: "string" },
        description: { type: "string" }
      },
      required: ["type", "title", "description"],
      additionalProperties: false
    },
    action: {
      type: "object",
      properties: {
        type: { type: "string", const: "action" },
        title: { type: "string" },
        description: { type: "string" }
      },
      required: ["type", "title", "description"],
      additionalProperties: false
    },
    positives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", const: "positive" },
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["type", "title", "description"],
        additionalProperties: false
      }
    },
    negatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", const: "negative" },
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["type", "title", "description"],
        additionalProperties: false
      }
    },
    rootCauses: {
      type: "object",
      properties: {
        title: { type: "string" },
        causes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cause: { type: "string" },
              evidence: { type: "array", items: { type: "string" } },
              timing: { type: "string" }
            },
            required: ["cause", "evidence", "timing"],
            additionalProperties: false
          }
        }
      },
      required: ["title", "causes"],
      additionalProperties: false
    },
    actionPlan: {
      type: "object",
      properties: {
        title: { type: "string" },
        rules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rule: { type: "string" },
              phase: { type: "string", enum: ["early", "mid", "late"] },
              antiErrors: { type: "array", items: { type: "string" } }
            },
            required: ["rule", "phase", "antiErrors"],
            additionalProperties: false
          }
        }
      },
      required: ["title", "rules"],
      additionalProperties: false
    },
    drills: {
      type: "object",
      properties: {
        title: { type: "string" },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exercise: { type: "string" },
              description: { type: "string" },
              games: { type: "integer" }
            },
            required: ["exercise", "description", "games"],
            additionalProperties: false
          }
        }
      },
      required: ["title", "exercises"],
      additionalProperties: false
    },
    buildAnalysis: {
      type: "object",
      properties: {
        title: { type: "string" },
        critique: { type: "string" },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string" },
              reason: { type: "string" },
              replace: { type: "string" }
            },
            required: ["item", "reason", "replace"],
            additionalProperties: false
          }
        }
      },
      required: ["title", "critique", "suggestions"],
      additionalProperties: false
    }
  },
  required: [
    "turningPoint",
    "focus",
    "action",
    "positives",
    "negatives",
    "rootCauses",
    "actionPlan",
    "drills",
    "buildAnalysis"
  ],
  additionalProperties: false
} as const;

export async function generateCoachingReportStrict(
  systemPrompt: string,
  userPrompt: string
): Promise<{ reportJson: unknown; modelUsed: string }> {
  const client = await getClient();
  logger.info("[OpenAI] Starting generation", { model });

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coaching_report",
          strict: true,
          schema: COACHING_SCHEMA,
        },
      },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned empty content");
    }

    // Since we use strict schema, parse should be safe, but we catch just in case
    const reportJson = JSON.parse(content);
    
    return {
      reportJson,
      modelUsed: model,
    };
  } catch (err) {
    logger.error("[OpenAI] Generation failed", err);
    throw err;
  }
}
const PROFILE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    strengths: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          why_it_matters: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metric: { type: "string" },
                value: { type: "string" },
                count: { type: "number" },
                pct: { type: "number" }
              },
              required: ["metric", "value", "count", "pct"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "why_it_matters", "confidence", "evidence"],
        additionalProperties: false
      }
    },
    weaknesses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          impact: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                metric: { type: "string" },
                value: { type: "string" },
                count: { type: "number" },
                pct: { type: "number" }
              },
              required: ["metric", "value", "count", "pct"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "impact", "confidence", "evidence"],
        additionalProperties: false
      }
    },
    top_3_priorities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          priority: { type: "string" },
          quick_fix: { type: "string" },
          drill: { type: "string" },
          evidence_refs: { 
              type: "array",
              items: { type: "string" }
          }
        },
        required: ["priority", "quick_fix", "drill", "evidence_refs"],
        additionalProperties: false
      }
    },
    wording_rules_applied: {
      type: "object",
      properties: {
        often_threshold_used: { type: "number" },
        sometimes_threshold_used: { type: "number" },
        matches_count: { type: "number" },
        confidence_score: { type: "number", description: "Global confidence 0.0-1.0 based on sample size and consistency" }
      },
      required: ["often_threshold_used", "sometimes_threshold_used", "matches_count", "confidence_score"],
      additionalProperties: false
    }
  },
  required: ["summary", "strengths", "weaknesses", "top_3_priorities", "wording_rules_applied"],
  additionalProperties: false
} as const;

export async function generateProfileReportStrict(
  systemPrompt: string,
  userPrompt: string
): Promise<{ reportJson: any; modelUsed: string }> {
  const client = await getClient();
  logger.info("[OpenAI] Starting profile generation", { model });

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "profile_report",
          strict: true,
          schema: PROFILE_SCHEMA,
        },
      },
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned empty content");
    }

    const reportJson = JSON.parse(content);
    
    return {
      reportJson,
      modelUsed: model,
    };
  } catch (err) {
    logger.error("[OpenAI] Profile Generation failed", err);
    throw err;
  }
}
