const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Create email transporter using Gmail
const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password (not your regular Gmail password)
  },
});

// POST /api/auth/forgot-password
// Body: { email }
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success even if user not found (security best practice)
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a code has been sent' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in database
    await prisma.passwordReset.upsert({
      where: { email },
      update: { otp, expiresAt, used: false },
      create: { email, otp, expiresAt, used: false },
    });

    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Strumly" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Strumly Password Reset Code',
      html: `
        <div style="font-family:'DM Sans',Arial,sans-serif;background:#18181b;color:#fff;padding:40px;border-radius:12px;max-width:480px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:36px;letter-spacing:0.2em;color:#fff;margin:0;font-family:Arial,sans-serif;">STRUMLY</h1>
            <p style="color:#a1a1aa;font-size:14px;margin-top:8px;">Password Reset</p>
          </div>
          <div style="background:#27272a;border:1px solid #3f3f46;border-radius:12px;padding:32px;text-align:center;">
            <p style="color:#a1a1aa;font-size:14px;margin-bottom:16px;">Your verification code is:</p>
            <div style="font-size:48px;font-weight:bold;letter-spacing:12px;color:#fbbf24;font-family:monospace;margin:16px 0;">${otp}</div>
            <p style="color:#71717a;font-size:12px;margin-top:16px;">This code expires in <strong style="color:#fff;">15 minutes</strong></p>
          </div>
          <p style="color:#52525b;font-size:12px;text-align:center;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email. Check server email config.' });
  }
};

// POST /api/auth/verify-otp
// Body: { email, otp }
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and code are required' });

    const record = await prisma.passwordReset.findUnique({ where: { email } });

    if (!record) return res.status(400).json({ success: false, message: 'No reset request found. Please request a new code.' });
    if (record.used) return res.status(400).json({ success: false, message: 'This code has already been used.' });
    if (new Date() > record.expiresAt) return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });

    // Mark as verified (but not used yet — used after password reset)
    await prisma.passwordReset.update({ where: { email }, data: { verified: true } });

    res.json({ success: true, message: 'Code verified successfully' });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password
// Body: { email, otp, newPassword }
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'All fields required' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const record = await prisma.passwordReset.findUnique({ where: { email } });

    if (!record || record.used) return res.status(400).json({ success: false, message: 'Invalid or expired reset request' });
    if (new Date() > record.expiresAt) return res.status(400).json({ success: false, message: 'Code expired. Request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid code' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and mark OTP as used
    await Promise.all([
      prisma.user.update({ where: { email }, data: { password: hashedPassword } }),
      prisma.passwordReset.update({ where: { email }, data: { used: true } }),
    ]);

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { forgotPassword, verifyOTP, resetPassword };
