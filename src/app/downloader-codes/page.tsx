import { Metadata } from "next";
import DownloaderClient from "./DownloaderClient";

export const metadata: Metadata = {
  title: "Android TV & Fire TV Downloader Codes — CodeVanta Hub",
  description:
    "Curated collection of verified AFTVnews Downloader short codes for Android TV, Google TV, and Amazon Firestick streaming devices.",
  alternates: {
    canonical: "/downloader-codes",
  },
  openGraph: {
    title: "Android TV & Fire TV Downloader Codes — CodeVanta Advanta Hub",
    description:
      "Curated collection of verified AFTVnews Downloader short codes for Android TV, Google TV, VLC, and Amazon Firestick streaming devices.",
    url: "https://www.codevanta.online/downloader-codes",
  },
};

export default function DownloaderPage() {
  return <DownloaderClient />;
}

