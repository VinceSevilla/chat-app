import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

export class HuggingFaceService {
  private hf: HfInference | null = null;

  constructor() {
    if (HF_API_KEY) {
      this.hf = new HfInference(HF_API_KEY);
    }
  }

  async generateChatSummary(messages: Array<{ sender_name: string; content: string }>): Promise<string | null> {
    if (!this.hf) {
      console.warn('Hugging Face API key not configured');
      return null;
    }

    try {
      const messageText = messages
        .map(msg => `${msg.sender_name}: ${msg.content}`)
        .join('\n');

      // Truncate to reasonable length for API
      const truncatedText = messageText.substring(0, 1024);

      console.log('Attempting to generate summary for:', truncatedText.substring(0, 100) + '...');

      // Try text generation with a prompt instead of summarization
      const result = await this.hf.textGeneration({
        model: 'facebook/bart-large-cnn',
        inputs: `Summarize this chat conversation in 2-3 sentences:\n\n${truncatedText}\n\nSummary:`,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7,
          return_full_text: false,
        }
      });

      console.log('Summary result:', result);

      if (result && result.generated_text) {
        const summary = result.generated_text.trim();
        // If the summary is too similar to the input, it likely failed
        if (summary.length > 50 && !summary.startsWith(truncatedText.substring(0, 50))) {
          return summary;
        }
      }
      
      console.warn('Summary generation failed or returned input text');
      // Return a simple fallback summary
      return this.generateSimpleSummary(messages);
    } catch (error: any) {
      console.error('Summary generation error:', error?.message || error);
      console.error('Full error:', error);
      // Return a simple fallback summary
      return this.generateSimpleSummary(messages);
    }
  }

  private generateSimpleSummary(messages: Array<{ sender_name: string; content: string }>): string {
    const participants = [...new Set(messages.map(m => m.sender_name))];
    const messageCount = messages.length;
    const topics = this.extractKeyTopics(messages);
    
    return `Chat between ${participants.join(' and ')} with ${messageCount} messages. ${topics ? `Topics discussed: ${topics}.` : ''}`;
  }

  private extractKeyTopics(messages: Array<{ sender_name: string; content: string }>): string {
    // Simple keyword extraction - find most common meaningful words
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const words = allText.split(/\s+/).filter(w => w.length > 4); // Filter short words
    const wordCounts = new Map<string, number>();
    
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    const topWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
    
    return topWords.length > 0 ? topWords.join(', ') : '';
  }

  async classifyContent(content: string): Promise<{ label: string; score: number } | null> {
    if (!this.hf) {
      return null;
    }

    try {
      const result = await this.hf.zeroShotClassification({
        model: 'facebook/bart-large-mnli',
        inputs: content,
        parameters: {
          candidate_labels: ['spam', 'inappropriate', 'safe'],
        }
      });

      return {
        label: (result as any).classification?.[0]?.labels || 'unknown',
        score: (result as any).classification?.[0]?.scores || 0,
      };
    } catch (error: any) {
      console.error('Classification error:', error?.message || error);
      return null;
    }
  }
}

export const huggingFaceService = new HuggingFaceService();
