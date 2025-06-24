const api = "http://15.207.115.51";

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
