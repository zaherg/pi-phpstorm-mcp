"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = probe;

function probe(pi) {
  let startupMode;
  pi.on("session_start", (_event, ctx) => {
    startupMode = ctx.mode;
  });
  pi.registerCommand("phpstorm-verification", {
    description: "Inspect loaded PhpStorm tools without invoking them.",
    handler: async (_args, ctx) => {
      const deadline = Date.now() + 15000;
      let tools = [];
      do {
        tools = pi.getAllTools().map((tool) => tool.name).filter((name) => name.startsWith("mcp__phpstorm__"));
        if (tools.length > 0) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      } while (Date.now() < deadline);
      ctx.ui.notify(`PHPSTORM_PROBE:${JSON.stringify({ startupMode, mode: ctx.mode, toolCount: tools.length, toolSample: tools.slice(0, 3) })}`, "info");
    }
  });
} /* v9-4cbbc3e81f3f79f8 */
