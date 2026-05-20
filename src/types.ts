export interface ContentItem {
  id: string;
  title: string;
  authorId: string;
  createdAt: Date;
  tags?: string[];
}

export interface EngagementScore {
  contentId: string;
  score: number;
  events: EngagementEvent[];
}

export type EngagementEventType =
  | "like"
  | "comment"
  | "bookmark"
  | "repost"
  | "not_interested"
  | "report"
  | "fast_scroll";

export interface EngagementEvent {
  type: EngagementEventType;
  userId: string;
  contentId: string;
  timestamp: Date;
  /** Duration in milliseconds — required for fast_scroll events */
  scrollDurationMs?: number;
}

export interface RecommendationResult {
  contentItem: ContentItem;
  score: number;
  rank: number;
}

/** Thresholds for fast scroll detection in milliseconds */
export const FAST_SCROLL_THRESHOLD_MS = 2000;
