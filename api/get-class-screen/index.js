const { TableClient } = require("@azure/data-tables");
const { getEmail, blockNonTeacherMember } = require("./checkMember");

const storageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const blobServiceClient = BlobServiceClient.fromConnectionString(storageAccountConnectionString);
const containerClient = blobServiceClient.getContainerClient("screen");


const chatStorageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const classesTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "classes");
const screensTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "screens");


module.exports = async function (context, req) {

    const email = getEmail(req);
    await blockNonTeacherMember(email, context);

    const teacherEmail = getEmail(req);
    await blockNonTeacherMember(teacherEmail, context);

    const classId = req.query.classId;

    let continuationToken = null;
    let pageEntities = undefined;
    let entities = [];
    do {
        const page = await classesTableClient.listEntities({
            queryOptions: {
                filter: `PartitionKey eq '${classId}'`
            }
        }).byPage({ maxPageSize: 100, continuationToken: continuationToken }).next();
        pageEntities = page.value;
        continuationToken = pageEntities.continuationToken;
        entities = entities.concat(pageEntities);
    }
    while (continuationToken !== undefined);

    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const studentEmail = entity.rowKey;
        context.log(studentEmail);
  
    }
    context.res.json({ message: "ok" });
}