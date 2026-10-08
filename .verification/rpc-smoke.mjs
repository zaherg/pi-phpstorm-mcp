import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const hostPath = resolve(process.argv[2]);
const { RpcClient } = await import(
	pathToFileURL(resolve(hostPath, "dist/index.js")).href
);
const client = new RpcClient({
	cliPath: resolve(hostPath, "dist/cli.js"),
	cwd: resolve(".verification/rpc-cwd"),
	env: {
		PI_CODING_AGENT_DIR: resolve(".verification/rpc-agent"),
		PI_OFFLINE: "1",
		TMPDIR: resolve(".verification/tmp"),
		XDG_CACHE_HOME: resolve(".verification/cache"),
		PATH: `${process.argv[3]}:${process.env.PATH}`,
	},
	args: [
		"--no-session",
		"--no-themes",
		"--no-skills",
		"--no-prompt-templates",
		"--no-context-files",
	],
});
let probe;
client.onEvent((event) => {
	if (event.type === "extension_error") console.error(JSON.stringify(event));
	if (event.type === "extension_ui_request" && event.method === "notify") {
		console.log(event.message);
		if (event.message.startsWith("PHPSTORM_PROBE:")) {
			probe = JSON.parse(event.message.slice("PHPSTORM_PROBE:".length));
		}
	}
});
try {
	await client.start();
	const commands = await client.getCommands();
	assert.ok(commands.some((command) => command.name === "phpstorm-verification"));
	const disposition = await client.prompt("/phpstorm-verification");
	assert.equal(disposition, "handled");
	assert.equal(probe?.startupMode, "rpc");
	assert.equal(probe?.mode, "rpc");
	assert.ok(probe?.toolCount > 0, "Fresh RPC process must expose PhpStorm tools");
	console.log("Fresh RPC startup passed; no model request or MCP tool call performed.");
} finally {
	await client.stop();
	const stderr = client.getStderr();
	if (stderr) console.error(stderr.slice(-4000));
}
