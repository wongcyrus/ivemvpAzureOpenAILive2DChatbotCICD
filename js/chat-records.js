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
    });



});