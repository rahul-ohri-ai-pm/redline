import type { Metadata } from "next";
import { UploadPreview } from "./UploadPreview";

export const metadata: Metadata = {
  title: "Add a document - Redline",
};

export default function NewDocumentPage() {
  return <UploadPreview />;
}
