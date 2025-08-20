## What is it?

Allow altering an `package.json` in order to switch from `node.js` to `bun.js`.  

When doing TypeScript with node.js, you have then entry named `main` which is pointing to the `dist/index.js` file.
When we do this with bun.js, then its debugger tries to link the JavaScript to its TypeScript source, which works poorly.

This tool's main purpose is, therefore, to improve the debugging experience.

## How to use?

First, you need to add a `nodeSwitch` entry in your project's `package.json`. This indicates which directories to use.

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  
  "nodeSwitch": true
}
```

Once configured, you can run `npx jopi-node-switch node`. It will scan all subdirectories to replace all *main* and *types* entries.

## Three mode : node / bun / restore

There are three modes, allowing using bun.js, node.js, or restoring the original.

```
npx jopiswitch node
npx jopiswitch bun
npx jopiswitch restore
```

## package.json options

### nodeSwitch

This option allows enabling the tools. If not found, or if his value is false, then it will not be enabled for this module.

```jsonc
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  
  // Enable the tool.
  "nodeSwitch": true,
  
  // Explicitly disable the tool.
  "nodeSwitch": false,
  
  // Set specific values
  "nodeSwitch": { "node": "dist", "bun": "src" }
}
```

## nodeSwitch-default

This option allows defining which mode, between node and bun, must be used when restoring.
If not set then use node.

```jsonc
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  
  "nodeSwitch-default": "node"
}
```