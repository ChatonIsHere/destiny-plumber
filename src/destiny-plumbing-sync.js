const fs = require("fs"),
    childProcess = require('child_process'),
    path = require('path'),
    loc = {
        module: module.filename.substring(0, module.filename.lastIndexOf("\\")),
        plumbing: "",
        manifest: "",
        manifestLock: "",
        definitions: ""
    };

loc.plumbing = path.join(loc.module, "destiny-plumbing");
loc.manifest = path.join(loc.plumbing, "manifest.json");
loc.manifestLock = path.join(loc.plumbing, "manifestLock.json");
loc.definitions = path.join(loc.plumbing, "definitions");

module.exports.update = function update() {
    checkManifestExists();

    let manifest = require(loc.manifest),
        manifestLock = require(loc.manifestLock);

    if (manifestLock.definitionsDownloaded !== true) pullDefinitions(manifest);
    if (manifestLock.bungieManifestVersion !== JSON.parse(downloadFileSync("https://destiny.plumbing/")).bungieManifestVersion) pullDefinitions(manifest);
}

module.exports.get = function get(definition) {
    checkManifestExists();

    if (loadDefinitions().includes(definition)) return require(path.join(loc.definitions, `${definition}.json`));
    if (loadDefinitions().includes(`Destiny${definition}Definition`)) return require(path.join(loc.definitions, `Destiny${definition}Definition.json`));
    
    throw new Error(`"${definition}" is not a valid Definition`);
}

module.exports.define = function define(definition, hash) {
    checkManifestExists();

    let definitions = loadDefinitions();

    if (definitions.includes(definition)) {
        let tempDef = require(path.join(loc.definitions, `${definition}.json`));
        if (tempDef[hash]) return tempDef[hash];
    }
    else if (definitions.includes(`Destiny${definition}Definition`)) {
        let tempDef = require(path.join(loc.definitions, `Destiny${definition}Definition.json`));
        if (tempDef[hash]) return tempDef[hash];
    }
    
    throw new Error(`"${hash}" could not be converted`);
}

module.exports.tools = {};

module.exports.tools.getClassName = (hash) => {
    let DestinyClassDefinition = require(path.join(loc.definitions, "DestinyClassDefinition.json"));
    if (DestinyClassDefinition[hash]) return DestinyClassDefinition[hash].displayProperties.name;
    throw new Error(`"${hash}" could not be converted`);
}

function checkManifestExists() {
    if (!fs.existsSync(loc.manifestLock)) setup();
}

function checkDir(path) {
    if (!fs.existsSync(path)) fs.mkdirSync(path);
}

function loadDefinitions() {
    let files = [];
    fs.readdirSync(loc.definitions).forEach(file => { if (file.endsWith(".json")) files.push(file.replace(".json", '')) });
    return files;
}

function downloadFileSync(url) {
    return childProcess.execFileSync('curl', ['--silent', '-L', url], {encoding: 'utf8'})
}

function setup() {
    try {
        checkDir(loc.plumbing);
        checkDir(loc.definitions);

        fs.writeFileSync(loc.manifest, downloadFileSync("https://destiny.plumbing/"));
        fs.writeFileSync(loc.manifestLock, JSON.stringify({
            bungieManifestVersion: require(loc.manifest).bungieManifestVersion,
            definitionsDownloaded : false
        }));
    } catch (err) {
        console.log(err)
    }
}

function pullDefinitions(manifest) {
    console.log("\nDownloading Definitions\n")

    for (let definition in manifest.en.raw) {
        try {
            fs.writeFileSync(path.join(loc.definitions, `${definition}.json`), downloadFileSync(manifest.en.raw[definition]));
            console.log(`    > ${definition} downloaded`)
        } catch {}
    }

    console.log("\nFinished Downloading Definitions\n")

    fs.writeFileSync(loc.manifestLock, JSON.stringify({
        bungieManifestVersion: manifest.bungieManifestVersion,
        definitionsDownloaded : true
    }));
}
