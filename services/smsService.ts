import twilio from 'twilio';

// Get environment variables with validation
const getTwilioConfig = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error('Twilio configuration is incomplete. Please check your environment variables.');
  }

  return { accountSid, authToken, phoneNumber };
};

// Initialize Twilio client
const { accountSid, authToken, phoneNumber } = getTwilioConfig();
console.log(accountSid,authToken,phoneNumber, 'creds')
const client = twilio(accountSid, authToken);

// Verify Twilio configuration
export const verifyTwilioConfig = async (): Promise<{success: boolean; error?: string}> => {
  try {
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`✅ Twilio configured for account: ${account.friendlyName}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Twilio configuration error:', error);
    return { 
      success: false, 
      error: 'Twilio configuration failed. Please check your credentials.' 
    };
  }
};

export const sendSMSOTP = async (phone: string, otp: string): Promise<{success: boolean; error?: string}> => {
  try {
    // Validate phone number format
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      return { 
        success: false, 
        error: 'Invalid phone number format' 
      };
    }

    const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

    const message = await client.messages.create({
      body: `Your ${process.env.APP_NAME || 'Brand Ambassador'} verification code is: ${otp}. This code expires in 10 minutes.`,
      from: phoneNumber,
      to: formattedPhone,
    });

    console.log(`✅ SMS OTP sent to ${formattedPhone}, Message SID: ${message.sid}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ SMS sending failed:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      return { 
        success: false, 
        error: 'Invalid phone number format' 
      };
    } else if (error.code === 21408) {
      return { 
        success: false, 
        error: 'Phone number is not authorized to receive SMS' 
      };
    } else if (error.code === 21610) {
      return { 
        success: false, 
        error: 'Phone number cannot receive SMS messages' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to send SMS' 
    };
  }
};

export const sendApplicationSubmittedSMS = async (phone: string, firstName: string): Promise<{success: boolean; error?: string}> => {
  try {
    const cleanedPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

    const message = await client.messages.create({
      body: `Hi ${firstName}! Your Brand Ambassador application has been submitted successfully and is under review. We'll contact you within 3-5 business days.`,
      from: phoneNumber,
      to: formattedPhone,
    });

    console.log(`✅ Application confirmation SMS sent to ${formattedPhone}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Application confirmation SMS failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send confirmation SMS' 
    };
  }
};