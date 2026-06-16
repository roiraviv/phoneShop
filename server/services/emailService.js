import nodemailer from 'nodemailer';
import { getSettings } from '../storage/repositories/settingsRepository.js';
import {
  getSmtpConfig,
  buildRepairStatusEmail,
  buildRepairCreatedEmail,
  buildPhonePurchaseEmail,
  buildRepairDeliveredEmail,
  buildTestEmail,
} from './emailTemplates.js';

async function createTransporter() {
  const settings = await getSettings();
  const smtp = getSmtpConfig(settings);

  if (!smtp.enabled) {
    return { transporter: null, smtp, settings };
  }
  if (!smtp.host?.trim() || !smtp.user?.trim()) {
    throw new Error('הגדרות SMTP חסרות: שרת ומשתמש הם שדות חובה');
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 587,
    secure: Boolean(smtp.secure),
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  return { transporter, smtp, settings };
}

export async function sendEmail({ to, subject, html }) {
  if (!to?.trim()) {
    throw new Error('כתובת נמען חסרה');
  }

  const { transporter, smtp, settings } = await createTransporter();
  if (!transporter) {
    throw new Error('שליחת מייל מושבתת בהגדרות');
  }

  const fromName = smtp.fromName || settings.storeName || 'PhoneStore';
  const fromEmail = smtp.fromEmail || smtp.user;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: to.trim(),
    subject,
    html,
  });

  return { success: true };
}

/** שליחה ברקע – לא חוסמת את ה-API */
export function sendEmailAsync(payload) {
  sendEmail(payload).catch((err) => {
    console.error('[Email]', err.message);
  });
}

export async function verifySmtpConnection() {
  const { transporter } = await createTransporter();
  if (!transporter) {
    throw new Error('שליחת מייל מושבתת בהגדרות');
  }
  await transporter.verify();
  return true;
}

export async function sendTestEmail(to) {
  const settings = await getSettings();
  const { subject, html } = buildTestEmail({ storeName: settings.storeName });
  return sendEmail({ to, subject, html });
}

export async function notifyRepairStatusChange(repair, oldStatus, customer) {
  const settings = await getSettings();
  const smtp = getSmtpConfig(settings);
  if (!smtp.enabled || !smtp.notifyRepairStatus) return;
  if (!customer?.email?.trim()) return;
  if (!oldStatus || oldStatus === repair.status) return;

  const { subject, html } = buildRepairStatusEmail({
    storeName: settings.storeName,
    customer,
    repair,
    oldStatus,
    newStatus: repair.status,
  });

  sendEmailAsync({ to: customer.email, subject, html });
}

export async function notifyRepairCreated(repair, customer) {
  const settings = await getSettings();
  const smtp = getSmtpConfig(settings);
  if (!smtp.enabled || !smtp.notifyRepairCreated) return;
  if (!customer?.email?.trim()) return;

  const { subject, html } = buildRepairCreatedEmail({
    storeName: settings.storeName,
    customer,
    repair,
  });

  sendEmailAsync({ to: customer.email, subject, html });
}

export async function notifyPhonePurchase(transaction, customer, warrantyMonths = 12) {
  const settings = await getSettings();
  const smtp = getSmtpConfig(settings);
  if (!smtp.enabled || !smtp.notifyPhonePurchase) return;
  if (!customer?.email?.trim()) return;

  const phoneItems = (transaction.items || []).filter((i) => i.itemType === 'phone');
  if (phoneItems.length === 0) return;

  const { subject, html } = buildPhonePurchaseEmail({
    storeName: settings.storeName,
    customer,
    transaction,
    phoneItems,
    warrantyMonths,
  });

  sendEmailAsync({ to: customer.email, subject, html });
}

export async function notifyRepairDeliveredFromSale(transaction, customer) {
  const settings = await getSettings();
  const smtp = getSmtpConfig(settings);
  if (!smtp.enabled || !smtp.notifyRepairDelivered) return;
  if (!customer?.email?.trim()) return;

  const repairItems = (transaction.items || []).filter((i) => i.itemType === 'repair');
  for (const item of repairItems) {
    const { subject, html } = buildRepairDeliveredEmail({
      storeName: settings.storeName,
      customer,
      item,
      transaction,
    });
    sendEmailAsync({ to: customer.email, subject, html });
  }
}
