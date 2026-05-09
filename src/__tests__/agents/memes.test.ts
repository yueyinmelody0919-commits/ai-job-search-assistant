import { describe, it, expect, vi } from "vitest";
import { getCuratedMeme, shouldSendMeme } from "@/lib/agents/memes";

describe("Meme Engine", () => {
  it("returns a curated meme for valid character + situation", () => {
    const meme = getCuratedMeme("dwight", "success");
    expect(meme).toBeTruthy();
    expect(meme).toContain("giphy.com");
  });

  it("returns null for unknown character", () => {
    expect(getCuratedMeme("michael", "success")).toBeNull();
  });

  it("returns null for unknown situation", () => {
    expect(getCuratedMeme("dwight", "nonexistent")).toBeNull();
  });

  it("shouldSendMeme has higher rate for celebrations", () => {
    // Run many trials and check distribution
    let successCount = 0;
    let casualCount = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      if (shouldSendMeme("success")) successCount++;
      if (shouldSendMeme("casual")) casualCount++;
    }

    // Success rate (~50%) should be higher than casual (~10%)
    expect(successCount / trials).toBeGreaterThan(casualCount / trials);
  });

  it("covers all main characters", () => {
    const characters = ["dwight", "oscar", "jim", "angela", "darryl", "holly", "stanley"];
    for (const char of characters) {
      // Each character should have at least one situation with memes
      let hasMeme = false;
      const situations = ["success", "report", "sass", "correcting", "analysis", "prank",
        "casual", "disapproval", "organized", "wisdom", "cool", "excited",
        "supportive", "done", "annoyed"];

      for (const sit of situations) {
        if (getCuratedMeme(char, sit)) {
          hasMeme = true;
          break;
        }
      }
      expect(hasMeme).toBe(true);
    }
  });
});
