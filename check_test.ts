import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.70.0/testing/asserts.ts";
import {
  checkMissingRequiredKeys,
  checkUnsupportedKeys,
  checkReplayFileExists,
  addErrors,
  emptyErrors,
  perfectTestGameInfo,
} from "./check.ts";
import type { ProcessedGameInfo } from "./check.ts";

Deno.test("checkUnsupportedKeys", async () => {
  assertEquals(
    (await checkUnsupportedKeys({} as ProcessedGameInfo)).errors
      .unsupportedKeys,
    [],
    "doesn't fail on lacking keys",
  );
  assertEquals(
    (await checkUnsupportedKeys(
      { kek: 1, wow: "awesome" } as any as ProcessedGameInfo,
    )).errors
      .unsupportedKeys,
    ["kek", "wow"],
    "fails on having unsupported keys",
  );
});

Deno.test("checkMissingRequiredKeys", async () => {
  assertEquals(
    ((await checkMissingRequiredKeys({} as ProcessedGameInfo)).errors
      .missingRequiredKeys),
    [
      "id",
      "date",
      "patch",
      "me",
      "vs",
      "lane",
      "replay_file",
      "details",
      "full_video",
      "promo_video",
    ],
    "fails on lacking all keys",
  );
  ((await checkMissingRequiredKeys({ id: "1" } as ProcessedGameInfo)).errors
    .missingRequiredKeys), [
    "date",
    "patch",
    "me",
    "vs",
    "lane",
    "replay_file",
    "details",
    "full_video",
    "promo_video",
  ], "fails on lacking some keys";
  assertEquals(
    (await checkMissingRequiredKeys(perfectTestGameInfo)).errors
      .missingRequiredKeys,
    [],
    "fails doesn't fail on having all needed keys",
  );
});

Deno.test("checkReplayIsPresent", async () => {
  assertEquals(
    (await checkReplayFileExists({} as ProcessedGameInfo)).errors
      .replayFileExists,
    false,
    "fails when there's no replay",
  );
  assertEquals(
    (await checkReplayFileExists(perfectTestGameInfo)).id,
    perfectTestGameInfo.id,
    "doesn't strip keys/values when there's no replay",
  );
  try {
    await Deno.mkdir("replays_test");
    await Deno.writeTextFile("replays_test/TEST-1.rofl", "");
    assertEquals(
      (await checkReplayFileExists(perfectTestGameInfo)).id,
      perfectTestGameInfo.id,
      "doesn't strip keys/values when replay is present",
    );
    assert(
      (await checkReplayFileExists(perfectTestGameInfo)).errors
        .replayFileExists,
      "returns true on having a replay",
    );
  } finally {
    await Deno.remove("replays_test", { recursive: true });
  }
});

Deno.test("addErrors", async () => {
  assertEquals(
    (await addErrors(perfectTestGameInfo)).id,
    perfectTestGameInfo.id,
    "doesn't strip keys/values with empty errors",
  );
  assertEquals(
    (await addErrors(perfectTestGameInfo, { replayFileExists: true })).id,
    perfectTestGameInfo.id,
    "doesn't strip keys/values with some errors",
  );
  assertEquals(
    ((await addErrors(
      { errors: { replayFileExists: true } } as ProcessedGameInfo,
      { unsupportedKeys: ["test"] },
    ))).errors,
    {
      replayFileExists: true,
      unsupportedKeys: ["test"],
    },
    "mixes errors together",
  );
});
