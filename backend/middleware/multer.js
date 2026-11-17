import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

/* =====================================================
   MAGIC BYTES DETECTOR
   Browser mimetype pe bharosa mat karo — actual file
   bytes se format detect karo
===================================================== */

const detectRealMime = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";

  // WEBP: RIFF????WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return "image/webp";

  // AVIF / HEIC / HEIF: ftyp box — bytes 4-7 = "ftyp"
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const brand = buffer.slice(8, 12).toString("ascii");
    if (["avif", "avis"].includes(brand)) return "image/avif";
    if (["heic", "heix", "mif1", "msf1"].includes(brand)) return "image/heic";
    return "image/avif"; // default ftyp = treat as avif
  }

  return null;
};

/* =====================================================
   FILE FILTER
===================================================== */

const fileFilter = (req, file, cb) => {
  cb(null, true); // sab allow karo — real check buffer mein hogi
};

/* =====================================================
   MEMORY STORAGE
===================================================== */

const storage = multer.memoryStorage();

/* =====================================================
   CLOUDINARY UPLOAD
===================================================== */

export const uploadToCloudinary = (buffer, folder = "restaurant-tables") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(buffer);
  });
};

/* =====================================================
   MULTER INSTANCE
===================================================== */

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* =====================================================
   SAFE UPLOAD MIDDLEWARE
   - Server crash nahi hoga
   - Magic bytes se real format verify karta hai
   - Allowed: JPEG, PNG, WEBP, AVIF, HEIC
===================================================== */

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic"];

export const safeUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: "File 10MB se badi hai. Choti image upload karein.",
        LIMIT_UNEXPECTED_FILE: `"${fieldName}" field use karein.`,
      };
      return res.status(400).json({
        success: false,
        message: messages[err.code] || `Upload error: ${err.message}`,
      });
    }

    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Agar file hai to magic bytes se verify karo
    if (req.file && req.file.buffer) {
      const realMime = detectRealMime(req.file.buffer);

      if (realMime) {
        req.file.mimetype = realMime; // sahi mimetype set karo
      }

      const mimeToCheck = realMime || req.file.mimetype;

      if (!ALLOWED_MIMES.includes(mimeToCheck)) {
        return res.status(400).json({
          success: false,
          message: `Sirf JPG, PNG, WEBP ya AVIF images allowed hain. Detected: ${mimeToCheck}`,
        });
      }
    }

    next();
  });
};

export default upload;