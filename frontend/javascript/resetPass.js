const api = "http://13.127.163.83:3000";

async function handleReset(e) {
  try {
    e.preventDefault();
    const obj = {
      email: e.target.email.value,
    };
    const result = await axios.post(api + "/password/forgotpassword", obj);
  } catch (error) {
    console.log(error.message);
  }
}
