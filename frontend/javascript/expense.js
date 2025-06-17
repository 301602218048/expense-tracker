const api = "http://localhost:3000";
const cashfree = Cashfree({ mode: "sandbox" });
const premiumBtn = document.getElementById("premiumBtn");
const pagination = document.getElementById("pagination");
const rowperPage = document.getElementById("pages");

const token = localStorage.getItem("token");
let currentPage;

if (!localStorage.getItem("rowperPage")) {
  localStorage.setItem("rowperPage", 2);
}

document.addEventListener("DOMContentLoaded", initialize);

premiumBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`${api}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to create payment session");

    const { paymentSessionId, orderId } = await response.json();

    const result = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_modal",
    });

    if (result.error) {
      console.log("Payment error or popup closed:", result.error);
    }

    if (result.paymentDetails) {
      const status = await axios.get(`${api}/pay/payment-status/${orderId}`);
      alert(`Your payment is ${status.data.orderStatus}`);

      if (status.data.orderStatus === "Success") {
        showPremiumFeatures();
        premiumBtn.disabled = true;
      }
    }
  } catch (err) {
    console.error(err);
  }
});

function parseJwt(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

rowperPage.onchange = () => {
  currentPage = 1;
  localStorage.setItem("rowperPage", rowperPage.value);
  localStorage.setItem("currentPage", currentPage);
  getExpenses(currentPage);
};

async function initialize() {
  try {
    rowperPage.value = localStorage.getItem("rowperPage");
    await getExpenses(1);

    const user = parseJwt(token);
    if (user.premium) {
      premiumBtn.disabled = true;
      showPremiumFeatures();
    }
  } catch (err) {
    console.error(err);
  }
}

function showPremiumFeatures() {
  const div = document.createElement("div");
  div.setAttribute("class", "premium-text");
  div.innerHTML = `You are a premium user. <button id="leaderboard">Show Leaderboard</button><button id="download">Download</button>`;
  document.body.insertBefore(div, document.getElementById("expenses"));

  document.getElementById("leaderboard").addEventListener("click", async () => {
    try {
      const res = await axios.get(`${api}/premium/showLeaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const lbList = document.getElementById("lb-list");
      const lbHeading = document.getElementById("lb-heading");

      lbList.innerHTML = "";
      lbHeading.style.display = lbList.style.display = "block";

      res.data.leaderboard.forEach((user) => addLeaderToDOM(user, lbList));

      document.getElementById("leaderboard-tabledata").style.display = "block";
      leaderboardTableData();
    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById("download").addEventListener("click", download);
}

async function download() {
  try {
    const res = await axios.get("http://localhost:3000/expenses/download", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 201) {
      const a = document.createElement("a");
      a.href = res.data.fileUrl;
      a.download = "myexpense.csv";
      a.click();
    }
  } catch (error) {
    console.log(error);
  }
}

function addToDOM({ id, amount, category, description }) {
  const ul = document.getElementById("expense-list");
  const li = document.createElement("li");
  li.setAttribute("class", "expense-item");
  li.textContent = `Rs ${amount} - ${category} - (${description})`;

  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  delBtn.onclick = () => deleteData(id, li);

  li.appendChild(delBtn);
  ul.appendChild(li);
}

function addLeaderToDOM({ name, totalExpense = 0 }, ul) {
  const li = document.createElement("li");
  li.textContent = `${name} - ${totalExpense}`;
  ul.appendChild(li);
}

function handleForm(e) {
  e.preventDefault();
  const { amount, category, desc, note } = e.target;
  addData({
    amount: amount.value,
    category: category.value,
    desc: desc.value,
    note: note.value,
  });
  e.target.reset();
}

async function addData(data) {
  try {
    await axios.post(`${api}/expenses`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    currentPage = localStorage.getItem("currentPage");
    getExpenses(currentPage);
  } catch (err) {
    console.error(err);
  }
}

async function deleteData(id, item) {
  try {
    await axios.delete(`${api}/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    item.remove();
    currentPage = localStorage.getItem("currentPage");
    const expenseCount = document.querySelectorAll(".expense-item").length;
    if (expenseCount === 0 && currentPage > 0) {
      getExpenses(currentPage - 1);
    }
    getExpenses(currentPage);
  } catch (err) {
    console.error(err);
  }
}

async function leaderboardTableData() {
  const listboard = document.getElementById("leaderboard-tabledata");
  const response = await axios.get("http://localhost:3000/expenses", {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const expenses = response.data.data;
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString("default", { month: "long" });

  const monthlyExpenses = expenses.filter((exp) => {
    const [year, month] = exp.createdAt.slice(0, 10).split("-");
    return month === currentMonth && +year === currentYear;
  });

  let income = 0,
    expense = 0;
  let rows = monthlyExpenses.map((exp) => {
    const date = exp.createdAt.slice(0, 10);
    const isIncome = exp.category === "salary";
    const amt = +exp.amount;
    if (isIncome) income += amt;
    else expense += amt;

    return `
      <tr class="table-item">
        <td>${date}</td>
        <td>${exp.description}</td>
        <td>${exp.category}</td>
        <td>${isIncome ? `Rs ${amt}.00` : "00.00"}</td>
        <td>${!isIncome ? `Rs ${amt}.00` : "00.00"}</td>
      </tr>
    `;
  });

  let note_rows = expenses.map((exp) => {
    return exp.note
      ? `<tr class="table-item">
      <td>${exp.createdAt.slice(0, 10)}</td>
      <td>${exp.note}</td>
      </tr>`
      : "";
  });

  const saving = income - expense;

  const downloadtable = await axios.get(
    "http://localhost:3000/expenses/downloadtable",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  console.log(downloadtable);

  const fileRows = downloadtable.data.data.length
    ? downloadtable.data.data
        .map(
          (item) => `
        <tr>
          <td>${item.createdAt.slice(0, 10)}</td>
          <td><a href="${item.fileUrl}" target="_blank">${item.fileUrl}</a></td>
        </tr>
      `
        )
        .join("")
    : "<tr><td colspan='2'>No files downloaded yet.</td></tr>";

  const tableSection = `
    <h2>${monthName} ${currentYear}</h2>
    <table>
    <tr><th>Date</th><th>Description</th><th>Category</th><th>Income</th><th>Expenses</th></tr>
      ${rows.join("")}
      <tr><td colspan="3"></td><td><strong>Rs ${income}.00</strong></td><td><strong>Rs ${expense}.00</strong></td></tr>
      </tr>
      </table>
      <table style="width: 80%;">
      <tr><td style="color: blue; text-align: right;">Total Saving: Rs ${saving}.00</td></tr>
      </table>
      `;

  const yearlyReport = `
    <h3>Yearly Report</h3>
    <table>
      <tr><th>Month</th><th>Income</th><th>Expense</th><th>Saving</th></tr>
      <tr>
      <td>${monthName}</td>
        <td style="color: green">Rs ${income}.00</td>
        <td style="color: red">Rs ${expense}.00</td>
        <td style="color: blue">Rs ${saving}.00</td>
      </tr>
    </table>
  `;

  const notesReport = `
    <h3>Notes Report ${currentYear}</h3>
    <table>
      <tr><th>Date</th><th>Notes</th></tr>
      ${note_rows.join("")}
    </table>
  `;

  const fileTable = `
    <h3>Download Files</h3>
    <table>
      <tr><th>Date</th><th>File URL</th></tr>
      ${fileRows}
    </table>
  `;

  listboard.innerHTML = tableSection + yearlyReport + notesReport + fileTable;
}

async function getExpenses(page) {
  const limit = localStorage.getItem("rowperPage") || 2;
  localStorage.setItem("currentPage", page);
  try {
    const res = await axios.get(
      `${api}/expenses/paginate?page=${page}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { data, ...pageData } = res.data;

    const ul = document.getElementById("expense-list");
    ul.innerHTML = "";

    data.forEach(addToDOM);
    showPagination(pageData);
  } catch (error) {
    console.log("Error loading expenses:", error);
  }
}

function showPagination({
  CURRENT_PAGE,
  HAS_NEXT_PAGE,
  NEXT_PAGE,
  HAS_PREVIOUS_PAGE,
  PREVIOUS_PAGE,
  LAST_PAGE,
}) {
  pagination.innerHTML = "";
  if (HAS_PREVIOUS_PAGE) {
    const btn2 = document.createElement("button");
    btn2.innerHTML = PREVIOUS_PAGE;
    btn2.addEventListener("click", () => getExpenses(PREVIOUS_PAGE));
    pagination.appendChild(btn2);
  }
  const btn3 = document.createElement("button");
  btn3.innerHTML = CURRENT_PAGE;
  btn3.addEventListener("click", () => getExpenses(CURRENT_PAGE));
  pagination.appendChild(btn3);

  if (HAS_NEXT_PAGE) {
    const btn1 = document.createElement("button");
    btn1.innerHTML = NEXT_PAGE;
    btn1.addEventListener("click", () => getExpenses(NEXT_PAGE));
    pagination.appendChild(btn1);
  }
}
