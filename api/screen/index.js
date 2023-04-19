const { BlobServiceClient } = require("@azure/storage-blob");
const { getEmail, blockNonMember } = require("./checkMember");
// const temp = require('temp');
// const fs = require('fs');

const storageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const blobServiceClient = BlobServiceClient.fromConnectionString(storageAccountConnectionString);
const containerClient = blobServiceClient.getContainerClient("screen");



module.exports = async function (context, req) {
    const email = getEmail(req);
    await blockNonMember(email, context);    

    try {
        const bodyBuffer = new Uint8Array(Buffer.from(req.body, 'binary'));
        // const tempName = temp.path({ suffix: '.jpg' });
        // fs.writeFileSync(tempName, bodyBuffer);

        const blobName = email.replace(/[^a-zA-Z0-9 ]/g, '') + ".jpg";
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.uploadData(bodyBuffer);
        context.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);


        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: { DisplayText: blobName }
        };
        context.done();

    } catch (ex) {
        context.log(ex);
        context.res.json({
            text: "error" + ex
        });
    }
}