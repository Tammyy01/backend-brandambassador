import sgMail, { MailDataRequired } from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Verify email configuration on startup
try {
  console.log('✅ SendGrid email service configured successfully');
} catch (error) {
  console.error('❌ Email service configuration error:', error);
  throw new Error('Email service configuration failed');
}

export const sendEmailOTP = async (email: string, otp: string, firstName: string): Promise<{success: boolean; error?: string}> => {
  try {
    // Fix: Ensure from email is always defined
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const appName = process.env.APP_NAME;

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: appName
      },
      subject: 'Your Ambassador Application Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { background: #ffffff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border: 2px dashed #667eea; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="otp-code">${otp}</div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg as MailDataRequired);
    console.log(`✅ Email OTP sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
};

export const sendApplicationSubmittedEmail = async (email: string, firstName: string, applicationId: string): Promise<{success: boolean; error?: string}> => {
  try {
    // Fix: Ensure from email is always defined
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const appName = process.env.APP_NAME || 'Brand Ambassador App';

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: appName
      },
      subject: 'Ambassador Application Submitted Successfully',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #419A6B 0%, #2E8B57 100%); padding: 30px; text-align: center; color: white; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { text-align: center; font-size: 48px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <h2>Application Submitted</h2>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <p>Hello <strong>${firstName}</strong>,</p>
              <p>Your Brand Ambassador application has been <strong>successfully submitted</strong> and is now under review!</p>
              
              <p><strong>Application ID:</strong> ${applicationId}</p>
              <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
              
              <p>Our team will review your application and get back to you within 3-5 business days. You'll be notified via email once a decision has been made.</p>
              
              <p>Thank you for your interest in representing ${appName}!</p>
              
              <p>Best regards,<br><strong>The ${appName} Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg as MailDataRequired);
    console.log(`✅ Application confirmation sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Application confirmation email failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send confirmation email' 
    };
  }
};



// --primary: 222.2 47.4% 11.2%;
//     --primary-foreground: 210 40% 98%;


//     --primary: 148 41% 43%;
//     --primary-foreground: 0 0% 100%;

//     --ring: 148 41% 43%;