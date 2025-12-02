import crypto from 'crypto';
import OTP from '../models/OTP';

export const generateOTP = (length: number = 4): string => {
  // Cryptographically secure OTP generation
  const buffer = crypto.randomBytes(length);
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = buffer[i] % digits.length;
    otp += digits[randomIndex];
  }
  
  return otp;
};

export const createOTP = async (userId: string, type: 'phone' | 'email'): Promise<{otp: string; error?: string}> => {
  try {
    const otp = generateOTP(parseInt(process.env.OTP_LENGTH || '4'));
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10'));

    // Invalidate previous OTPs for this user and type
    await OTP.updateMany(
      { userId, type, verified: false },
      { $set: { verified: true } }
    );

    // Create new OTP
    await OTP.create({
      userId,
      type,
      otp,
      expiresAt,
      attempts: 0,
      verified: false
    });

    return { otp };
  } catch (error: any) {
    console.error('❌ OTP creation failed:', error);
    return { 
      otp: '', 
      error: error.message || 'Failed to create OTP' 
    };
  }
};

export const verifyOTP = async (userId: string, type: 'phone' | 'email', otp: string): Promise<{success: boolean; error?: string}> => {
  try {
    const otpRecord = await OTP.findOne({
      userId,
      type,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return { 
        success: false, 
        error: 'Invalid or expired OTP' 
      };
    }

    // Increment attempts
    otpRecord.attempts += 1;
    
    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return { success: true };
  } catch (error: any) {
    console.error('❌ OTP verification failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to verify OTP' 
    };
  }
};

export const canResendOTP = async (userId: string, type: 'phone' | 'email'): Promise<{canResend: boolean; waitTime?: number}> => {
  try {
    const recentOTP = await OTP.findOne({
      userId,
      type,
      createdAt: { $gt: new Date(Date.now() - 1 * 60 * 1000) } // 1 minute ago
    });

    if (recentOTP) {
      const waitTime = Math.ceil((recentOTP.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return { 
        canResend: false, 
        waitTime: Math.max(0, waitTime) 
      };
    }

    return { canResend: true };
  } catch (error) {
    console.error('❌ OTP resend check failed:', error);
    return { canResend: true }; // Default to allowing resend on error
  }
};