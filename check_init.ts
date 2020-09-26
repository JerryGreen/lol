import init from "./check.ts";

const res = await init();

if (res.status !== "ok") Deno.exit(1);
