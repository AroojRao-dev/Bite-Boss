
import User from "../models/User.js";

const createAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;
    const resetPassword = process.env.RESET_ADMIN_PASSWORD === "true";

    if (!name || !email || !password) {
      console.log("Admin credentials missing in .env");
      return;
    }

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.name = name;
      existingAdmin.role = "admin";

      if (resetPassword) {
        existingAdmin.password = password;
      }

      await existingAdmin.save();

      console.log(
        resetPassword
          ? "Admin password reset successfully ✅"
          : "Admin account verified ✅"
      );

      return;
    }

    await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    console.log("Admin account created successfully ✅");

  } catch (error) {
    console.error("Admin creation error:", error.message);
  }
};

export default createAdmin;
