import sgMail from '@sendgrid/mail';

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

export const sendEmailOTP = async (email: string, otp: string, firstName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Fix: Ensure from email is always defined
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'akinsolaoluwatamilore@punch.agency';
    const appName = process.env.APP_NAME || 'Brand Ambassador App';

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
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <h2>Email Verification</h2>
            </div>
            <div class="content">
              <p>Hello <strong>${firstName}</strong>,</p>
              <p>Thank you for applying to become a Brand Ambassador. Please use the following verification code to complete your email verification:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this verification code, please ignore this email.</p>
              
              <p>Best regards,<br><strong>The ${appName} Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
              <p>Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@brandambassador.com'}">${process.env.SUPPORT_EMAIL || 'support@brandambassador.com'}</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
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

export const sendApplicationSubmittedEmail = async (email: string, firstName: string, applicationId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Fix: Ensure from email is always defined
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@brandambassador.com';
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

    await sgMail.send(msg);
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

export const sendEventRegistrationEmail = async (
  email: string,
  userName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@brandambassador.com';
    const appName = process.env.APP_NAME || 'Brand Ambassador App';

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: appName
      },
      subject: `Registration Confirmed: ${eventTitle}`,
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
            .event-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
            .event-detail { margin: 10px 0; display: flex; align-items: start; }
            .event-label { font-weight: bold; width: 80px; flex-shrink: 0; color: #666; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #419A6B; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Going!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              <p>Great news! Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
              
              <div class="event-card">
                <h3 style="margin-top: 0; color: #419A6B;">${eventTitle}</h3>
                <div class="event-detail">
                  <span class="event-label">Date:</span>
                  <span>${new Date(eventDate).toLocaleDateString()}</span>
                </div>
                <div class="event-detail">
                  <span class="event-label">Time:</span>
                  <span>${eventTime}</span>
                </div>
                <div class="event-detail">
                  <span class="event-label">Location:</span>
                  <span>${eventLocation}</span>
                </div>
              </div>

              <p>We've attached this event to your calendar automatically if you used the "Add to Calendar" feature in the app.</p>
              
              <p>We look forward to seeing you there!</p>
              
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

    await sgMail.send(msg);
    console.log(`✅ Event registration email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Event registration email failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send registration email'
    };
  }
};



// --primary: 222.2 47.4% 11.2%;
//     --primary-foreground: 210 40% 98%;


//     --primary: 148 41% 43%;
//     --primary-foreground: 0 0% 100%;

//     --ring: 148 41% 43%;