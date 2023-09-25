import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts", "./internal/mod.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "windmill-queue",
    version: Deno.args[0],
    description: "Queue for windmill",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/ImSingee/windmill-queue.git",
    },
    bugs: {
      url: "https://github.com/ImSingee/windmill-queue/issues",
    },
  },
});
