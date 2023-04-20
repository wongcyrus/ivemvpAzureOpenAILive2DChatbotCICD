const { TableClient } = require("@azure/data-tables");
const { getEmail, blockNonTeacherMember } = require("./checkMember");


const chatStorageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const classesTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "classes");
const sessionsTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "sessions");


module.exports = async function (context, req) {

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
        const studentEmail = entity.RowKey;
        context.log(studentEmail);
        await sessionsTableClient.updateEntity(
            {
                partitionKey: studentEmail,
                rowKey: studentEmail,
                TeacherEmail: teacherEmail
            }
        );
    }

    const emails = entities.map(entity => entity.RowKey);

    context.res.json({ message: "ok", emails });
}