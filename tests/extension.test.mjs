import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test, { beforeEach } from "node:test";
import { fileURLToPath } from "node:url";
import phpstormMcp from "../index.ts";

let configPath;

beforeEach((t) => {
	const home = mkdtempSync(fileURLToPath(new URL(".home-", import.meta.url)));
	const previousHome = process.env.HOME;
	process.env.HOME = home;
	configPath = join(home, ".pi", "agent", "pi-jetbrains-mcp.json");
	mkdirSync(join(home, ".pi", "agent"), { recursive: true });
	t.after(() => {
		if (previousHome === undefined) delete process.env.HOME;
		else process.env.HOME = previousHome;
		rmSync(home, { recursive: true, force: true });
	});
});

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

test("registers the JSON-configured PhpStorm server in an RPC session", async () => {
	writeFileSync(configPath, JSON.stringify({
		type: "stdio",
		env: { IJ_MCP_SERVER_PORT: "54321" },
		command: "/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
		args: ["stdioMcpServer"],
		timeout: 90,
	}));
	const extension = loadExtension();
	await extension.startSession("rpc");

	assert.deepEqual(extension.registrations, [
		{
			name: "phpstorm",
			config: {
				type: "stdio",
				env: { IJ_MCP_SERVER_PORT: "54321" },
				command: "/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
				args: ["stdioMcpServer"],
				timeout: 90,
			},
		},
	]);
});

test("reads changed configuration on the next session start", async () => {
	writeFileSync(configPath, JSON.stringify({ command: "first-phpstorm" }));
	const extension = loadExtension();
	await extension.startSession("rpc");
	writeFileSync(configPath, JSON.stringify({ command: "second-phpstorm" }));
	await extension.startSession("rpc");

	assert.deepEqual(extension.registrations.map(({ config }) => config), [
		{ command: "first-phpstorm" },
		{ command: "second-phpstorm" },
	]);
});

test("uses the original defaults when the configuration file is missing", async () => {
	const extension = loadExtension();
	await extension.startSession("rpc");

	assert.deepEqual(extension.registrations, [{
		name: "phpstorm",
		config: {
			type: "stdio",
			env: { IJ_MCP_SERVER_PORT: "64442" },
			command: "/Users/zaher/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
			args: ["stdioMcpServer"],
		},
	}]);
});

for (const scenario of ["malformed", "unreadable"]) {
	test(`reports the config path for ${scenario} configuration without registering`, async () => {
		if (scenario === "malformed") writeFileSync(configPath, "{ invalid json");
		if (scenario === "unreadable") mkdirSync(configPath);
		const extension = loadExtension();

		await assert.rejects(extension.startSession("rpc"), (error) => {
			assert.ok(error.message.includes(configPath));
			return true;
		});
		assert.deepEqual(extension.registrations, []);
	});
}

for (const mode of ["tui", "print", "json"]) {
	test(`does not read config or register PhpStorm in ${mode} mode`, async () => {
		writeFileSync(configPath, "{ invalid json");
		const extension = loadExtension();
		await extension.startSession(mode);

		assert.deepEqual(extension.registrations, []);
	});
}

test("does not read config or register a server during extension discovery", () => {
	writeFileSync(configPath, "{ invalid json");
	assert.deepEqual(loadExtension().registrations, []);
});
