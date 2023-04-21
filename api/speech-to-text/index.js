const { BlobServiceClient } = require("@azure/storage-blob");
const { speechToText } = require("./speechToText");
const { getEmail, isMember } = require("../checkMember");
const temp = require('temp');
const fs = require('fs');

const speechRegion = process.env.speechRegion;
const ttsApiKey = process.env.ttsApiKey;
const storageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const blobServiceClient = BlobServiceClient.fromConnectionString(storageAccountConnectionString);
const containerClient = blobServiceClient.getContainerClient("voice");



module.exports = async function (context, req) {
    const email = getEmail(req);
    if (!await isMember(email, context)) {
        context.res = {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
            body: "Unauthorized",
            'Content-Type': 'application/json'
        };
        context.done();
        return;
    }


    const language = req.query.language;

    try {
        const bodyBuffer = new Uint8Array(Buffer.from(req.body, 'binary'));
        const tempName = temp.path({ suffix: '.wav' });
        fs.writeFileSync(tempName, bodyBuffer);

        const blobName = email.replace(/[^a-zA-Z0-9 ]/g, '') + "-stt.wav";
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.uploadData(bodyBuffer);
        context.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);

        const res = await speechToText(ttsApiKey, speechRegion, tempName, language, context);
        context.log(res);

        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: { DisplayText: res.privText }
        };
        context.done();

    } catch (ex) {
        context.log(ex);
        context.res.json({
            text: "error" + ex
        });
    }
}