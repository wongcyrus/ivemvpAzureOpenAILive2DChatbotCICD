let currentChatRecord;
let mark;
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

    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
    const parameters = getUrlVars();
    if (parameters["email"]) {
        $("#email").val(parameters["email"]);
    }
    if (parameters["taskId"]) {
        $("#taskId").val(parameters["taskId"]);
    }
    if (parameters["start"]) {
        $("#start").val(parameters["start"]);
    }
    if (parameters["end"]) {
        $("#end").val(parameters["end"]);
    }


    const tableBody = $("#table-body");
    $("#email-submit").on("click", async (evt) => {
        evt.preventDefault();
        const start = new Date($("#start").val());
        const end = new Date($("#end").val());
        const email = $("#email").val();
        const taskId = $("#taskId").val();
        const response = await fetch(`/api/chat-records?email=${email}&taskId=${taskId}&start=${start.toISOString()}&end=${end.toISOString()}`, {
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
            let other = { ...chat };
            delete other["User"];
            delete other["Chatbot"];
            delete other["Model"];
            delete other["CompletionTokens"];
            delete other["PromptTokens"];
            delete other["TotalTokens"];
            delete other["Cost"];
            delete other["timestamp"];
            const newDate = new Date(timestamp);
            const tr = $(`
            <tr>
                <th scope="row">${rowCount}</th>
                <td>${User}</td>
                <td>${Chatbot}</td>
                <td>${Model}</td>
                <td>${PromptTokens}</td>
                <td>${CompletionTokens}</td>
                <td>${TotalTokens}</td>
                <td class=".wrap">USD$ ${Cost}</td>
                <td>${newDate.toDateString()} ${newDate.toTimeString()}</td>
                <td class=".wrap">${JSON.stringify(other)}</td>
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
            return acc;
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
        mark = json;
        console.log(json);
        const answer = json.choices[0].message.content;
        $("#ResponseTextarea").html(answer);

        const marked = JSON.parse(answer);
        if (marked.comments) {
            $("#mark").html(marked.marks + " marks");
            $("#ResponseTextarea").html(marked.comments);
        } else {
            $("#ResponseTextarea").html(answer);
        }
    });
});