import { getSettings, updateSettings } from '../storage/repositories/settingsRepository.js';
import { sendTestEmail, verifySmtpConnection } from '../services/emailService.js';
import { getSmtpConfig } from '../services/emailTemplates.js';

export async function readSettings(_req, res) {
  try {
    const settings = await getSettings();
    const smtp = getSmtpConfig(settings);
    const { pass: _pass, ...smtpPublic } = smtp;
    res.json({
      success: true,
      data: {
        ...settings,
        smtp: { ...smtpPublic, hasPassword: Boolean(settings.smtp?.pass) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function patchSettings(req, res) {
  try {
    const updates = { ...req.body };
    if (updates.smtp) {
      const current = await getSettings();
      if (!updates.smtp.pass?.trim()) {
        updates.smtp = { ...updates.smtp, pass: current.smtp?.pass || '' };
      }
    }
    const settings = await updateSettings(updates);
    const smtp = getSmtpConfig(settings);
    const { pass: _pass, ...smtpPublic } = smtp;
    res.json({
      success: true,
      data: {
        ...settings,
        smtp: { ...smtpPublic, hasPassword: Boolean(settings.smtp?.pass) },
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function testSmtp(req, res) {
  try {
    const { to } = req.body;
    if (!to?.trim()) {
      return res.status(400).json({ success: false, message: 'יש להזין כתובת מייל לבדיקה' });
    }
    await verifySmtpConnection();
    await sendTestEmail(to.trim());
    res.json({ success: true, message: `מייל בדיקה נשלח ל-${to}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
