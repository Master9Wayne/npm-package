const twilio = require('twilio');

let client;

function getTwilioClient() {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return client;
}

async function sendOTP(phone, otp) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return;
  }
  try {
    const c = getTwilioClient();
    await c.messages.create({
      body: `Your NPM (NITK Package Manager) OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
  } catch (err) {
    console.error('Twilio SMS error:', err);
    throw new Error('Failed to send OTP');
  }
}

async function sendSMS(phone, message) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] SMS to ${phone}: ${message}`);
    return;
  }
  try {
    const c = getTwilioClient();
    await c.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
  } catch (err) {
    console.error('Twilio SMS error:', err);
  }
}

module.exports = { sendOTP, sendSMS };
