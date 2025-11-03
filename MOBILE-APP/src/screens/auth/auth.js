const express = require('express');
const router = express.Router();
const { supabase } = require('../../lib/supabase');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure nodemailer
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Store verification codes temporarily (use Redis in production)
const verificationCodes = new Map();

// Generate random 4-digit code
const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// FORGOT PASSWORD - Send code via email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in mobile_users table
    const { data: mobileUser, error: userError } = await supabase
      .from('mobile_users')
      .select('id, email, first_name')
      .eq('email', email)
      .single();

    if (userError || !mobileUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in memory
    verificationCodes.set(email, {
      code,
      expiresAt,
      attempts: 0
    });

    // Send email with code
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${mobileUser.first_name},</p>
          <p>You requested to reset your password. Use the verification code below:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; color: #333; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`Password reset code sent to ${email}: ${code}`);

    res.json({ 
      success: true, 
      message: 'Verification code sent to your email' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// VERIFY CODE
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    // Check if code has expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Check if too many attempts
    if (storedData.attempts >= 5) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts++;
      verificationCodes.set(email, storedData);
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code is valid - generate a reset token for the next step
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store reset token
    verificationCodes.set(email, {
      ...storedData,
      resetToken,
      tokenExpires,
      verified: true
    });

    // Clean up the code after successful verification
    setTimeout(() => {
      if (verificationCodes.get(email)?.code === code) {
        verificationCodes.delete(email);
      }
    }, 60000);

    res.json({ 
      success: true, 
      message: 'Code verified successfully',
      resetToken 
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData || !storedData.verified || storedData.resetToken !== resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token has expired
    if (new Date() > storedData.tokenExpires) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Update password in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      // You'll need to get the user's auth ID first
      await getAuthIdByEmail(email),
      { password: newPassword }
    );

    if (authError) {
      console.error('Supabase password update error:', authError);
      return res.status(400).json({ error: 'Failed to update password' });
    }

    // Clean up
    verificationCodes.delete(email);

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Helper function to get auth ID by email
async function getAuthIdByEmail(email) {
  const { data: mobileUser } = await supabase
    .from('mobile_users')
    .select('auth_uid')
    .eq('email', email)
    .single();

  return mobileUser?.auth_uid;
}

module.exports = router;