# OuyaArchiver

Downloads all APKs, Infos and Screenshots of free games in the Ouya Store

## Getting Started

If you don't have node.js installed, you can download and run the executables from the Releases tab.

If you have node.js installed, just clone this repository, run "npm i" and execute the archiver using "node main.js".

## Arguments

    -t x, --threads x  set number of threads to x (default: 5)
    -a, --apk          only download the APKs
    -f, --fresh        use app list from the web, instead of the included one (adds a delay when starting)
    -p, --premium      additionally downloads the info and screenshots of premium games, but not the APKs
    -h, --help         print usage information

## Archive File

Once the APK of a game has been downloaded, the uuid of the game is saved in an archive.json file. On consecutive runs, the games saved in the archive.json are skipped. 
If you wish to download all games from scratch, delete the archive.json file.

## Additional Info

There are some occasional errors:

- "Error downloading https://d3e4aumcqn8cw3.cloudfront.net/api/file/xxxxxxxx", when downloading screenshots

- "Error downloading the GameName APK", when downloading an APK

Both of these errors aren't the fault of the downloader, instead OUYAs CDN simply fails to return an image or APK. The problem should persist even in the official store on an OUYA itself.

