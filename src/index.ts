import { RecommendationEngine } from "./recommendationEngine";
import { ContentItem, EngagementEvent } from "./types";

const engine = new RecommendationEngine();

const content: ContentItem[] = [
  { id: "post-1", title: "Introduction to TypeScript", authorId: "user-a", createdAt: new Date() },
  { id: "post-2", title: "Advanced React Patterns", authorId: "user-b", createdAt: new Date() },
  { id: "post-3", title: "Node.js Best Practices", authorId: "user-c", createdAt: new Date() },
];

content.forEach((item) => engine.addContent(item));

const events: EngagementEvent[] = [
  { type: "like",          userId: "user-1", contentId: "post-1", timestamp: new Date() },
  { type: "comment",       userId: "user-2", contentId: "post-1", timestamp: new Date() },
  { type: "repost",        userId: "user-3", contentId: "post-2", timestamp: new Date() },
  { type: "bookmark",      userId: "user-1", contentId: "post-2", timestamp: new Date() },
  { type: "fast_scroll",   userId: "user-2", contentId: "post-3", timestamp: new Date(), scrollDurationMs: 800 },
  { type: "not_interested",userId: "user-3", contentId: "post-3", timestamp: new Date() },
  { type: "report",        userId: "user-4", contentId: "post-3", timestamp: new Date() },
];

events.forEach((e) => engine.recordEvent(e));

console.log("=== Recommendation Rankings ===\n");

const recommendations = engine.getRecommendations();
recommendations.forEach(({ rank, contentItem, score }) => {
  console.log(`#${rank}  [score: ${score > 0 ? "+" : ""}${score}]  ${contentItem.title}`);
});

console.log("\n=== Per-content scores ===\n");
content.forEach((item) => {
  console.log(`${item.title}: ${engine.getContentScore(item.id)}`);
});
