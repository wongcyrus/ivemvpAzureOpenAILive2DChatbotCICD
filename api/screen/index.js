const { BlobServiceClient } = require("@azure/storage-blob");
const { getEmail, isMember, isValidSession } = require("../checkMember");
const { setJson, setErrorJson } = require("../contextHelper");

const storageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const blobServiceClient = BlobServiceClient.fromConnectionString(storageAccountConnectionString);
const containerClient = blobServiceClient.getContainerClient("screen");

function getDateTimeStringAsFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    return `${year}-${month}-${day}-${hour}-${minute}-${second}`;
}

module.exports = async function (context, req) {
    const email = getEmail(req);

    if (!await isMember(email, context)) {
        setErrorJson(context, "Unauthorized");
        return;
    }
    if (!await isValidSession(email, context)) {
        setErrorJson(context, "Screen Sharing Session Expired!");
        return;
    }

    try {
        const regex = /^data:.+\/(.+);base64,(.*)$/;
        const matches = req.body.match(regex);
        const ext = matches[1];
        const data = matches[2];
        const bodyBuffer = new Uint8Array(Buffer.from(data, 'base64'));

        const sizeInMB = bodyBuffer.length / 1_048_576;
        if (sizeInMB > 0.5) {
            setErrorJson(context, "File size is too large. Max 0.5 MB", 403);
            return;
        }

        const blobName = email.replace(/[^a-zA-Z0-9 ]/g, '_') + "." + ext;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.uploadData(bodyBuffer);
        context.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);

        const timeBlobName = email + "/" + getDateTimeStringAsFilename() + "." + ext;
        const destinationBlobClient = await containerClient.getBlobClient(timeBlobName);
        await destinationBlobClient.beginCopyFromURL(blockBlobClient.url);

        setJson(context, { DisplayText: blobName, timeBlobName });
    } catch (ex) {
        setErrorJson(context, ex);
    }
}