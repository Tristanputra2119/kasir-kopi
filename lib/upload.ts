// lib/upload.ts
import { IncomingForm } from "formidable";
import { mkdirSync } from "fs";

// pastikan folder ada
mkdirSync("./public/uploads", { recursive: true });

export const parseForm = async (req: any): Promise<any> => {
  const form = new IncomingForm({
    uploadDir: "./public/uploads",
    keepExtensions: true,
    multiples: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export const config = {
  api: {
    bodyParser: false,
  },
};
