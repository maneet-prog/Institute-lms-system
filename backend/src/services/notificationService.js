const env = require("../config/env");

async function postJson(url, payload, headers = {}) {
  if (!url || typeof fetch !== "function") {
    return { delivered: false };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Notification delivery failed (${response.status}): ${errorText}`);
  }

  return { delivered: true };
}

async function sendMail({ to, subject, text, html, metadata }) {
  if (!to) {
    return { delivered: false };
  }

  if (env.mail.apiUrl) {
    return postJson(
      env.mail.apiUrl,
      {
        from: env.mail.from,
        to,
        subject,
        text,
        html,
        metadata: metadata || null
      },
      env.mail.apiKey ? { Authorization: `Bearer ${env.mail.apiKey}` } : undefined
    );
  }

  console.log("[mail-preview]", JSON.stringify({ to, subject, text, html, metadata }, null, 2));
  return {
    delivered: false,
    preview: env.nodeEnv !== "production" ? { to, subject, text, html } : undefined
  };
}

async function sendSms({ to, message, metadata }) {
  if (!to) {
    return { delivered: false };
  }

  if (env.sms.apiUrl) {
    return postJson(
      env.sms.apiUrl,
      {
        to,
        message,
        sender_id: env.sms.senderId,
        metadata: metadata || null
      },
      env.sms.apiKey ? { Authorization: `Bearer ${env.sms.apiKey}` } : undefined
    );
  }

  console.log("[sms-preview]", JSON.stringify({ to, message, metadata }, null, 2));
  return {
    delivered: false,
    preview: env.nodeEnv !== "production" ? { to, message } : undefined
  };
}

module.exports = { sendMail, sendSms };
