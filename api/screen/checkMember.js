const { TableClient } = require("@azure/data-tables");

const chatStorageAccountConnectionString = process.env.chatStorageAccountConnectionString;
const usersTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "users");
const sessionsTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "sessions");

const getEmail = (req) => {
    const header = req.headers['x-ms-client-principal'];
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    const clientPrincipal = JSON.parse(decoded);
    return clientPrincipal.userDetails;
}
const isMember = async (email, context) => {
    try {
        const user = await usersTableClient.getEntity(email, email);
        context.log(user);
        return user.partitionKey ? true : false;
    } catch (__) {
        return false;
    }
}

async function isValidSession(email, context) {
    let continuationToken = null;
    let pageEntities = undefined;
    let entities = [];
    const sessionEndtime = new Date();
    sessionEndtime.setHours(sessionEndtime.getHours() + 3);
    do {
        const page = await sessionsTableClient.listEntities({
            queryOptions: {
                filter: `PartitionKey eq '${email}' and Timestamp le datetime'${sessionEndtime.toISOString()}'`
            }
        }).byPage({ maxPageSize: 100, continuationToken: continuationToken }).next();
        pageEntities = page.value;
        continuationToken = pageEntities.continuationToken;
        entities = entities.concat(pageEntities);
    }
    while (continuationToken !== undefined);

    return entities.length > 0;

}

module.exports = {
    getEmail,
    isMember,
    isValidSession
};