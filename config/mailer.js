import nodemailer from "nodemailer";
import { google } from "googleapis";

const confiramtionEmail = async (data, otp) => {
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI;
  const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return new Promise(async (resolve, reject) => {
    const accessToken = await oAuth2Client.getAccessToken((err, token) => {
      if (err) {
        return;
      } else {
        return token;
      }
    });
    const transporter = await nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const html = ({ otp, email }) => {
      // Insert invisible space into domains and email address to prevent both the
      // email address and the domain from being turned into a hyperlink by email
      // clients like Outlook and Apple mail, as this is confusing because it seems
      // like they are supposed to click on their email address to sign in.
      const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;

      // Some simple styling options
      const backgroundColor = "#f9f9f9";
      const textColor = "#444444";
      const mainBackgroundColor = "#ffffff";
      const buttonBackgroundColor = "#346df1";
      const buttonBorderColor = "#346df1";
      const buttonTextColor = "#ffffff";

      // Uses tables for layout and inline CSS due to email client limitations
      return `
    <body style="background: ${backgroundColor};">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td align="center" style="padding: 10px 0px 20px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
          
          </td>
        </tr>
      </table>
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            Hello, <strong>${escapedEmail}</strong> </br> Please Complete your Email Verification.
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}">${otp}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
    `;
    };

    const email = data?.firstName + " " + data?.lastName;
    const message = {
      from: "Bhojan56@noreply <bhojan56official@gmail.com>",
      to: data?.email,
      subject: "Bhojan56 - Activate Your Account",
      html: html({ otp, email }),
    };

    transporter.sendMail(message, function (err, info) {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

module.exports = { confiramtionEmail };
