import assert from "node:assert/strict";
import test from "node:test";
import phpstormMcp from "../index.ts";

function loadExtension() {
	const handlers = new Map();
	const registrations = [];

	phpstormMcp({
		on(event, handler) {
			const callbacks = handlers.get(event) ?? [];
			callbacks.push(handler);
			handlers.set(event, callbacks);
		},
		registerMcpServer(name, config) {
			registrations.push({ name, config });
		},
	});

	return {
		registrations,
		async startSession(mode) {
			for (const handler of handlers.get("session_start") ?? []) {
				await handler({ type: "session_start" }, { mode });
			}
		},
	};
}

test("registers the supplied PhpStorm stdio server in an RPC session", async () => {
	const extension = loadExtension();
	await extension.startSession("rpc");

	assert.deepEqual(extension.registrations, [
		{
			name: "phpstorm",
			config: {
				type: "stdio",
				env: { IJ_MCP_SERVER_PORT: "64442" },
				command:
					"/Users/zaher/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
				args: ["stdioMcpServer"],
			},
		},
	]);
});

for (const mode of ["tui", "print", "json"]) {
	test(`does not register or connect to PhpStorm in ${mode} mode`, async () => {
		const extension = loadExtension();
		await extension.startSession(mode);

		assert.deepEqual(extension.registrations, []);
	});
}

test("does not register a server during extension discovery", () => {
	assert.deepEqual(loadExtension().registrations, []);
});
