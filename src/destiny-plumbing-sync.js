const fs = require("fs"),
    childProcess = require('child_process');

module.exports.update = function update() {
    if (!fs.existsSync("./destiny-plumbing/manifestLock.json")) setup();

    let manifest = require("./destiny-plumbing/manifest.json"),
        manifestLock = require("./destiny-plumbing/manifestLock.json");

    if (manifestLock.definitionsDownloaded !== true) pullDefinitions(manifest);
    if (manifestLock.bungieManifestVersion !== JSON.parse(downloadFileSync("https://destiny.plumbing/")).bungieManifestVersion) pullDefinitions(manifest);
}

module.exports.get = (definition) => {
    this.update();

    if (loadDefinitions().includes(definition)) return require(`./destiny-plumbing/definitions/${definition}.json`);
    if (loadDefinitions().includes(`Destiny${definition}Definition`)) return require(`./destiny-plumbing/definitions/Destiny${definition}Definition.json`);
    
    throw new Error(`"${definition}" is not a valid Definition`);
}

function checkDir(path) {
    if (!fs.existsSync(path)) fs.mkdirSync(path);
}

function loadDefinitions() {
    let files = [];
    fs.readdirSync("./destiny-plumbing/definitions/").forEach(file => { if (file.endsWith(".json")) files.push(file.replace(".json", '')) });
    return files;
}

function downloadFileSync(url) {
    return childProcess.execFileSync('curl', ['--silent', '-L', url], {encoding: 'utf8'})
}

function setup() {
    try {
        checkDir("destiny-plumbing");
        checkDir("destiny-plumbing/definitions");

        fs.writeFileSync("./destiny-plumbing/manifest.json", downloadFileSync("https://destiny.plumbing/"));
        fs.writeFileSync("./destiny-plumbing/manifestLock.json", JSON.stringify({
            bungieManifestVersion: require("./destiny-plumbing/manifest.json").bungieManifestVersion,
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
            fs.writeFileSync(`./destiny-plumbing/definitions/${definition}.json`, downloadFileSync(manifest.en.raw[definition]));
            console.log(`    > ${definition} downloaded`)
        } catch {}
    }

    console.log("\nFinished Downloading Definitions\n")

    fs.writeFileSync("./destiny-plumbing/manifestLock.json", JSON.stringify({
        bungieManifestVersion: manifest.bungieManifestVersion,
        definitionsDownloaded : true
    }));
}
