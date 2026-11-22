
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const transporter = {
  sendMail: async (mailOptions) => {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    const { data, error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM ||
        "Bite Boss <onboarding@resend.dev>",
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
      replyTo: mailOptions.replyTo,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data.id);

    return {
      messageId: data.id,
      response: "Email sent successfully",
    };
  },
};
