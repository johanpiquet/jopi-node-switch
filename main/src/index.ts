import { readdir, stat } from 'fs/promises';
import { readFile } from 'fs/promises';
import path from 'path';
import {writeFile} from "node:fs/promises";

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

type ServerType = "node" | "bun";

async function transformTo(serverType: ServerType, dirPath: string = process.cwd()) {
    const packages = await findPackagesWithNodeSwitch(dirPath);

    for (const packagePath of packages) {
        let json = JSON.parse(await readFile(packagePath, 'utf-8'));

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
                delete(json.types);
                break;
        }

        await writeFile(packagePath, JSON.stringify(json, null, 2) + "\n");
    }

    return packages;
}

//console.log(await transformTo("bun", "../.."));
console.log(await transformTo("node", "../.."));
