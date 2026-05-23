// Edit this file to update client order statuses.
// Later, we can connect this to Google Sheets, Airtable, Firebase, or Supabase.

window.ORDERS = [
  {
    orderId: "SIN-0001",
    clientName: "Demo Client",
    businessName: "Demo Business",
    country: "Uganda",
    phoneWhatsapp: "+256700000000",
    videoLength: "30 seconds",
    amount: "15,000 UGX",
    paymentStatus: "Paid",
    datePaid: "2026-05-23",
    deadline: "2026-05-25",
    status: "Video Production",
    queueNumber: "#01",
    estimatedDelivery: "24-48 hours",
    previewLink: "",
    finalLink: "",
    revisionUsed: "No",
    notes: "Video generation is in progress."
  },
  {
    orderId: "SIN-0002",
    clientName: "Sample Client",
    businessName: "Sample Shop",
    country: "Kenya",
    phoneWhatsapp: "+254700000000",
    videoLength: "15 seconds",
    amount: "300 KES",
    paymentStatus: "Paid",
    datePaid: "2026-05-23",
    deadline: "2026-05-24",
    status: "In Queue",
    queueNumber: "#02",
    estimatedDelivery: "48 hours",
    previewLink: "",
    finalLink: "",
    revisionUsed: "No",
    notes: "Your project is waiting for production."
  }
];
