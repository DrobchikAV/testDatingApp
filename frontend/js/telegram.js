// Telegram WebApp auto-login
async function initTelegramAuth() {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
        console.log("Not in Telegram Mini App");
        return false;
    }
    tg.expand(); // full screen

    const user = tg.initDataUnsafe?.user;
    if (!user) {
        console.log("No user data");
        return false;
    }

    window.telegramUser = {
        id: user.id,
        username: user.username || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
    };

    // Try to login
    try {
        const result = await authAPI.login(user.id);
        if (result.success) {
            saveCurrentUser(result.user);
            showToast(`Welcome back, ${user.first_name}!`, "success");
            showPage("feed");
            return true;
        }
    } catch (error) {
        // Not registered – go to registration and pre-fill
        showPage("auth");
        prefillRegistrationForm(user);
        return false;
    }
}

function prefillRegistrationForm(user) {
    document.getElementById("telegramId").value = user.id;
    document.getElementById("username").value = user.username;
    document.getElementById("firstName").value = user.first_name;
    document.getElementById("lastName").value = user.last_name;
    showToast("Please complete your registration", "info");
}