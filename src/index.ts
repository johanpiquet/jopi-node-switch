import { readdir, readFile, stat } from 'fs/promises';
import { parseTree, modify, applyEdits, format } from 'jsonc-parser';

import path from 'path';
import {writeFile} from "node:fs/promises";

type ServerType = "node" | "bun";

async function findPackagesWithNodeSwitch(dirPath: string): Promise<string[]> {
    let foundPackages: string[] = [];
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
            } catch (error) {
                console.error(`Error processing file: ${filePath}`, error);
            }
        }
    }

    return foundPackages;
}

async function transformTo(serverType: ServerType, dirPath: string, testOnly: boolean) {
    const packages = await findPackagesWithNodeSwitch(dirPath);

    for (const packagePath of packages) {
        //let json = JSON.parse(await readFile(packagePath, 'utf-8'));
        let jsonText = await readFile(packagePath, "utf-8");

        let json = JSON.parse(jsonText);
        let originalJson = JSON.parse(jsonText);

        let nodeSwitch = json.nodeSwitch;
        if (nodeSwitch===true) nodeSwitch = {};
        if (!nodeSwitch.node) nodeSwitch.node = "dist";
        if (!nodeSwitch.bun) nodeSwitch.bun = "src";

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
        }

        let mustUpdate = false;
        if (json.main!==originalJson.main) mustUpdate = true;
        else if (json.type!==originalJson.type) mustUpdate = true;

        if (!mustUpdate) continue;
        let output: string;

        // Will allow preserving initial formatting and only change minimum things.
        //
        let changes = modify(jsonText, ['main'], json.main, {});
        changes = changes.concat(modify(jsonText, ['types'], json.types, {}));
        output = applyEdits(jsonText, changes);

        if (!testOnly) {
            await writeFile(packagePath, output);
        }
    }

    return packages;
}

//await transformTo("node", "../..", false);
await transformTo("bun", "../..", false);
