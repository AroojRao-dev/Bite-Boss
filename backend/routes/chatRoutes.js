import express from "express";
import Product from "../models/Product.js";
import Table from "../models/tableModel.js";
import Reservation from "../models/reservationModels.js";
import Delivery from "../models/Delivery.js";

const router = express.Router();

const learnedWords = {
  coke: "coca-cola", "coca cola": "coca-cola", surprise: "sprite",
  dew: "mountain dew", piza: "pizza", barger: "burger",
  tabel: "table", tabels: "tables", resrvation: "reservation",
  delivry: "delivery", dilievery: "delivery",
};

const normalize = (text) => {
  let t = text.toLowerCase().trim();
  for (const [key, val] of Object.entries(learnedWords))
    t = t.replace(new RegExp(`\\b${key}\\b`, "gi"), val);
  return t.replace(/\s+/g, " ");
};

const detectLang = (text) => {
  const urduHints = ["kya","kitna","kitni","karo","hai","hain","dikhao","chahiye","mujhe","mein","ka","ki","ko","hon","hn","kitney","batao","bata","koi","nahi","abhi","wala","walay"];
  return urduHints.filter((w) => text.toLowerCase().includes(w)).length >= 2 ? "ur" : "en";
};

const badge = (ok) => (ok ? "✅" : "❌");

const getCategory = (name) => {
  const n = normalize(name);
  if (n.includes("pizza")) return "🍕 Pizza";
  if (n.includes("burger")) return "🍔 Burgers";
  if (["cola","sprite","dew","drink","lassi","juice","water","coffee","tea","chai"].some((k) => n.includes(k))) return "🥤 Drinks";
  if (["halwa","pori","nashta","paratha","nihari","karahi","biryani","rice","pulao"].some((k) => n.includes(k))) return "🍽️ Desi Items";
  if (["cake","dessert","brownie","pastry","sweet"].some((k) => n.includes(k))) return "🍰 Desserts";
  return "🍽️ Other";
};

const parseOrder = (msg, products) => {
  const parts = msg.split(/,|\s+and\s+|\s+or\s+|\s+aur\s+/gi);
  const order = [];
  for (const part of parts) {
    const match = part.trim().match(/^(\d+)?\s*(.+)$/);
    if (!match) continue;
    const qty = parseInt(match[1]) || 1;
    const query = normalize(match[2].trim());
    const product = products.find((p) => normalize(p.name) === query || normalize(p.name).includes(query) || query.includes(normalize(p.name)));
    if (product) order.push({ product, qty });
  }
  return order;
};

const hasAny = (msg, keywords) => keywords.some((k) => msg.includes(k));

const NUMBER_MAP = { "1": "menu dikhao", "2": "table book karna hai", "3": "delivery", "4": "order status", "5": "birthday" };

const TABLE_KEYWORDS    = ["table","seat","jagah","baithna","baith","tables","kitney table","mez"];
const BOOKING_KEYWORDS  = ["reservation","book","reserve","booking","reserve karo","book karo","jagah book","seat book"];
const DELIVERY_KEYWORDS = ["delivery","deliver","ghar","home deliver","order deliver","ghar bhejo","deliver karo","home delivery"];
const ORDER_KEYWORDS    = ["order status","mera order","my order","order kahan","order track","order dekho"];
const SPECIAL_KEYWORDS  = ["birthday","anniversary","special","decoration","event","dawat","party","celebration"];
const MENU_KEYWORDS     = ["menu","items","kya kya","kya hai","list","sab kuch","show menu","dikhao","tamam","poora"];
const BEST_KEYWORDS     = ["best","top","recommend","popular","famous","sab se acha","zayada sale","most ordered"];
const THANKS_KEYWORDS   = ["shukriya","thanks","thank you","jazakallah","mehrbani","theek hai shukriya"];
const GREETING_RE       = /^(hello|hi|hey|salam|assalam|assalamualaikum|helo|hii|aoa|walaikum)/;

router.post("/", async (req, res) => {
  try {
    const raw = req.body?.message;
    if (!raw) return res.json({ reply: "Message required." });

    // Number shortcut — "1" ko "menu dikhao" mein convert karo
    const trimmedRaw = raw.trim();
    const mappedMsg = NUMBER_MAP[trimmedRaw] || raw;

    const msg  = normalize(mappedMsg);
    const lang = detectLang(msg);

    const [products, tables, reservations, deliveries] = await Promise.all([
      Product.find(), Table.find({ isActive: true }),
      Reservation.find({ status: "active" }), Delivery.find(),
    ]);

    const availableProducts = products.filter((p) => p.available);

    // ── 1. GREETING ─────────────────────────────────────────
    if (GREETING_RE.test(msg)) {
      return res.json({
        reply:
          "Assalam o Alaikum! 🍽️ BiteBoss mein khush aamdeed!\n\n" +
          "Number likhein:\n\n" +
          "1️⃣  Menu dekhna\n" +
          "2️⃣  Table booking\n" +
          "3️⃣  Delivery info\n" +
          "4️⃣  Order status\n" +
          "5️⃣  Special event arrange karna\n\n" +
          "Ya seedha sawaal poochhein 😊",
      });
    }

    // ── 2. THANKS ────────────────────────────────────────────
    if (hasAny(msg, THANKS_KEYWORDS)) {
      return res.json({ reply: "Khushi hui aapki madad karke! 😊\nKoi aur sawaal ho to zaroor poochhein. Apka din mubarak ho! 🌟" });
    }

    // ── 3. SPECIAL / EVENT ───────────────────────────────────
    if (hasAny(msg, SPECIAL_KEYWORDS)) {
      return res.json({
        reply:
          "🎉 Special Occasion ke liye hum tayaar hain!\n\n" +
          "Hum arrange kar saktay hain:\n" +
          "• 🎂 Birthday decoration\n" +
          "• 💐 Anniversary setup\n" +
          "• 🎊 Private event / dawat\n" +
          "• 🎁 Surprise arrangements\n\n" +
          "📞 Call karein: 0300-0000000\n" +
          "📩 Ya website par Contact form bhar dein.\n\n" +
          "Hum aapka special din yaadgar bana denge! ✨",
      });
    }

    // ── 4. TABLE STATUS ──────────────────────────────────────
    if (hasAny(msg, TABLE_KEYWORDS) && !hasAny(msg, BOOKING_KEYWORDS)) {
      if (tables.length === 0) return res.json({ reply: "Abhi koi table registered nahi hai. Admin se contact karein.\n📞 0300-0000000" });
      const bookedNums = new Set(reservations.map((r) => r.table?.tableNumber));
      const freeTables = tables.filter((t) => !bookedNums.has(t.tableNumber));
      const busyTables = tables.filter((t) => bookedNums.has(t.tableNumber));
      let reply = `🪑 Tables Status (Total: ${tables.length})\n\n`;
      if (freeTables.length > 0) {
        reply += `✅ Available (${freeTables.length}):\n`;
        freeTables.forEach((t) => (reply += `• Table ${t.tableNumber} — ${t.seats} seats${t.label ? ` (${t.label})` : ""}\n`));
      } else {
        reply += "❌ Abhi koi table available nahi hai.\n";
      }
      if (busyTables.length > 0) {
        reply += `\n🔴 Booked (${busyTables.length}):\n`;
        busyTables.forEach((t) => {
          const r = reservations.find((rv) => rv.table?.tableNumber === t.tableNumber);
          reply += `• Table ${t.tableNumber} — ${t.seats} seats${t.label ? ` (${t.label})` : ""}`;
          if (r) reply += ` → ${r.user?.name || "Guest"} | ${r.table?.date} ${r.table?.time}`;
          reply += "\n";
        });
      }
      if (freeTables.length > 0) reply += `\nReservation ke liye likhein: "2" ya "table book karna hai" 📅`;
      return res.json({ reply });
    }

    // ── 5. RESERVATION INFO ──────────────────────────────────
    if (hasAny(msg, BOOKING_KEYWORDS)) {
      const bookedNums = new Set(reservations.map((r) => r.table?.tableNumber));
      const freeTables = tables.filter((t) => !bookedNums.has(t.tableNumber));
      if (freeTables.length === 0) {
        return res.json({ reply: "😔 Abhi koi table available nahi hai reservation ke liye.\n\nKuch der baad try karein ya call karein:\n📞 0300-0000000" });
      }
      let reply = `📅 Table Reservation\n\n✅ ${freeTables.length} tables available hain abhi:\n`;
      freeTables.forEach((t) => (reply += `• Table ${t.tableNumber} — ${t.seats} seats${t.label ? ` (${t.label})` : ""}\n`));
      reply += "\nReservation ke liye:\n🌐 Website par Tables section mein jayein\n📞 Ya call karein: 0300-0000000\n\nApna naam, date, time batayein! 😊";
      return res.json({ reply });
    }

    // ── 6. DELIVERY INFO ─────────────────────────────────────
    if (hasAny(msg, DELIVERY_KEYWORDS)) {
      const pending    = deliveries.filter((d) => d.status === "Pending").length;
      const delivered  = deliveries.filter((d) => d.status === "Delivered").length;
      const processing = deliveries.filter((d) => d.status === "Processing").length;
      return res.json({
        reply:
          `🚚 Delivery Information\n\n` +
          `📦 Pending Orders: ${pending}\n` +
          `⚙️  Processing: ${processing}\n` +
          `✅ Delivered: ${delivered}\n\n` +
          `Delivery order karne ke liye:\n` +
          `🌐 Website → Order Now section\n` +
          `📞 Call: 0300-0000000\n\n` +
          `🛵 Delivery charge aur time area ke mutabiq vary karta hai.`,
      });
    }

    // ── 7. ORDER STATUS ──────────────────────────────────────
    if (hasAny(msg, ORDER_KEYWORDS)) {
      return res.json({
        reply:
          "🧾 Order Track Karne Ke Liye:\n\n" +
          "1️⃣ Website par apne account mein login karein\n" +
          "2️⃣ 'My Orders' section mein jayein\n" +
          "3️⃣ Apna latest order status dekhein\n\n" +
          "📞 Direct bhi call kar saktay hain: 0300-0000000\n" +
          "Order ID ready rakhein! 📋",
      });
    }

    // ── 8. FULL MENU (numbered list) ─────────────────────────
    if (hasAny(msg, MENU_KEYWORDS)) {
      if (availableProducts.length === 0) return res.json({ reply: "Filhal koi item available nahi hai." });
      const grouped = {};
      for (const p of availableProducts) {
        const cat = getCategory(p.name);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
      }
      let reply = "📋 BiteBoss Full Menu:\n\n";
      let counter = 1;
      for (const [cat, items] of Object.entries(grouped)) {
        reply += `${cat}\n`;
        items.forEach((i) => {
          reply += `${counter}. ${i.name} — Rs.${i.price}\n`;
          counter++;
        });
        reply += "\n";
      }
      reply += "Kisi bhi item ka number ya naam likh kar price/order poochhein! 😊";
      return res.json({ reply });
    }

    // ── 9. CATEGORY MENU ─────────────────────────────────────
    const categoryMap = {
      pizza:   { icon: "🍕", label: "Pizza" },
      burger:  { icon: "🍔", label: "Burger" },
      drink:   { icon: "🥤", label: "Drinks" },
      coffee:  { icon: "☕", label: "Coffee" },
      chai:    { icon: "☕", label: "Chai" },
      cake:    { icon: "🍰", label: "Desserts" },
      dessert: { icon: "🍰", label: "Desserts" },
      nashta:  { icon: "🍳", label: "Nashta" },
      biryani: { icon: "🍛", label: "Biryani" },
      karahi:  { icon: "🍛", label: "Karahi" },
      paratha: { icon: "🫓", label: "Paratha" },
    };

    for (const [key, { icon, label }] of Object.entries(categoryMap)) {
      if (msg.includes(key) && !msg.match(/\d/)) {
        const items = products.filter(
          (p) => normalize(p.name).includes(key) || normalize(p.category || "").includes(key) || getCategory(p.name).toLowerCase().includes(label.toLowerCase())
        );
        if (items.length === 0) return res.json({ reply: `Abhi ${label} available nahi hai.\n\nPoora menu ke liye "1" likhein` });
        let counter = 1;
        let reply = `${icon} ${label} Menu:\n\n`;
        items.forEach((i) => {
          reply += `${counter}. ${badge(i.available)} ${i.name} — Rs.${i.price}${!i.available ? " (Unavailable)" : ""}\n`;
          counter++;
        });
        return res.json({ reply });
      }
    }

    // ── 10. BEST ITEM ────────────────────────────────────────
    if (hasAny(msg, BEST_KEYWORDS)) {
      if (!availableProducts.length) return res.json({ reply: "Abhi koi item available nahi hai." });
      const top = [...availableProducts].sort((a, b) => b.price - a.price)[0];
      return res.json({
        reply:
          `🔥 Hamara Best Pick:\n\n` +
          `${top.name}\n` +
          `💰 Price: Rs.${top.price}\n` +
          `${top.description ? `📝 ${top.description}\n` : ""}` +
          `\nKitne chahiye? e.g. "2 ${top.name}" 😋`,
      });
    }

    // ── 11. MULTI-ITEM ORDER ─────────────────────────────────
    const orderItems = parseOrder(msg, products);
    if (orderItems.length > 1) {
      let reply = "🧾 Order Summary:\n\n";
      let total = 0;
      const unavail = [];
      for (const { product, qty } of orderItems) {
        if (!product.available) { unavail.push(product.name); continue; }
        const sub = product.price * qty;
        reply += `${qty} × ${product.name} = Rs.${sub}\n`;
        total += sub;
      }
      if (unavail.length) reply += `\n⚠️ Unavailable: ${unavail.join(", ")}`;
      reply += `\n💰 Grand Total: Rs.${total}`;
      return res.json({ reply });
    }

    // ── 12. SINGLE ITEM + QUANTITY ───────────────────────────
    const qtyMatch = msg.match(/^(\d+)\s+(.+)$/);
    if (qtyMatch) {
      const qty   = parseInt(qtyMatch[1]);
      const query = normalize(qtyMatch[2].trim());
      const found = products.find((p) => normalize(p.name).includes(query) || query.includes(normalize(p.name)));
      if (found) {
        if (!found.available) return res.json({ reply: `❌ ${found.name} abhi available nahi hai. Koi aur item try karein!` });
        return res.json({ reply: `🧾 Order:\n\n${qty} × ${found.name} = Rs.${found.price * qty}\n\n💰 Total: Rs.${found.price * qty}` });
      }
    }

    // ── 13. SINGLE ITEM LOOKUP ───────────────────────────────
    let foundItem = products.find((p) => msg.includes(normalize(p.name)));
    if (!foundItem) {
      for (const [alias, canonical] of Object.entries(learnedWords)) {
        if (msg.includes(alias)) {
          const f = products.find((p) => normalize(p.name) === canonical);
          if (f) { foundItem = f; break; }
        }
      }
    }
    if (foundItem) {
      if (!foundItem.available) {
        const suggestions = availableProducts.slice(0, 3).map((p) => p.name).join(", ");
        return res.json({ reply: `❌ ${foundItem.name} abhi available nahi hai.\n\nYeh try karein: ${suggestions}` });
      }
      return res.json({
        reply:
          `✅ ${foundItem.name} available hai!\n` +
          `💰 Price: Rs.${foundItem.price}\n` +
          `${foundItem.description ? `📝 ${foundItem.description}\n` : ""}` +
          `\nKitne chahiye? e.g. "2 ${foundItem.name}"`,
      });
    }

    // ── 14. GENERIC PRICE QUERY ──────────────────────────────
    if (["price","kitna","kitni","cost","rate","dam","daam","mehnga","sasta"].some((k) => msg.includes(k))) {
      const suggestions = availableProducts.slice(0, 5).map((p) => `• ${p.name} — Rs.${p.price}`).join("\n");
      return res.json({ reply: `Kaunse item ki price chahiye? 🤔\n\nKuch popular items:\n${suggestions}\n\nPoora menu ke liye "1" likhein` });
    }

    // ── 15. FALLBACK ─────────────────────────────────────────
    return res.json({
      reply:
        `Maaf kijiye, samajh nahi aaya. 🙏\n\n` +
        `Number likhein:\n` +
        `1️⃣  Menu\n` +
        `2️⃣  Table booking\n` +
        `3️⃣  Delivery\n` +
        `4️⃣  Order status\n` +
        `5️⃣  Special event\n\n` +
        `Ya seedha sawaal likhein jaise:\n` +
        `• "Sprite ki price"\n` +
        `• "2 Zinger Burger ka total"`,
    });

  } catch (err) {
    console.error("Chat route error:", err);
    return res.json({ reply: "Server error. Dobara try karein. 🙏" });
  }
});

export default router;