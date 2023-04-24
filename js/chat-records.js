let currentChatRecord;
$(document).ready(async () => {
    async function getUser() {
        const response = await fetch('/.auth/me');
        const payload = await response.json();
        const { clientPrincipal } = payload;
        return clientPrincipal;
    }

    try {
        const user = await getUser();
        console.log(user);
        $("#logout").html("Logout " + user.userDetails);
        $(".member").show();
        $(".nonmember").hide();
    }
    catch (ex) {
        $(".member").hide();
        $(".nonmember").show();
    }


    const tableBody = $("#table-body");
    $("#email-submit").on("click", async (evt) => {
        evt.preventDefault();
        const start = new Date($("#start").val());
        const end = new Date($("#end").val());
        const email = $("#email").val();
        const response = await fetch(`/api/chat-records?email=${email}&start=${start.toISOString()}&end=${end.toISOString()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        });
        const data = await response.json();
        console.log(data);
        currentChatRecord = data;
        let rowCount = 1;
        tableBody.empty();
        data.forEach(chat => {
            const { User, Chatbot, Model, CompletionTokens, PromptTokens, TotalTokens, Cost, timestamp } = chat;
            const tr = $(`
            <tr>
                <th scope="row">${rowCount}</th>
                <td>${User}</td>
                <td>${Chatbot}</td>
                <td>${Model}</td>
                <td>${PromptTokens}</td>
                <td>${CompletionTokens}</td>
                <td>${TotalTokens}</td>
                <td>${Cost}</td>
                <td>${timestamp}</td>
            </tr>       
            `);
            tableBody.append(tr);
            rowCount++;
        });
    });

    $("#comment-submit").on("click", async (evt) => {
        evt.preventDefault();
        const prompt = $("#PromptTextarea").val();
        const convertsions = currentChatRecord.reduce((acc, chat) => {
            acc += "User: " + chat.User + "\n";
            acc += "AI: " + chat.Chatbot + "\n";
        }, "");
        const text = prompt.replace("###conversations###", convertsions);
        const systemMessage = { "role": "system", "content": "You are a helpful assistant." };
        const messages = [systemMessage,
            { "role": "user", "content": text }
        ];
        const m = {
            "model": "gpt-4",
            "prompt": messages,
            "max_tokens": 800,
            "temperature": 0.7,
            "top_p": 0.95,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "stop": ["<|im_end|>"]
        };

        const response = await fetch(`/api/chatgpt/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(m)
        });
        const json = await response.json();
        console.log(json);
        const answer = json.choices[0].message.content;
        $("#ResponseTextarea").htl(answer);
    });
});