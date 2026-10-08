import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { discoverAndLoadExtensions } = await import(
	pathToFileURL(resolve(process.argv[2], "dist/index.js")).href
);
const extensionPath = resolve("index.ts");

for (const mode of ["rpc", "tui", "print", "json"]) {
	const loaded = await discoverAndLoadExtensions(
		[extensionPath],
		process.cwd(),
		resolve(".verification/agent"),
	);
	assert.deepEqual(loaded.errors, []);
	assert.equal(loaded.extensions.length, 1);
	assert.deepEqual(loaded.runtime.mcpServers.list(), []);

	const handlers = loaded.extensions[0].handlers.get("session_start") ?? [];
	assert.equal(handlers.length, 1);
	for (const handler of handlers) {
		await handler({ type: "session_start" }, { mode });
	}

	const registrations = loaded.runtime.mcpServers.list();
	assert.equal(registrations.length, mode === "rpc" ? 1 : 0);
	if (mode === "rpc") {
		assert.equal(registrations[0].name, "phpstorm");
		assert.equal(registrations[0].config.type, "stdio");
		assert.equal(
			registrations[0].config.command,
			"/Users/zaher/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
		);
		assert.deepEqual(registrations[0].config.args, ["stdioMcpServer"]);
		assert.deepEqual(registrations[0].config.env, {
			IJ_MCP_SERVER_PORT: "64442",
		});
		for (const handler of handlers) {
			await handler({ type: "session_start" }, { mode });
		}
		assert.equal(loaded.runtime.mcpServers.list().length, 1);
	}
	loaded.runtime.invalidate("Smoke check complete");
	console.log(`${mode}: real Pi loader and MCP registry check passed`);
}
