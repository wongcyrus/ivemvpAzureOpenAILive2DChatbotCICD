const { TableClient } = require("@azure/data-tables");

const chatStorageAccountConnectionString = process.env.chatStorageAccountConnectionString;
const usersTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "users");

const getEmail = (req) => {
    const header = req.headers['x-ms-client-principal'];
    const encoded = Buffer.from(header, 'base64');
    const decoded = encoded.toString('ascii');
    const clientPrincipal = JSON.parse(decoded);
    return clientPrincipal.userDetails;
}

const isTeacher = async (email, context) => {
    try {
        const user = await usersTableClient.getEntity(email, email);
        context.log(user);
        return user.partitionKey ? true : false && user.Role === "teacher";
    } catch (__) {
        return false;
    }
}

module.exports = {
    getEmail,
    isTeacher,
};
