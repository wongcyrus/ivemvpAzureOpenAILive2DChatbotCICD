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

    $("#classIdSubmit").on("click", async (evt) => {
        evt.preventDefault();
        const classId = $("#classId").val();
        const response = await fetch(`/api/enable-screen-sharing?classId=${classId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        });
        const data = await response.json();
        console.log(data);
    });

});