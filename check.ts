import { walk, readJson, exists } from "https://deno.land/std@0.68.0/fs/mod.ts";
// import difference from "https://deno.land/x/ramda@v0.27.1/difference.js";
// import * as R from "https://deno.land/x/ramda@v0.27.1/index.js";
import * as R from "https://x.nest.land/ramda@0.27.0/source/index.js";

export const perfectTestGameInfo = {
  "id": "292500952",
  "date": "20200925",
  "patch": "10.19",
  "me": "Tryndamere",
  "vs": "Maokai",
  "lane": "top",
  "rank": "Gold IV",
  "replay_file": "replays_test/TEST-1.rofl",
  "details":
    "https://matchhistory.ru.leagueoflegends.com/ru/#match-details/RU/292500952/202436939?tab=overview",
  "full_video": "https://youtu.be/L8iQBhVkG44",
  "promo_video": "https://youtu.be/0JOYZ2z3cR4",
};

export const emptyErrors = {
  missingRequiredKeys: [] as string[],
  unsupportedKeys: [] as string[],
  replayFileExists: false,
};

export const noErrors = {
  missingRequiredKeys: [],
  unsupportedKeys: [],
  replayFileExists: true,
};

export type GameInfo = Partial<typeof perfectTestGameInfo>;

export type Errors = Partial<typeof emptyErrors>;

export interface ProcessedGameInfo extends GameInfo {
  errors: Errors;
}

const possibleKeys = Object.keys(perfectTestGameInfo);

const requiredKeys = [
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
];

const techInfoKeys = ["errors"];

export async function addErrors(
  gameInfo: GameInfo | ProcessedGameInfo,
  errors: Errors = {},
): Promise<ProcessedGameInfo> {
  return {
    ...gameInfo,
    errors: { ...(gameInfo as any).errors, ...errors },
  };
}

export async function checkUnsupportedKeys(
  gameInfo: GameInfo | ProcessedGameInfo,
): Promise<ProcessedGameInfo> {
  const gameInfoKeys = Object.keys(gameInfo);

  const unsupportedKeys: string[] = R.difference(
    gameInfoKeys,
    possibleKeys.concat(techInfoKeys),
  );

  // if (unsupportedKeys.length > 0) {
  //   return addErrors(gameInfo, { unsupportedKeys });
  // }

  // return addErrors(gameInfo);
  return addErrors(gameInfo, { unsupportedKeys });
}

export async function checkMissingRequiredKeys(
  gameInfo: GameInfo | ProcessedGameInfo,
): Promise<ProcessedGameInfo> {
  const gameInfoKeys = Object.keys(gameInfo);

  const missingRequiredKeys: string[] = R.difference(
    requiredKeys,
    gameInfoKeys,
  );

  // if (missingRequiredKeys.length > 0) {
  //   return addErrors(gameInfo, { missingRequiredKeys });
  // }

  // return addErrors(gameInfo);
  return addErrors(gameInfo, { missingRequiredKeys });
}

export async function checkReplayFileExists(
  gameInfo: GameInfo | ProcessedGameInfo,
): Promise<ProcessedGameInfo> {
  const replayPath = gameInfo.replay_file;
  const replayFileExists = typeof replayPath === "string" &&
    await exists(replayPath);
  // if (replayPath) {
  //   const replayFileExists = await exists(replayPath);
  //   return addErrors(gameInfo, { replayFileExists });
  // }
  // return addErrors(gameInfo);
  return addErrors(gameInfo, { replayFileExists });
}

export default async function init(path = "games_info") {
  let errors = {};
  for await (const entry of walk(path, { exts: ["json"] })) {
    const gameInfoInitial = (await readJson(entry.path)) as GameInfo;

    // const gameInfoProcessed: ProcessedGameInfo = await checkMissingRequiredKeys(
    //   gameInfoInitial,
    // ).then((i) =>
    //   checkUnsupportedKeys(i).then((i) => checkReplayFileExists(i))
    // );

    // const gameInfoProcessed: ProcessedGameInfo = await (R.pipe as any)(
    //   checkMissingRequiredKeys,
    //   checkUnsupportedKeys,
    //   checkReplayFileExists,
    // )(gameInfoInitial);

    // const gameInfoProcessed: ProcessedGameInfo = R.mergeAll(
    //   (await Promise.all(
    //     [
    //       checkMissingRequiredKeys(gameInfoInitial),
    //       checkUnsupportedKeys(gameInfoInitial),
    //       checkReplayFileExists(gameInfoInitial),
    //     ],
    //   )),
    // );

    // const rules = (k, l, r) => k == "values" ? R.concat(l, r) : r;
    const rules = (k: string, l: any, r: any) => {
      switch (k) {
        case "replayFileExists":
          return l || r;
        default:
          return R.mergeLeft(l, r);
      }
    };

    const gameInfoProcessed: ProcessedGameInfo = R.reduce(
      (R.mergeDeepWithKey as any)(rules),
      gameInfoInitial,
      (await Promise.all(
        [
          checkMissingRequiredKeys(gameInfoInitial),
          checkUnsupportedKeys(gameInfoInitial),
          checkReplayFileExists(gameInfoInitial),
        ],
      )),
    );

    if (!R.whereEq(noErrors, gameInfoProcessed.errors)) {
      console.group("❌", entry.path, "... errors:");

      const {
        missingRequiredKeys = [],
        unsupportedKeys = [],
        replayFileExists = false,
      } = gameInfoProcessed.errors;
      if (missingRequiredKeys.length > 0) {
        console.info({ missingRequiredKeys });
      }
      if (unsupportedKeys.length > 0) {
        console.info({ unsupportedKeys });
      }
      if (!replayFileExists) {
        console.info({ replayFileExists });
      }
      errors = { ...errors, ...{ [entry.path]: gameInfoProcessed.errors } };
    } else {
      console.group("✔️ ", entry.path, "... ok");
    }
    console.groupEnd();
  }
  if (Object.keys(errors).length > 0) {
    return { status: "fail", errors };
  }
  return { status: "ok" };
}
