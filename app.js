const SHEET_ID = "1_zPyjHCP6wDJJdMo-4VVguyTWs4JLJSbntwF8G6Hb3U";
const SHEET_GID = "0";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;

const stages = [
  "Brief Received",
  "Payment Pending",
  "Paid",
  "In Queue",
  "Script/Plan Ready",
  "Image Production",
  "Video Production",
  "Editing",
  "First Preview Sent",
  "Revision",
  "Delivered",
  "Completed"
];

const input = document.querySelector("#orderId");
const button = document.querySelector("#checkBtn");
const result = document.querySelector("#result");

const fallbackOrders = Array.isArray(window.ORDERS) ? window.ORDERS : [];
let orders = [...fallbackOrders];
let sheetLoaded = false;

function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function safe(value) {
  return String(value || "").replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[char]));
}

function display(value, fallback = "Not set") {
  const text = String(value || "").trim();
  return text ? text : fallback;
}

function safeUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  try {
    const url = new URL(text, window.location.href);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function rowToOrder(headers, row) {
  const record = Object.fromEntries(headers.map((header, index) => [header.trim(), row[index] || ""]));
  const orderIdHeader = headers.find(header => normalize(header).includes("ORDER ID")) || "Order ID";

  return {
    orderId: record[orderIdHeader],
    clientName: record["Client name"],
    country: record["Country"],
    phoneWhatsapp: record["Phone/WhatsApp"],
    businessName: record["Business name"],
    videoLength: record["Video length"],
    amount: record["Amount"],
    paymentStatus: record["Payment status"],
    datePaid: record["Date paid"],
    deadline: record["Deadline"],
    status: record["Current status"],
    queueNumber: record["Queue number"],
    estimatedDelivery: record["Estimated delivery"],
    previewLink: record["Preview link"],
    finalLink: record["Final delivery link"],
    revisionUsed: record["Revision used?"],
    notes: record["Notes"]
  };
}

async function loadOrdersFromSheet() {
  if (sheetLoaded) return;

  try {
    const response = await fetch(`${SHEET_CSV_URL}&cacheBust=${Date.now()}`);
    if (!response.ok) throw new Error(`Google Sheet returned ${response.status}`);

    const csv = await response.text();
    const rows = parseCsv(csv);
    const headerIndex = rows.findIndex(row => normalize(row[0]).includes("ORDER ID"));
    if (headerIndex === -1) throw new Error("Order ID header row not found");

    const headers = rows[headerIndex];
    const sheetOrders = rows
      .slice(headerIndex + 1)
      .map(row => rowToOrder(headers, row))
      .filter(order => order.orderId);

    if (!sheetOrders.length) throw new Error("Google Sheet has no orders yet");
    orders = sheetOrders;
    sheetLoaded = true;
  } catch (error) {
    console.warn("Using local fallback orders because Google Sheets could not load:", error);
    orders = [...fallbackOrders];
    sheetLoaded = true;
  }
}

function findOrder(orderId) {
  return orders.find(order => normalize(order.orderId) === normalize(orderId));
}

function statusProgress(status) {
  const index = stages.indexOf(status);
  if (index === -1) return 0;
  return Math.round(((index + 1) / stages.length) * 100);
}

function renderLoading() {
  result.classList.remove("hidden");
  result.innerHTML = `<h2>Checking status...</h2><p>Please wait a moment.</p>`;
}

function renderOrder(order) {
  const status = display(order.status, "Status pending");
  const progress = statusProgress(status);
  const currentIndex = stages.indexOf(status);
  const previewLink = safeUrl(order.previewLink);
  const finalLink = safeUrl(order.finalLink);

  result.classList.remove("hidden");
  result.innerHTML = `
    <div class="status-header">
      <div>
        <h2>${safe(display(order.businessName, "SIN AI project"))}</h2>
        <p>Order ID: <strong>${safe(order.orderId)}</strong></p>
      </div>
      <div class="status-pill">${safe(status)}</div>
    </div>

    <div class="meta-grid">
      <div class="meta"><span>Client</span><strong>${safe(display(order.clientName))}</strong></div>
      <div class="meta"><span>Country</span><strong>${safe(display(order.country))}</strong></div>
      <div class="meta"><span>Video length</span><strong>${safe(display(order.videoLength))}</strong></div>
      <div class="meta"><span>Amount</span><strong>${safe(display(order.amount))}</strong></div>
      <div class="meta"><span>Payment</span><strong>${safe(display(order.paymentStatus, "Payment pending"))}</strong></div>
      <div class="meta"><span>Date paid</span><strong>${safe(display(order.datePaid, "Not paid yet"))}</strong></div>
      <div class="meta"><span>Deadline</span><strong>${safe(display(order.deadline))}</strong></div>
      <div class="meta"><span>Queue number</span><strong>${safe(display(order.queueNumber))}</strong></div>
      <div class="meta"><span>Estimated delivery</span><strong>${safe(display(order.estimatedDelivery))}</strong></div>
      <div class="meta"><span>Revision used?</span><strong>${safe(display(order.revisionUsed, "No"))}</strong></div>
      <div class="meta"><span>Notes</span><strong>${safe(display(order.notes, "No extra notes."))}</strong></div>
    </div>

    <div class="progress">
      <div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div>
      <ul class="steps">
        ${stages.map((stage, index) => {
          const className = index < currentIndex ? "done" : index === currentIndex ? "current" : "";
          const icon = index < currentIndex ? "âœ“" : index === currentIndex ? "â—" : "â—‹";
          return `<li class="${className}">${icon} ${safe(stage)}</li>`;
        }).join("")}
      </ul>
    </div>

    ${previewLink ? `<p><a class="whatsapp" href="${safe(previewLink)}" target="_blank" rel="noreferrer">View Preview</a></p>` : ""}
    ${finalLink ? `<p><a class="whatsapp" href="${safe(finalLink)}" target="_blank" rel="noreferrer">Download Final Video</a></p>` : ""}
  `;
}

function renderError() {
  result.classList.remove("hidden");
  result.innerHTML = `
    <h2 class="error">Order not found</h2>
    <p>Please check your Order ID and try again. If the issue continues, contact SIN AI support.</p>
  `;
}

async function checkStatus() {
  if (!input.value.trim()) return renderError();

  renderLoading();
  await loadOrdersFromSheet();

  const order = findOrder(input.value);
  order ? renderOrder(order) : renderError();
}

button.addEventListener("click", checkStatus);
input.addEventListener("keydown", event => {
  if (event.key === "Enter") checkStatus();
});
