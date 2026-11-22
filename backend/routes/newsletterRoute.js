
import express from "express";
import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { transporter } from "../config/mailer.js";

const router = express.Router();

/* =========================
   SUBSCRIBER SCHEMA
========================= */

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },

  subscribedAt: {
    type: Date,
    default: Date.now,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
});

const Subscriber =
  mongoose.models.Subscriber ||
  mongoose.model("Subscriber", subscriberSchema);


/* =========================
   EMAIL HTML
========================= */

const buildEmailHTML = (message) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial; background:#F8F4EE; padding:20px;">

  <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:12px;">

    <h1 style="color:#F2A83E;">🍔 Bite Boss</h1>

    <p style="font-size:15px; line-height:1.8;">
      ${message}
    </p>

    <hr />

    <p>Thank you for choosing Bite Boss.</p>

  </div>

</body>
</html>
`;


/* =========================
   SUBSCRIBE
========================= */

router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const existing = await Subscriber.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Already subscribed!",
      });
    }

    await Subscriber.create({
      email: email.trim().toLowerCase(),
    });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully!",
    });

  } catch (error) {
    console.error("Subscribe error:", error);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});


/* =========================
   GET SUBSCRIBERS
========================= */

router.get("/subscribers", async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({
      subscribedAt: -1,
    });

    const total = subscribers.length;

    const now = new Date();

    const thisMonth = subscribers.filter((s) => {
      const subDate = new Date(s.subscribedAt);

      return (
        subDate.getMonth() === now.getMonth() &&
        subDate.getFullYear() === now.getFullYear()
      );
    }).length;

    res.status(200).json({
      success: true,
      total,
      thisMonth,
      subscribers,
    });

  } catch (error) {
    console.error("Fetch subscribers error:", error);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});


/* =========================
   DELETE SUBSCRIBER
========================= */

router.delete("/subscribers/:id", async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Subscriber removed.",
    });

  } catch (error) {
    console.error("Delete subscriber error:", error);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});


/* =========================
   SEND NEWSLETTER
========================= */

router.post("/send", async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject aur message dono zaroori hain.",
      });
    }

    const subscribers = await Subscriber.find({
      isActive: true,
    });

    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Koi active subscriber nahi hai.",
      });
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      try {
        await transporter.sendMail({
          to: sub.email,
          subject,
          html: buildEmailHTML(message),
        });

        sent++;

      } catch (mailErr) {
        console.error(
          `Email fail: ${sub.email}`,
          mailErr.message
        );

        failed++;
      }
    }


    /* =========================
       CREATE OFFER NOTIFICATIONS
    ========================= */

    const users = await User.find({
      role: "user",
    });

    const notifications = users.map((user) => ({
      userId: user._id,
      type: "promo",
      icon: "gift",
      title: subject,
      message,
      read: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      message: "Newsletter processing completed!",
      sent,
      failed,
      notificationsCreated: notifications.length,
    });

  } catch (error) {
    console.error("Send newsletter error:", error);

    res.status(500).json({
      success: false,
      message: "Server error. Dobara try karein.",
    });
  }
});


export { router, Subscriber };
