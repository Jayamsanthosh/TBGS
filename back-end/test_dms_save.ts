import { connectDB, getPool } from "./src/config/db";
import { saveDocumentService } from "./src/services/dms.services";
import dotenv from "dotenv";
dotenv.config();

const testSave = async () => {
  await connectDB();
  try {
    const res = await saveDocumentService({
      LINK_PAGES_ID: 1,
      PAGE_REF_NO: "TEST",
      FILE_NAME: "test.txt",
      CONTENT_TYPE: "text/plain",
      CONTENT_DATA: Buffer.from("Hello World").toString("base64"),
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit();
};

testSave();
