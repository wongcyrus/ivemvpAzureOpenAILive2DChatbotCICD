const { TableClient } = require("@azure/data-tables");
const { getEmail, blockNonTeacherMember } = require("./checkMember");


const chatStorageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const classesTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "classes");
const sessionsTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "sessions");


module.exports = async function (context, req) {

    const email = getEmail(req);
    await blockNonTeacherMember(email, context);

    const classId = req.query.classId;

    classesTableClient.listEntities({
        queryOptions: {
            filter: `PartitionKey eq '${classId}'`
        }
    }).byPage({ maxPageSize: 300 }).next().then(async (page) => {
        const entities = page.value;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const studentEmail = entity.RowKey;
            await sessionsTableClient.createEntity(
                {
                    partitionKey: studentEmail,
                    rowKey: studentEmail,
                    TeacherEmail: email
                }
            );
        }
    });
    context.res.json({ message: "ok" });
}