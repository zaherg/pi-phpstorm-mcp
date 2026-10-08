import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const hostPath = resolve(process.argv[2]);
const { discoverAndLoadExtensions } = await import(
	pathToFileURL(resolve(hostPath, "dist/index.js")).href
);
const { McpClient, StdioTransport } = await import(
	pathToFileURL(
		resolve(hostPath, "node_modules/@earendil-works/pi-mcp/dist/index.js"),
	).href
);
const loaded = await discoverAndLoadExtensions(
	[resolve("index.ts")],
	process.cwd(),
	resolve(".verification/agent"),
);
assert.deepEqual(loaded.errors, []);
for (const handler of loaded.extensions[0].handlers.get("session_start") ?? []) {
	await handler({ type: "session_start" }, { mode: "rpc" });
}
const { config } = loaded.runtime.mcpServers.get("phpstorm");
const transport = new StdioTransport({
	command: config.command,
	args: config.args,
	env: config.env,
	stderr: "pipe",
	closeTimeoutMs: 2000,
});
const client = new McpClient({
	name: "pi-phpstorm-mcp-verification",
	version: "0.1.0",
	requestTimeoutMs: 10000,
});
try {
	await client.connect(transport);
	const tools = await client.listTools();
	assert.ok(tools.length > 0, "PhpStorm must expose at least one MCP tool");
	console.log(
		JSON.stringify({
			server: client.serverInfo,
			toolCount: tools.length,
			toolSample: tools.slice(0, 5).map((tool) => tool.name),
			toolCallsPerformed: 0,
		}),
	);
} finally {
	await client.close();
	loaded.runtime.invalidate("Live check complete");
	console.log(`Connection after cleanup: ${client.connectionState}`);
}
