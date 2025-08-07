## What is it?

Allow altering an `package.json` in order to switch from node.js to bun.js.  

When doing Typescript with node.js, you have then entry named `main` which is pointing to the `dist/index.js` file.
Quand nous faisons ça avec bun.js, alors son debugger tenter de relier le javascript à sa source typescript, ce qui fonctionne mal.

Cet outil a donc essentiellement pour rôle d'améliorer l'expérience de debug.

## How to use?

First, you need to add a `nodeSwitch` entry in your project's `package.json`. This indicates which directories to use.

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  
  "nodeSwitch": {
    "node": "dist",
    "bun": "src"
  }
}
```

Once configured, you can run `npx jopi-node-switch node`. It will scan all subdirectories to replace all *main* and *types* entries.