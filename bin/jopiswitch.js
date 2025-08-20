#!/usr/bin/env node
import {readdir, readFile, stat} from 'fs/promises';
import {modify, applyEdits} from 'jsonc-parser';
import path from 'path';
import {writeFile} from "node:fs/promises";

const cwd = process.cwd();
//const cwd = path.resolve(process.cwd(), "..", "..");

async function findPackagesWithNodeSwitch(dirPath) {
    let foundPackages = [];
    const files = await readdir(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = await stat(filePath);

        if (fileStat.isDirectory()) {
            if (file !== 'node_modules') {
                foundPackages = foundPackages.concat(await findPackagesWithNodeSwitch(filePath));
            }
        } else if (file === 'package.json') {
            try {
                const content = await readFile(filePath, 'utf-8');
                const packageJson = JSON.parse(content);
                if (packageJson.nodeSwitch) foundPackages.push(filePath);
            } catch {
                console.error(`This 'package.json' file is invalid: ${filePath}`);
            }
        }
    }

    return foundPackages;
}

async function transformTo(serverType, dirPath, verbose) {
    const packages = await findPackagesWithNodeSwitch(dirPath);

    for (const packagePath of packages) {
        let jsonText = await readFile(packagePath, "utf-8");
        let json = JSON.parse(jsonText);
        let originalJson = JSON.parse(jsonText);
        let nodeSwitch = json.nodeSwitch;

        if (nodeSwitch === true) nodeSwitch = {};
        if (!nodeSwitch.node) nodeSwitch.node = "dist";
        if (!nodeSwitch.bun) nodeSwitch.bun = "src";

        if (serverType === "restore") {
            if (json["nodeSwitch-default"]) serverType = json["nodeSwitch-default"];
            if (!serverType) serverType = "node";
        }

        let mustIgnore = false;

        switch (serverType) {
            case "node":
                json.main = nodeSwitch.node + "/index.js";
                json.types = nodeSwitch.node + "/index.d.ts";
                break;
            case "bun":
                json.main = nodeSwitch.bun + "/index.ts";
                // Avoid deleting it to preserve order.
                json.types = "";
                break;
            default:
                mustIgnore = true;
                break;
        }

        if (mustIgnore) continue;
        let mustUpdate = false;
        if (json.main !== originalJson.main) mustUpdate = true;
        else if (json.type !== originalJson.type) mustUpdate = true;
        if (!mustUpdate) continue;

        let output;

        // Will allow preserving initial formatting and only change minimum things.
        let changes = modify(jsonText, ['main'], json.main, {});
        changes = changes.concat(modify(jsonText, ['types'], json.types, {}));
        output = applyEdits(jsonText, changes);

        if (verbose) console.log("[" + serverType + "] - Updating", packagePath);
        await writeFile(packagePath, output);
    }
}

const verboseFlag = "--verbose";

async function main() {
    let argv = process.argv.slice(1);
    let verbose = false;

    let idxVerbose = argv.indexOf(verboseFlag);
    if (idxVerbose !== -1) { verbose = true; argv.splice(idxVerbose, 1); }

    let command = argv[1];

    const validCommands = ['bun', 'node', 'restore', 'scan'];

    if (!command || !validCommands.includes(command)) {
        console.error('Please specify a valid command: bun, node, restore, or scan');
        process.exit(1);
    }
    if (command === 'scan') {
        const packages = await findPackagesWithNodeSwitch(cwd);
        console.log('Found packages with nodeSwitch (scanned from ' + cwd + ")");
        packages.forEach(p => console.log("-", p));
        return;
    }

    await transformTo(command, cwd, verbose);
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});