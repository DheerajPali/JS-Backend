import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    //check what's inside the file
    console.log("Multer is getting this file ", file);
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

export const upload = multer({
  storage,
});
