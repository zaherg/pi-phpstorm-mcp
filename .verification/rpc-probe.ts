import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function probe(pi: ExtensionAPI) {
	let startupMode: string | undefined;
	pi.on("session_start", (_event, ctx) => {
		startupMode = ctx.mode;
	});
	pi.registerCommand("phpstorm-verification", {
		description: "Inspect loaded PhpStorm tools without invoking them.",
		handler: async (_args, ctx) => {
			const deadline = Date.now() + 15000;
			let tools: string[] = [];
			do {
				tools = pi.getAllTools().map((tool) => tool.name).filter((name) => name.startsWith("mcp__phpstorm__"));
				if (tools.length > 0) break;
				await new Promise((resolve) => setTimeout(resolve, 100));
			} while (Date.now() < deadline);
			ctx.ui.notify(`PHPSTORM_PROBE:${JSON.stringify({ startupMode, mode: ctx.mode, toolCount: tools.length, toolSample: tools.slice(0, 3) })}`, "info");
		},
	});
}
