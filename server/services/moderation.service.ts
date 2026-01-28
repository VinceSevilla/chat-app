import OpenAI from 'openai';
import dotenv from 'dotenv';
import { huggingFaceService } from './huggingface.service.js';

dotenv.config();

// Check which AI service to use
const OPENAI_ENABLED = process.env.ENABLE_AI !== 'false' && process.env.OPENAI_API_KEY;
const HUGGINGFACE_ENABLED = process.env.HUGGINGFACE_API_KEY;
const AI_ENABLED = OPENAI_ENABLED || HUGGINGFACE_ENABLED;

const openai = OPENAI_ENABLED ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface ModerationResult {
  flagged: boolean;
  blocked: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
  apiError?: boolean;
}
export class ModerationService {
  private blockThreshold = 0.8; // Block messages with scores above this
  private flagThreshold = 0.5; // Flag messages with scores above this
  private apiFailureCount = 0;
  private maxFailures = 5; // Disable API after 5 consecutive failures

  async moderateMessage(content: string): Promise<ModerationResult> {
    // If AI features are disabled, skip moderation
    if (!AI_ENABLED) {
      return {
        flagged: false,
        blocked: false,
        categories: {},
        categoryScores: {},
        apiError: true,
      };
    }

    // If too many API failures, skip moderation
    if (this.apiFailureCount >= this.maxFailures) {
      console.warn('OpenAI API disabled due to repeated failures');
      return {
        flagged: false,
        blocked: false,
        categories: {},
        categoryScores: {},
        apiError: true,
      };
    }

    // If OpenAI is not enabled, skip API-based moderation
    if (!openai) {
      return {
        flagged: false,
        blocked: false,
        categories: {},
        categoryScores: {},
        apiError: true,
      };
    }

    try {
      const moderation = await openai.moderations.create({
        input: content,
      });

      this.apiFailureCount = 0; // Reset on success
      const result = moderation.results[0];
      
      // Check if any category exceeds the block threshold
      const shouldBlock = Object.entries(result.category_scores).some(
        ([, score]) => score >= this.blockThreshold
      );

      // Check if any category exceeds the flag threshold
      const shouldFlag = Object.entries(result.category_scores).some(
        ([, score]) => score >= this.flagThreshold
      );

      return {
        flagged: result.flagged || shouldFlag,
        blocked: shouldBlock,
        categories: { ...result.categories } as Record<string, boolean>,
        categoryScores: { ...result.category_scores } as Record<string, number>,
      };
    } catch (error: any) {
      this.apiFailureCount++;
      console.error(`Moderation API error (${this.apiFailureCount}/${this.maxFailures}):`, error?.message);
      
      // Return safe default that allows the message through
      return {
        flagged: false,
        blocked: false,
        categories: {},
        categoryScores: {},
        apiError: true,
      };
    }
  }

  async generateChatSummary(messages: Array<{ sender_name: string; content: string }>): Promise<string | null> {
    // If AI features are disabled, return null
    if (!AI_ENABLED) {
      return null;
    }

    // If too many API failures, return null
    if (this.apiFailureCount >= this.maxFailures) {
      return null;
    }

    // Try OpenAI first if enabled
    if (OPENAI_ENABLED && openai) {
      try {
        const messageText = messages
          .map(msg => `${msg.sender_name}: ${msg.content}`)
          .join('\n');

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes chat conversations. Provide a concise summary of the key topics discussed.',
            },
            {
              role: 'user',
              content: `Please summarize this chat conversation:\n\n${messageText}`,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        });

        this.apiFailureCount = 0; // Reset on success
        return response.choices[0]?.message?.content || 'Unable to generate summary.';
      } catch (error: any) {
        this.apiFailureCount++;
        console.error(`OpenAI summary error (${this.apiFailureCount}/${this.maxFailures}):`, error?.message);
        
        // Fall through to Hugging Face if available
        if (!HUGGINGFACE_ENABLED) {
          return null;
        }
      }
    }

    // Try Hugging Face as fallback
    if (HUGGINGFACE_ENABLED) {
      try {
        const summary = await huggingFaceService.generateChatSummary(messages);
        if (summary) {
          this.apiFailureCount = 0; // Reset on success
          return summary;
        }
      } catch (error: any) {
        this.apiFailureCount++;
        console.error(`Hugging Face summary error:`, error?.message);
      }
    }

    return null;
  }
}
