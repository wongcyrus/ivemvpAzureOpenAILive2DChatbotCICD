const setJson = (context, body) => {
    context.res = {
        headers: { 'Content-Type': 'application/json' },
        body
    };
}

const setErrorJson = (context, body, statusCode) => {
    context.res = {
        status: statusCode ?? 401,
        headers: { 'Content-Type': 'application/json' },
        body
    };
}

module.exports = {
    setJson,
    setErrorJson,
};
