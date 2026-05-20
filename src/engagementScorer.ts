import {
  EngagementEvent,
  EngagementEventType,
  EngagementScore,
  FAST_SCROLL_THRESHOLD_MS,
} from "./types";

const ENGAGEMENT_WEIGHTS: Record<EngagementEventType, number> = {
  like: 2,
  comment: 3,
  bookmark: 1,
  repost: 4,
  not_interested: -3,
  report: -5,
  fast_scroll: -1,
};

export class EngagementScorer {
  private scores: Map<string, EngagementScore> = new Map();

  recordEvent(event: EngagementEvent): void {
    if (event.type === "fast_scroll") {
      const duration = event.scrollDurationMs ?? Infinity;
      if (duration >= FAST_SCROLL_THRESHOLD_MS) {
        // Not a fast scroll — ignore
        return;
      }
    }

    const delta = ENGAGEMENT_WEIGHTS[event.type];
    const existing = this.scores.get(event.contentId);

    if (existing) {
      existing.score += delta;
      existing.events.push(event);
    } else {
      this.scores.set(event.contentId, {
        contentId: event.contentId,
        score: delta,
        events: [event],
      });
    }
  }

  getScore(contentId: string): number {
    return this.scores.get(contentId)?.score ?? 0;
  }

  getEngagementScore(contentId: string): EngagementScore | undefined {
    return this.scores.get(contentId);
  }

  getAllScores(): EngagementScore[] {
    return Array.from(this.scores.values());
  }

  resetScore(contentId: string): void {
    this.scores.delete(contentId);
  }
}
