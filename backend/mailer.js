import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(userEmail, summary, articles) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: '【Daily News AI】本日のニュース要約',
    text: `${summary}\n\n■ 取得元記事\n${articles.map(a => `- ${a.title} (${a.link})`).join('\n')}`,
    html: `
      <h2>本日のニュース要約</h2>
      <div>${summary.replace(/\n/g, '<br>')}</div>
      <hr>
      <h3>取得元記事</h3>
      <ul>
        ${articles.map(a => `<li><a href="${a.link}">${a.title}</a> (${a.source})</li>`).join('')}
      </ul>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${userEmail}:`, error);
    throw error;
  }
}
