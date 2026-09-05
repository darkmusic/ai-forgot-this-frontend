import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const done = (route: Route, result: unknown) => route.fulfill({ contentType: "text/event-stream", body: `: processing\n\nevent: done\ndata: ${JSON.stringify(result)}\n\n` });
const tableRows = (page: Page) => page.locator(".bulk-entry-table tbody tr");
const more = (page: Page) => page.getByText("More tools & options", { exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.route("**/api/csrf", route => route.fulfill({ json: { token: "test", headerName: "X-CSRF-TOKEN" } }));
  await page.goto("/test/browser/bulk-entry.html");
  await expect(tableRows(page)).toHaveCount(3);
});

test("compact panel, keyboard tooltips, draft context and staged generation", async ({ page }) => {
  const panel = page.getByRole("group", { name: "AI tools", exact: true });
  expect((await panel.boundingBox())!.height).toBeLessThan(170);
  await page.getByRole("button", { name: "Generate / Add Cards", exact: true }).focus();
  await expect(page.getByRole("tooltip").filter({ hasText: "Generate the requested number" })).toBeVisible();
  await tableRows(page).first().getByPlaceholder("Front text").fill("Edited capital question");
  await page.getByRole("button", { name: "+ Add New Card", exact: true }).click();
  await tableRows(page).first().getByPlaceholder("Front text").fill("New draft question");
  await page.getByLabel("Number of cards", { exact: true }).fill("2");
  let calls = 0;
  await page.route("**/api/ai/deck-assist", async route => {
    calls++;
    const body = route.request().postDataJSON();
    expect(body.cards).toHaveLength(4);
    expect(body.cards.map((c: { front: string }) => c.front)).toContain("Edited capital question");
    expect(body.cards.map((c: { front: string }) => c.front)).toContain("New draft question");
    expect(body.count).toBe(2);
    await done(route, { cards: [{ front: "Generated A", back: "Answer A" }, { front: "Generated B", back: "Answer B" }] });
  });
  await page.getByRole("button", { name: "Generate / Add Cards", exact: true }).click();
  await expect(tableRows(page)).toHaveCount(6);
  await expect(page.getByRole("status")).toContainText("Save All Changes");
  expect(calls).toBe(1);
  await page.getByRole("button", { name: "Compare Changes", exact: true }).click();
  await expect(page.getByLabel("AI change comparison")).toContainText("Generated A");
  await tableRows(page).first().getByPlaceholder("Front text").fill("Manually refined A");
  await page.getByRole("button", { name: "Undo Last AI Change", exact: true }).click();
  await expect(tableRows(page)).toHaveCount(5);
  await expect(tableRows(page).first().getByPlaceholder("Front text")).toHaveValue("Manually refined A");
  await expect(page.getByRole("status")).toContainText("1 conflicts preserved");
});

test("correction, enhancement, additive tags and selective merge persist through existing save", async ({ page }) => {
  await page.route("**/api/ai/deck-assist", async route => {
    const body = route.request().postDataJSON();
    if (body.operation === "correct" || body.operation === "enhance") {
      await done(route, { cards: body.cards.map((c: { rowId: string; front: string; back: string }) => ({ rowId: c.rowId, front: c.front, back: body.operation === "correct" && c.rowId === "card-3" ? "H2O" : c.back + (body.operation === "enhance" ? " — example" : "") })) });
    } else if (body.operation === "tags") await done(route, { tags: [{ rowId: "card-3", tags: ["Science"] }] });
    else await done(route, { groups: [{ rowIds: ["card-1", "card-2"], reason: "Same capital", front: "Capital of France?", back: "Paris — France's capital" }] });
  });
  await page.getByRole("button", { name: "Correct Deck", exact: true }).click();
  await expect(tableRows(page).last().getByPlaceholder("Back text")).toHaveValue("H2O");
  await page.getByRole("button", { name: "Enhance Deck", exact: true }).click();
  await expect(tableRows(page).last().getByPlaceholder("Back text")).toHaveValue("H2O — example");
  await more(page);
  await page.getByRole("button", { name: "Suggest Tags", exact: true }).click();
  await expect(tableRows(page).last().getByPlaceholder("tag1, tag2")).toHaveValue("Science");
  await page.getByRole("button", { name: "Find Duplicates", exact: true }).click();
  await expect(page.getByLabel("Duplicate suggestions")).toBeVisible();
  await expect(tableRows(page)).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Apply Selected Merges", exact: true })).toBeDisabled();
  await page.getByLabel("Select merge 1", { exact: true }).check();
  await page.getByRole("button", { name: "Apply Selected Merges", exact: true }).click();
  await expect(tableRows(page)).toHaveCount(2);
  let saved = false;
  await page.route("**/api/card/bulk-save", async route => {
    const body = route.request().postDataJSON();
    expect(body.deleteIds).toEqual([2]);
    expect(body.update.find((c: { id: number }) => c.id === 1).tags).toEqual(["Geography"]);
    expect(body.update.find((c: { id: number }) => c.id === 3).tags).toEqual(["Science"]);
    saved = true;
    await route.fulfill({ json: { created: 0, updated: 2, deleted: 1 } });
  });
  await page.route("**/api/deck/1", route => route.fulfill({ json: { id: 1, name: "General knowledge", templateFront: "", templateBack: "", cards: [
    { id: 1, front: "Capital of France?", back: "Paris — France's capital", tags: [{ id: 1, name: "Geography" }] },
    { id: 3, front: "Water formula?", back: "H2O — example", tags: [{ id: 2, name: "Science" }] },
  ] } }));
  await page.getByRole("button", { name: "Save All Changes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bulk Card Entry - General knowledge" })).not.toBeVisible();
  expect(saved).toBe(true);
  await page.getByRole("button", { name: "Open editor", exact: true }).click();
  await expect(tableRows(page)).toHaveCount(2);
  await expect(tableRows(page).last().getByPlaceholder("Back text")).toHaveValue("H2O — example");
  await expect(page.getByRole("button", { name: "Undo Last AI Change", exact: true })).toHaveCount(0);
});

test("gap analysis and generation use selected topics, total count, difficulty and instructions", async ({ page }) => {
  await more(page);
  await page.getByLabel("Generation difficulty", { exact: true }).selectOption("advanced");
  await page.getByLabel("Custom AI instructions", { exact: true }).fill("Use Spanish");
  await page.getByLabel("Number of cards", { exact: true }).fill("1");
  await page.route("**/api/ai/deck-assist", async route => {
    const body = route.request().postDataJSON();
    expect(body.instructions).toBe("Use Spanish");
    if (body.operation === "gaps") await done(route, { topics: [{ topic: "Chemistry", reason: "Limited coverage" }, { topic: "History", reason: "Missing" }] });
    else {
      expect(body.topics).toEqual(["Chemistry"]); expect(body.count).toBe(1); expect(body.difficulty).toBe("advanced");
      await done(route, { cards: [{ front: "Pregunta", back: "Respuesta" }] });
    }
  });
  await page.getByRole("button", { name: "Fill Topic Gaps", exact: true }).click();
  await expect(page.getByRole("button", { name: "Generate Cards for Selected Topics", exact: true })).toBeDisabled();
  await page.getByLabel("Select topic: Chemistry", { exact: true }).check();
  await page.getByRole("button", { name: "Generate Cards for Selected Topics", exact: true }).click();
  await expect(tableRows(page)).toHaveCount(4);
  await expect(tableRows(page).first().getByPlaceholder("Front text")).toHaveValue("Pregunta");
});

test("draft edits invalidate duplicate proposals", async ({ page }) => {
  await page.route("**/api/ai/deck-assist", route => done(route, { groups: [{ rowIds: ["card-1", "card-2"], reason: "Same", front: "A", back: "B" }] }));
  await more(page); await page.getByRole("button", { name: "Find Duplicates", exact: true }).click();
  await expect(page.getByLabel("Duplicate suggestions")).toBeVisible();
  await tableRows(page).first().getByPlaceholder("Front text").fill("Changed after analysis");
  await expect(page.getByLabel("Duplicate suggestions")).not.toBeVisible();
});

test("AI includes filtered cards and excludes pending deletions", async ({ page }) => {
  await page.locator(".bulk-entry-filter input").first().fill("Water");
  await expect(tableRows(page)).toHaveCount(1);
  const snapshots: { rowId: string }[][] = [];
  await page.route("**/api/ai/deck-assist", route => {
    const body = route.request().postDataJSON();
    snapshots.push(body.cards);
    return done(route, { cards: body.cards.map((c: { rowId: string; front: string; back: string }) => ({ rowId: c.rowId, front: c.front, back: c.back })) });
  });
  await page.getByRole("button", { name: "Correct Deck", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("no changes needed");
  expect(snapshots[0]).toHaveLength(3);
  await tableRows(page).first().getByTitle("Delete card", { exact: true }).click();
  await page.getByRole("button", { name: "Correct Deck", exact: true }).click();
  await expect.poll(() => snapshots.length).toBe(2);
  expect(snapshots[1].map(c => c.rowId)).toEqual(["card-1", "card-2"]);
});

test("busy locks editing and saving; closing rejects late responses and resets options", async ({ page }) => {
  let pending: Route | undefined;
  await page.route("**/api/ai/deck-assist", route => { pending = route; });
  await page.getByRole("button", { name: "Generate / Add Cards", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save All Changes", exact: true })).toBeDisabled();
  await expect(tableRows(page).first().getByPlaceholder("Front text")).toBeDisabled();
  await expect.poll(() => !!pending).toBe(true);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Open editor", exact: true }).click();
  await done(pending!, { cards: [{ front: "Late", back: "Ignore" }] }).catch(() => {});
  await expect(tableRows(page)).toHaveCount(3);
  await expect(page.getByRole("status")).toHaveText("Ready");
  await expect(page.getByLabel("Number of cards", { exact: true })).toHaveValue("10");
});

test("errors and timeouts remain visible without changing the draft", async ({ page }) => {
  await page.route("**/api/ai/deck-assist", route => route.fulfill({ contentType: "text/event-stream", body: 'event: error\ndata: {"message":"Context limit exceeded"}\n\n' }));
  await page.getByRole("button", { name: "Correct Deck", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Context limit exceeded");
  await expect(tableRows(page)).toHaveCount(3);
  await page.unroute("**/api/ai/deck-assist");
  await page.route("**/api/ai/deck-assist", () => {});
  await page.clock.install();
  await page.getByRole("button", { name: "Correct Deck", exact: true }).click();
  await page.clock.fastForward(12 * 60 * 1000 + 1000);
  await expect(page.getByRole("alert")).toContainText("timed out");
  await expect(page.getByRole("button", { name: "Save All Changes", exact: true })).toBeEnabled();
});

test("AI panel fits a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = page.getByRole("group", { name: "AI tools", exact: true });
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  await more(page);
  await expect(page.getByRole("button", { name: "Find Duplicates", exact: true })).toBeVisible();
  await page.screenshot({ path: "../../target/frontend-browser-tests/bulk-ai-mobile.png", fullPage: true });
});
