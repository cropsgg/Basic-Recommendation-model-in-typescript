import { EngagementScorer } from "./engagementScorer";
import {
  ContentItem,
  EngagementEvent,
  RecommendationResult,
} from "./types";

export class RecommendationEngine {
  private scorer: EngagementScorer;
  private contentRegistry: Map<string, ContentItem> = new Map();

  constructor(scorer?: EngagementScorer) {
    this.scorer = scorer ?? new EngagementScorer();
  }

  addContent(item: ContentItem): void {
    this.contentRegistry.set(item.id, item);
  }

  removeContent(contentId: string): void {
    this.contentRegistry.delete(contentId);
    this.scorer.resetScore(contentId);
  }

  recordEvent(event: EngagementEvent): void {
    if (!this.contentRegistry.has(event.contentId)) {
      throw new Error(`Unknown content id: ${event.contentId}`);
    }
    this.scorer.recordEvent(event);
  }

  /**
   * Returns content ranked by engagement score, highest first.
   * Items with no engagement events are included at score 0.
   */
  getRecommendations(userId?: string): RecommendationResult[] {
    const allContent = Array.from(this.contentRegistry.values());

    const ranked = allContent
      .map((item) => ({
        contentItem: item,
        score: this.scorer.getScore(item.id),
      }))
      .filter((entry) => {
        // Exclude content reported by this user
        if (!userId) return true;
        const engagementScore = this.scorer.getEngagementScore(entry.contentItem.id);
        if (!engagementScore) return true;
        return !engagementScore.events.some(
          (e) => e.type === "report" && e.userId === userId
        );
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return ranked;
  }

  getContentScore(contentId: string): number {
    return this.scorer.getScore(contentId);
  }
}
