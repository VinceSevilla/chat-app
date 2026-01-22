import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  blocked: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
}

export class ModerationService {
  private blockThreshold = 0.8; // Block messages with scores above this
  private flagThreshold = 0.5; // Flag messages with scores above this

  async moderateMessage(content: string): Promise<ModerationResult> {
    try {
      const moderation = await openai.moderations.create({
        input: content,
      });

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
    } catch (error) {
      console.error('Moderation API error:', error);
      // In case of API failure, allow the message but log the error
      return {
        flagged: false,
        blocked: false,
        categories: {},
        categoryScores: {},
      };
    }
  }

  async generateChatSummary(messages: Array<{ sender_name: string; content: string }>): Promise<string> {
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

      return response.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Unable to generate summary at this time.';
    }
  }
}
