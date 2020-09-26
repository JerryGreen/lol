import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.70.0/testing/asserts.ts";
import init, { perfectTestGameInfo } from "./check.ts";

Deno.test("init successfully completes", async () => {
  try {
    await Deno.mkdir("games_info_test");
    await Deno.mkdir("replays_test");
    await Deno.writeTextFile(
      "games_info_test/TEST-1.rofl",
      JSON.stringify(perfectTestGameInfo),
    );
    await Deno.writeTextFile("replays_test/TEST-1.rofl", "");
    const res = await init("games_info_test");

    assertEquals(res.status, "ok", JSON.stringify(res.errors));
  } finally {
    await Deno.remove("games_info_test", { recursive: true });
    await Deno.remove("replays_test", { recursive: true });
  }
});

Deno.test("init fails when errors are present", async () => {
  try {
    await Deno.mkdir("games_info_test");
    await Deno.mkdir("replays_test");
    await Deno.writeTextFile(
      "games_info_test/TEST-1.rofl",
      JSON.stringify({}),
    );
    const res = await init("games_info_test");
    assertEquals(
      res.status,
      "ok",
      JSON.stringify(res.errors),
    );
  } finally {
    await Deno.remove("games_info_test", { recursive: true });
    await Deno.remove("replays_test", { recursive: true });
  }
});
