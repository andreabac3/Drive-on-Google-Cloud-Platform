/**
 * Node Version: 8
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const archiver = require('archiver');
const {exec} = require('child_process');
const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = 'drive-cloud-on-gcp.appspot.com';
const bucket = storage.bucket(bucketName);

function zipDirectory(source, out) {
    const archive = archiver('zip', {zlib: {level: 9}});
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}


async function readFiles(res, string_to_match) {
    const [files] = await bucket.getFiles({prefix: string_to_match});
    let arr_files = [];
    files.forEach(file => {
        arr_files.push(file.name);
    });
    return arr_files;
}

async function download(res, arr, str_filename_zip, uuid) {
    for (let j = 0; j < arr.length; j++) {
        if (arr[j].indexOf('.') === -1) {
            continue;
        }
        let destFilename = arr[j].replace(/<.*>/, '');

        await storage.bucket(bucketName).file(arr[j]).download({destination: uuid + destFilename});
    }

    await zipDirectory(uuid, "/tmp/" + str_filename_zip);
    await uploadFile(str_filename_zip);
}

function listFile(arr, uuid) {
    for (let i = 0; i < arr.length; i++) {
        let elem = arr[i].split("/");
        if (elem.length === 1) continue;
        let str_base = uuid;
        if (!fs.existsSync(str_base)) {
            fs.mkdirSync(str_base);
        }

        for (let j = 0; j < elem.length - 1; j++) {
            str_base += "/" + elem[j].replace(/<.*>/, '');
            if (!fs.existsSync(str_base)) fs.mkdirSync(str_base);
        }
    }
}

async function uploadFile(str_filename_zip) {
    // Uploads a local file to the bucket
    await bucket.upload("/tmp/" + str_filename_zip, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        resumable: false,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    });
    // set visibility of file already uploaded to public
    await bucket.file(str_filename_zip).makePublic();
}

async function main(res, string_to_match, filename_zip, uuid) {
    if (!fs.existsSync(uuid)) {
        fs.mkdirSync(uuid);
    }
    let file_matching = await readFiles(res, string_to_match);
    await listFile(file_matching, uuid);
    await download(res, file_matching, filename_zip, uuid);
    let string_url = 'http://storage.googleapis.com/' + bucketName + '/' + filename_zip;
    // res.status(200).send({hello:string_url);
    //res.end(JSON.stringify({ a: string_url }));
    const {headers, method, url} = res;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    // Note: the 2 lines above could be replaced with this next one:
    // response.writeHead(200, {'Content-Type': 'application/json'})
    let body = string_url;
    const responseBody = {headers, method, url, body};

    res.write(JSON.stringify(responseBody));
    res.end();
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

var deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


// Creates a client
exports.helloWorld = (req, res) => {
    let str_filename_zip = req.body.namezip;
    let string_to_match = req.body.prefix;
    let uuid = '/tmp/' + uuidv4() + '/';
    console.log(uuid);
    let file_url = main(res, string_to_match, str_filename_zip, uuid);
    deleteFolderRecursive(uuid);
    exec('rm /tmp/' + str_filename_zip, (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            return;
        }

        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
};