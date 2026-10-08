import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function phpstormMcp(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		if (ctx.mode !== "rpc") return;

		pi.registerMcpServer("phpstorm", {
			type: "stdio",
			env: { IJ_MCP_SERVER_PORT: "64442" },
			command: "/Users/zaher/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
			args: ["stdioMcpServer"],
		});
	});
}
