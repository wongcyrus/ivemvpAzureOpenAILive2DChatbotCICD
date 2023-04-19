const axios = require('axios');
const { TableClient } = require("@azure/data-tables");
const { getEmail, blockNonMember, isOverLimit } = require("./checkMember");
const { prices } = require("./price");


const openaipikey = process.env.openAiCognitiveAccount;
const chatStorageAccountConnectionString = process.env.chatStorageAccountConnectionString;

const chatHistoryTableClient = TableClient.fromConnectionString(chatStorageAccountConnectionString, "chatHistory");

module.exports = async function (context, req) {

    const email = getEmail(req);
    await blockNonMember(email, context);

    if (await isOverLimit(email)) {
        context.res.json({
            "choices": [
                {
                    "text": "Used up your daily limit. Please try again tomorrow.",
                }
            ]
        });
    }

    context.log("Chat");
    const body = req.body;
    context.log(body);

    const model = body.model;
    delete body.model;
    if (!process.env.openAiCognitiveDeploymentNames.split(",").find(element => model == element)) {
        context.res.json({
            "choices": [
                {
                    "text": "Invalid model name!",
                }
            ]
        });
    }

    const apiVersion = model.startsWith('gpt-') ? "2023-03-15-preview" : "2022-12-01";
                    // https://eastus.api.cognitive.microsoft.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview
                    // https://eastus.api.cognitive.microsoft.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview
    const openaiurl = `https://eastus.api.cognitive.microsoft.com/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    body['messages'] = body['prompt'];
    delete body['prompt'];
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'api-key': openaipikey,
        }
        const res = await axios.post(openaiurl, JSON.stringify(body), {
            headers: headers
        });
        context.log(res.data);

        const s = body.prompt.split(`<|im_end|>`);
        const quertion = s[s.length - 2].replace("\n<|im_start|>User\n", "");

        const now = new Date();
        const ticks = "" + now.getTime();

        const chatEntity = {
            PartitionKey: email,
            RowKey: ticks,
            Email: email,
            Student: quertion,
            Chatbot: res.data.choices[0].text,
            CompletionTokens: res.data.usage.completion_tokens,
            PromptTokens: res.data.usage.prompt_tokens,
            TotalTokens: res.data.usage.total_tokens,
        };
        context.log(chatEntity);
        await chatHistoryTableClient.createEntity(chatEntity);

        context.res.json(res.data);

    } catch (ex) {
        context.log(ex);
        context.res.json({
            text: "error" + ex
        });
    }
}