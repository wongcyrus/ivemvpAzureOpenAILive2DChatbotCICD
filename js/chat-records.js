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
        const start = new Date();
        start.setHours(start.getHours() - 24);
        const end = new Date();

        const email = $("#email").val();
        const response = await fetch(`/api/chat-records?email=${email}&start=${start.toISOString()}&end=${end.toISOString()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        });
        const data = await response.json();
        console.log(data);
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
});