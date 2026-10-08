"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = phpstormMcp;

function phpstormMcp(pi) {
  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "rpc") return;

    pi.registerMcpServer("phpstorm", {
      type: "stdio",
      env: { IJ_MCP_SERVER_PORT: "64442" },
      command: "/Users/zaher/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
      args: ["stdioMcpServer"]
    });
  });
} /* v9-a8150bfe2cbd120c */
