const form = document.getElementById("resetForm");
const messageDiv = document.getElementById("message");
const api = "http://15.207.115.51:3000";

const parts = window.location.pathname.split("/");
const id = parts[parts.length - 1];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const obj = {
    newPassword: e.target.newPassword.value,
  };

  try {
    const res = await axios.put(`${api}/password/updatepassword/${id}`, obj);

    messageDiv.textContent = res.data.msg;
  } catch (err) {
    console.error(err);
    messageDiv.textContent = "Something went wrong. Please try again.";
  }
});
