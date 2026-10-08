# PhpStorm MCP for Pi RPC sessions

Registers the supplied PhpStorm stdio MCP server only when Pi starts an RPC session, including sessions launched by the existing `pi-acp` registry agent.
Normal terminal, print, and JSON sessions do not register or connect to this server.

Requires Pi 1.0.2 or later with its built-in MCP support enabled.
The extension uses Pi's session mode rather than parsing command-line arguments.
No additional npm dependencies or build step are needed at runtime.

## Installation

From this directory, install the local package into Pi:

```sh
pi install "$PWD"
```

This updates Pi's user-level settings outside this directory.
Restart the existing Pi ACP session after installation.
No new JetBrains agent entry is needed.
Keep this directory in place because Pi loads local packages from their original paths.

Remove the package with:

```sh
pi remove "$PWD"
```

## Server configuration

`index.ts` registers the server as `phpstorm` with this configuration:

```json
{
  "type": "stdio",
  "env": {
    "IJ_MCP_SERVER_PORT": "64442"
  },
  "command": "/Users/zaher/Applications/PhpStorm.app/Contents/MacOS/phpstorm",
  "args": ["stdioMcpServer"]
}
```

Enable PhpStorm's MCP server and keep PhpStorm running while using this connection.
The executable path and port are specific to this installation.
Edit `index.ts` if either changes.

Registration is session-scoped and does not write an MCP configuration file.
Do not add the same server to a global MCP file if it should remain RPC-only.
An existing file-configured server named `phpstorm` takes precedence over this registration.

The mode check covers all RPC clients, not exclusively JetBrains.
A different RPC client will also register the server and can report a connection failure when PhpStorm is unavailable.

## Verification

Run the dependency-free tests with Node.js 22.19 or later:

```sh
npm test
```

Tests exercise the extension's registration boundary for RPC, TUI, print, and JSON sessions, and verify that discovery alone does not register a server.
They do not launch PhpStorm or verify a live IDE connection.
