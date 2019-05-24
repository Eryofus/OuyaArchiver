var apps = require("./apps.json");
var request = require('request-promise-native');
var fs = require('fs');
var path = require('path');
var url = require('url');
const { DownloaderHelper } = require('node-downloader-helper');
const filenamify = require('filenamify');
var argv = require('minimist')(process.argv.slice(2), {
    alias: { h: 'help', t: "threads", a: "apk,", p: "premium", f: "fresh" },
    default: { t: '5' },
});
let archive = {};
if (fs.existsSync("archive.json")) {
    archive = JSON.parse(fs.readFileSync("archive.json"));
}

const getApps = async () => {
    try {
        return await request.get('https://devs.ouya.tv/api/v1/apps');
    } catch (error) {
        console.error(error)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getApkLink(app) {
    return new Promise(async (resolve, reject) => {

        let downloadLink

        try {
            downloadLink = await request.get("https://devs.ouya.tv/api/v1/apps/" + app.uuid + "/download");

            downloadLink = JSON.parse(downloadLink).app.downloadLink
            uri = url.parse(downloadLink)
            filename = path.basename(uri.path)

            resolve([downloadLink, filename])

        } catch (error) {
            console.error("Error downloading the " + app.title + " APK")
            reject()
        }
    })
}

async function downloadScreenshots(app) {

    return new Promise(async resolve => {
        let appJSON

        try {
            appJSON = await request.get("https://devs.ouya.tv/api/v1/apps/" + app.uuid);
        } catch (error) {
            console.error(error)
        }

        let screenshots = JSON.parse(appJSON).app.filepickerScreenshots

        for (scr in screenshots) {
            download(screenshots[scr], "./downloads/" + app.title + "/screenshots/", "screenshot" + scr + ".jpg")
        }

    })
}

async function downloadAsync(link, path, filename) {
    return new Promise(async resolve => {

        await download(link, path, filename).then(resolve())

    })
}

async function download(link, path, filename) {
    try {
        return new Promise(async (resolve, reject) => {

            try {

                await fs.mkdirSync(path, { recursive: true }, (err) => {
                    if (err) throw err;
                });

                const dl = new DownloaderHelper(link, path, { fileName: filename, override: true });

                dl.on('end', () => {
                    resolve();
                })

                dl.on('error', (err) => {
                })

                await dl.start();

            } catch (error) {

                console.error("Error downloading " + link)
                reject();

            }
        })
    } catch{ }
}


async function main() {

    if (argv.f) apps = await JSON.parse(await getApps());

    running = 0
    limit = argv.t
    x = 0

    while (x < apps.apps.length) {
        if (running < limit) {
            app = apps.apps[x]
            x++;
            if ((app.premium == false || argv.p) && !archive[app.uuid]) {
                running++;
                console.log("Downloading: " + app.title);
                try {
                    const appTitle = await filenamify(app.title, { replacement: '_' });
                    if (!argv.a) {
                        download("https://devs.ouya.tv/api/v1/apps/" + app.uuid, "./downloads/" + appTitle, "info.json")
                        if (app.mainImageFullUrl != null) download(app.mainImageFullUrl, "./downloads/" + appTitle, "mainImage.png")
                        if (app.heroImage != null) download(app.heroImage, "./downloads/" + appTitle, "heroImage.jpg")
                        downloadScreenshots(app)
                    }

                    if (app.premium == false) {
                        try {
                            var [downloadLink, filename] = await getApkLink(app).then(new Error());
                            download(downloadLink, "./downloads/" + appTitle + "/", filename).then(() => {
                                running = running - 1;
                                archive[app.uuid] = true;
                                fs.writeFileSync("archive.json", JSON.stringify(archive));
                            })
                        } catch{ running = running - 1; }
                    } else {
                        running = running - 1;
                        archive[app.uuid] = true;
                        fs.writeFileSync("archive.json", JSON.stringify(archive));
                    }
                } catch (error) { }
            }
        } else {
            await sleep(100);
        }
    }
}

if (argv.h) {
    console.log(`
    OuyaArchiver v1

    Options:
        -t x, --threads x  set number of threads to x (default: 5)
        -a, --apk          only download the APKs
        -f, --fresh        use app list from the web, instead of the included one (adds a delay when starting)
        -p, --premium      additionally downloads the info and screenshots of premium games, but not the APKs
        -h, --help         print usage information
    `)
} else {
    main();
}