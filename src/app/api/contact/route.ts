import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if environment variables are set
    const senderEmail = process.env.CONTACT_SENDER_EMAIL;
    const appPassword = process.env.CONTACT_APP_PASSWORD;

    if (!senderEmail || !appPassword) {
      console.error('Missing environment variables for email configuration');
      return new Response(
        JSON.stringify({ error: 'Email configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    // Email to company (you)
    const companyMailOptions = {
      from: senderEmail,
      to: senderEmail,
      subject: 'New Contact Form Submission',
      text: `
New Inquiry from Website Contact Form

Name: ${name}
Phone: ${phone}
Email: ${email}

Message:
${message}
      `,
    };

    // Auto-reply to customer
    const customerMailOptions = {
      from: senderEmail,
      to: email,
      subject: 'We Received Your Request – Global Tech Software Solutions',
      text: `
Hi ${name},

Thank you for contacting Global Tech Software Solutions.

We have received your request regarding: ${message || 'General Inquiry'}.
Our team will contact you soon.

Regards,
Global Tech Software Solutions
      `,
    };

    try {
      // Send email to company
      await transporter.sendMail(companyMailOptions);
      
      // Send auto-reply to customer
      await transporter.sendMail(customerMailOptions);

      return new Response(
        JSON.stringify({ message: 'Emails sent successfully!' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send emails. Please try again later.' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}