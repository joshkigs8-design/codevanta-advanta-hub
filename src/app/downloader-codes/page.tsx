import { Metadata } from "next";
import DownloaderClient from "./DownloaderClient";

export const metadata: Metadata = {
  title: "Android TV & Fire TV Downloader Codes — CodeVanta Hub",
  description:
    "Curated collection of verified AFTVnews Downloader short codes for Android TV, Google TV, and Amazon Firestick streaming devices.",
};

export default function DownloaderPage() {
  return <DownloaderClient />;
}

