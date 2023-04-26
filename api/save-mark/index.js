const { TableClient } = require("@azure/data-tables");
const { getEmail, isTeacher } = require("../checkMember");
const { setJson, setErrorJson } = require("../contextHelper");

const chatStorageAccountConnectionString = process.env.chatStorageAccountConnectionString;
const marksTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "marks");

module.exports = async function (context, req) {
    const teacherEmail = getEmail(req);

    if (!await isTeacher(teacherEmail, context)) {
        setErrorJson(context, "Unauthorized", 401);
        return;
    }
    const body = req.body;

    const markEntity = {
        ... {
            PartitionKey: body.email,
            RowKey: body.assignmentId,
        }, ...body
    };
    delete markEntity['messages'];
    delete markEntity['prompt'];

    context.log(markEntity);
    await marksTableClient.createEntity(markEntity);
    setJson(context, entities);
}