import { RecommendationEngine } from "./recommendationEngine";
import { EngagementScorer } from "./engagementScorer";
import { ContentItem } from "./types";

const makeContent = (id: string): ContentItem => ({
  id,
  title: `Content ${id}`,
  authorId: "author-1",
  createdAt: new Date(),
});

const makeEvent = (
  type: Parameters<RecommendationEngine["recordEvent"]>[0]["type"],
  contentId: string,
  opts: { userId?: string; scrollDurationMs?: number } = {}
) => ({
  type,
  userId: opts.userId ?? "user-1",
  contentId,
  timestamp: new Date(),
  scrollDurationMs: opts.scrollDurationMs,
});

describe("EngagementScorer — weights", () => {
  let scorer: EngagementScorer;

  beforeEach(() => {
    scorer = new EngagementScorer();
  });

  it("adds 2 for a like", () => {
    scorer.recordEvent(makeEvent("like", "c1"));
    expect(scorer.getScore("c1")).toBe(2);
  });

  it("adds 3 for a comment", () => {
    scorer.recordEvent(makeEvent("comment", "c1"));
    expect(scorer.getScore("c1")).toBe(3);
  });

  it("adds 1 for a bookmark", () => {
    scorer.recordEvent(makeEvent("bookmark", "c1"));
    expect(scorer.getScore("c1")).toBe(1);
  });

  it("adds 4 for a repost", () => {
    scorer.recordEvent(makeEvent("repost", "c1"));
    expect(scorer.getScore("c1")).toBe(4);
  });

  it("subtracts 3 for not_interested", () => {
    scorer.recordEvent(makeEvent("not_interested", "c1"));
    expect(scorer.getScore("c1")).toBe(-3);
  });

  it("subtracts 5 for a report", () => {
    scorer.recordEvent(makeEvent("report", "c1"));
    expect(scorer.getScore("c1")).toBe(-5);
  });

  it("subtracts 1 for a fast scroll under 2 seconds", () => {
    scorer.recordEvent(makeEvent("fast_scroll", "c1", { scrollDurationMs: 800 }));
    expect(scorer.getScore("c1")).toBe(-1);
  });

  it("ignores fast_scroll at or above 2000ms", () => {
    scorer.recordEvent(makeEvent("fast_scroll", "c1", { scrollDurationMs: 2000 }));
    expect(scorer.getScore("c1")).toBe(0);
  });

  it("ignores fast_scroll with no duration provided", () => {
    scorer.recordEvent(makeEvent("fast_scroll", "c1"));
    expect(scorer.getScore("c1")).toBe(0);
  });

  it("accumulates multiple events correctly", () => {
    scorer.recordEvent(makeEvent("like", "c1"));      // +2
    scorer.recordEvent(makeEvent("comment", "c1"));   // +3
    scorer.recordEvent(makeEvent("repost", "c1"));    // +4
    scorer.recordEvent(makeEvent("report", "c1"));    // -5
    expect(scorer.getScore("c1")).toBe(4);
  });

  it("returns 0 for unknown content", () => {
    expect(scorer.getScore("unknown")).toBe(0);
  });
});

describe("RecommendationEngine", () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine();
    engine.addContent(makeContent("post-1"));
    engine.addContent(makeContent("post-2"));
    engine.addContent(makeContent("post-3"));
  });

  it("ranks content by score descending", () => {
    engine.recordEvent(makeEvent("repost",   "post-1")); // +4
    engine.recordEvent(makeEvent("comment",  "post-2")); // +3
    engine.recordEvent(makeEvent("like",     "post-3")); // +2

    const recs = engine.getRecommendations();
    expect(recs[0].contentItem.id).toBe("post-1");
    expect(recs[1].contentItem.id).toBe("post-2");
    expect(recs[2].contentItem.id).toBe("post-3");
  });

  it("assigns sequential rank values starting at 1", () => {
    const recs = engine.getRecommendations();
    recs.forEach((r, i) => expect(r.rank).toBe(i + 1));
  });

  it("excludes reported content for the reporting user", () => {
    engine.recordEvent(makeEvent("report", "post-1", { userId: "user-99" }));
    const recs = engine.getRecommendations("user-99");
    expect(recs.find((r) => r.contentItem.id === "post-1")).toBeUndefined();
  });

  it("shows reported content to other users", () => {
    engine.recordEvent(makeEvent("report", "post-1", { userId: "user-99" }));
    const recs = engine.getRecommendations("user-42");
    expect(recs.find((r) => r.contentItem.id === "post-1")).toBeDefined();
  });

  it("throws for events on unknown content", () => {
    expect(() =>
      engine.recordEvent(makeEvent("like", "no-such-post"))
    ).toThrow("Unknown content id: no-such-post");
  });

  it("exposes the raw score via getContentScore", () => {
    engine.recordEvent(makeEvent("like",    "post-1")); // +2
    engine.recordEvent(makeEvent("comment", "post-1")); // +3
    expect(engine.getContentScore("post-1")).toBe(5);
  });
});
