"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tv,
  Copy,
  Check,
  ExternalLink,
  Download,
  Search,
  ShieldCheck,
  Lock,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Layers,
  Zap,
} from "lucide-react";

interface DownloaderCode {
  code: string;
  name: string;
  category: string;
  description: string;
  targetUrl: string;
  tags: string[];
  versionNote?: string;
}

const DOWNLOADER_CODES: DownloaderCode[] = [
  // 1. Media & Video Players
  {
    code: "6505538",
    name: "VLC Media Player for Android TV",
    category: "Media & Video Players",
    description: "The premier open-source multimedia player that plays all video/audio formats, network streams, discs, and IPTV M3U playlists with full hardware decoding.",
    targetUrl: "https://get.videolan.org/vlc-android/",
    tags: ["VLC", "Open Source", "M3U Playlist", "Hardware Decoding", "Essential"],
    versionNote: "Official VideoLAN Android TV APK (Alt: 40336)",
  },
  {
    code: "8628413",
    name: "Kodi 21.3 Omega (Latest Stable)",
    category: "Media & Video Players",
    description: "The world's most popular open-source home theater software for organizing and streaming local files, network shares, and community media add-ons.",
    targetUrl: "https://kodi.tv/download/android/",
    tags: ["Kodi", "Home Theater", "Add-ons", "Omega 21", "4K HDR"],
    versionNote: "Official XBMC Foundation Kodi 21 Omega 32-bit/64-bit",
  },
  {
    code: "691447",
    name: "Kodi 19.5 Matrix (Legacy Stability)",
    category: "Media & Video Players",
    description: "Ultra-stable legacy release of Kodi recommended for older Firesticks and legacy Android TV boxes with maximum community add-on compatibility.",
    targetUrl: "https://mirrors.kodi.tv/releases/android/",
    tags: ["Kodi", "Matrix 19.5", "Legacy", "Low-RAM Devices"],
    versionNote: "Kodi Matrix v19.5 Stable Release",
  },
  {
    code: "132954",
    name: "MX Player (Standard Edition)",
    category: "Media & Video Players",
    description: "Powerful video player with advanced multi-core hardware decoding, subtitle gestures, audio boost, and local network streaming.",
    targetUrl: "https://sites.google.com/site/mxvpen/",
    tags: ["MX Player", "Multi-core HW", "Subtitles", "Media Player"],
    versionNote: "Official MX Player for Android TV",
  },
  {
    code: "28474",
    name: "MX Player Pro (Ad-Free Edition)",
    category: "Media & Video Players",
    description: "Clean ad-free premium edition of MX Player optimized for TV remote navigation with custom AC3/DTS audio codec support.",
    targetUrl: "https://troypoint.com/mx",
    tags: ["MX Pro", "Ad-Free", "DTS/AC3 Codecs", "Fire TV"],
    versionNote: "Ad-free MX Player Pro build (Alt: 9400991)",
  },
  {
    code: "54562",
    name: "Nova Video Player (Open Source)",
    category: "Media & Video Players",
    description: "Open-source video player designed specifically for Android TV and Firestick with automatic movie/TV show metadata scraping, poster art, and audio passthrough.",
    targetUrl: "https://github.com/nova-video-player/aos-AVP/releases",
    tags: ["Nova", "Open Source", "Scraper", "Poster Wall", "ExoPlayer"],
    versionNote: "GitHub release with Android TV Leanback interface",
  },
  {
    code: "87140",
    name: "Just Player (ExoPlayer & HDR Passthrough)",
    category: "Media & Video Players",
    description: "Ultra-minimalist, lightweight media player built on AndroidX Media3 / ExoPlayer supporting HDR10+, Dolby Vision, and lossless audio passthrough.",
    targetUrl: "https://github.com/moneytoo/Player/releases",
    tags: ["Just Player", "HDR10+", "Dolby Vision", "Zero Bloat", "GitHub"],
    versionNote: "Clean AndroidX Media3 release",
  },
  {
    code: "71893",
    name: "Stremio for Android TV",
    category: "Media & Video Players",
    description: "Modern media aggregation platform with seamless catalog indexing, torrent streaming support, Trakt syncing, and community add-on integration.",
    targetUrl: "https://www.stremio.com/downloads",
    tags: ["Stremio", "Catalog", "Trakt", "Add-ons", "Torrent Streaming"],
    versionNote: "Official Stremio Android TV APK",
  },
  {
    code: "7987405",
    name: "Reezn APK (v2)",
    category: "Media & Video Players",
    description: "Third-party lightweight Android TV media player providing streaming links and curated entertainment collections.",
    targetUrl: "https://github.com/bedevlab/rdownload/releases/download/update/Reezn.apk",
    tags: ["Android TV", "Firestick", "Streaming", "APK Direct"],
    versionNote: "Direct APK download via GitHub Releases",
  },
  {
    code: "1109875",
    name: "Nuvio TV Player",
    category: "Media & Video Players",
    description: "Clean open-source TV media interface with in-app automatic updater for high-performance video streaming on big screens.",
    targetUrl: "https://github.com/tapframe/NuvioTV/releases/download/0.4.18-beta/app-universal-release.apk",
    tags: ["Open Source", "Universal APK", "GitHub", "Smart TV"],
    versionNote: "v0.4.18-beta with built-in in-app updater",
  },

  // 2. YouTube & Video Clients
  {
    code: "28544",
    name: "SmartTube Stable (No Ads)",
    category: "YouTube & Video Clients",
    description: "The gold standard YouTube client for Android TV & Firestick with built-in ad-blocking, SponsorBlock integration, and up to 4K 60FPS AV1 video playback.",
    targetUrl: "https://github.com/yuliskov/SmartTube/releases",
    tags: ["SmartTube", "No Ads", "SponsorBlock", "4K 60FPS", "Essential"],
    versionNote: "Official SmartTube Stable APK",
  },
  {
    code: "79015",
    name: "SmartTube Beta (Bleeding Edge)",
    category: "YouTube & Video Clients",
    description: "Pre-release build of SmartTube receiving frequent updates, experimental codec upgrades, and the earliest bug fixes.",
    targetUrl: "https://github.com/yuliskov/SmartTube/releases",
    tags: ["SmartTube", "Beta", "Early Access", "AV1 Codec"],
    versionNote: "SmartTube Beta Release Channel",
  },
  {
    code: "67451",
    name: "NewPipe for Android TV",
    category: "YouTube & Video Clients",
    description: "Lightweight privacy-first YouTube streaming client that requires zero Google Play Services or account sign-in with background audio playback.",
    targetUrl: "https://newpipe.net/#download",
    tags: ["NewPipe", "Privacy", "No Google Services", "Lightweight"],
    versionNote: "Official NewPipe release mirror",
  },

  // 3. IPTV & Live TV
  {
    code: "272483",
    name: "TiviMate IPTV Player (v4.7)",
    category: "IPTV & Live TV",
    description: "Widely regarded as the cleanest, most responsive modern EPG TV guide and IPTV player available for Android TV and Fire TV.",
    targetUrl: "https://www.tivimate.com",
    tags: ["TiviMate", "Best EPG", "Multi-Screen", "Catchup", "Essential"],
    versionNote: "Official TiviMate APK (Alt: 34745, 4244746)",
  },
  {
    code: "78522",
    name: "IPTV Smarters Pro",
    category: "IPTV & Live TV",
    description: "Feature-rich IPTV player supporting Xtream Codes API, M3U playlists, multi-screen viewing, recording, and parental controls.",
    targetUrl: "https://www.iptvsmarters.com",
    tags: ["IPTV Smarters", "Xtream Codes", "M3U", "Multi-Screen"],
    versionNote: "IPTV Smarters Pro v3+ (Alt: 6468112, 47719)",
  },
  {
    code: "537992",
    name: "XCIPTV Player",
    category: "IPTV & Live TV",
    description: "Fully customizable OTT IPTV player equipped with built-in ExoPlayer and VLC Player backends, EPG support, and catchup TV.",
    targetUrl: "https://xcip.tv",
    tags: ["XCIPTV", "Dual Player", "VLC Backend", "Xtream API"],
    versionNote: "Official XCIPTV Player build",
  },
  {
    code: "29742",
    name: "OTT Navigator IPTV",
    category: "IPTV & Live TV",
    description: "Advanced IPTV player supporting multiple playlist providers, channel grouping, studio icons, archive replay, and picture-in-picture mode.",
    targetUrl: "https://ott-navigator.com",
    tags: ["OTT Navigator", "PiP", "Archive", "Multiple Providers"],
    versionNote: "Latest OTT Navigator Android TV APK",
  },
  {
    code: "58129",
    name: "Televizo IPTV Player",
    category: "IPTV & Live TV",
    description: "Neat, straightforward IPTV player with support for M3U and Xtream-Codes, subtitles, audio track selection, and parental control locks.",
    targetUrl: "https://televizo.net",
    tags: ["Televizo", "M3U", "Subtitles", "Clean UI"],
    versionNote: "Televizo Stable Release",
  },
  {
    code: "1135305",
    name: "Live NetTV",
    category: "IPTV & Live TV",
    description: "Access hundreds of live international television channels organized by categories like Sports, News, Entertainment, and Documentaries.",
    targetUrl: "https://livenettv.to",
    tags: ["Live NetTV", "International TV", "Live Sports", "Free TV"],
    versionNote: "Official Live NetTV release (Alt: 70320)",
  },
  {
    code: "76714",
    name: "Rapid Streamz",
    category: "IPTV & Live TV",
    description: "Popular live sports and TV streaming platform with dedicated daily match schedules, football leagues, and multiple stream mirrors.",
    targetUrl: "https://rapidstreamz.live",
    tags: ["Rapid Streamz", "Football", "Live Matches", "Sports"],
    versionNote: "Official Rapid Streamz build (Alt: 3142094)",
  },
  {
    code: "9096336",
    name: "SportsFire",
    category: "IPTV & Live TV",
    description: "Free live sports streaming application curated specifically for Firestick and Android TV devices with simple remote controls.",
    targetUrl: "https://sportsfire.tv",
    tags: ["SportsFire", "Live Sports", "HD Streams", "Firestick"],
    versionNote: "SportsFire Android TV APK (Alt: 8204342)",
  },
  {
    code: "1288595",
    name: "Cricfy TV",
    category: "IPTV & Live TV",
    description: "Live cricket, football, and international sports broadcasting utility tailored for high-speed streaming on big screen devices.",
    targetUrl: "https://cricfytv.com",
    tags: ["Cricfy", "Cricket", "Live Events", "Fast Mirror"],
    versionNote: "Official Cricfy TV mirror (Alt: 6281845)",
  },
  {
    code: "6629250",
    name: "StreamFire",
    category: "IPTV & Live TV",
    description: "Fast TV streaming app offering live sports and television channels with low buffering on low-spec Firesticks.",
    targetUrl: "https://streamfire.tv",
    tags: ["StreamFire", "Live TV", "Low Buffering", "Lightweight"],
    versionNote: "StreamFire TV Release",
  },

  // 4. Movies & VOD
  {
    code: "61586",
    name: "Cinema HD (v2.4.0)",
    category: "Movies & VOD",
    description: "Veteran on-demand movie and TV series aggregator supporting Real-Debrid, Premiumize, and Trakt.tv account integration.",
    targetUrl: "https://cinemahdapkapp.com",
    tags: ["Cinema HD", "Real-Debrid", "Trakt", "VOD", "Movies"],
    versionNote: "Standard Cinema HD v2.4.0 build",
  },
  {
    code: "68302",
    name: "Cinema HD (Ad-Free Mod)",
    category: "Movies & VOD",
    description: "Modded version of Cinema HD with advertisements, analytics, and telemetry completely removed for smooth navigation.",
    targetUrl: "https://troypoint.com/cinema-ad-free",
    tags: ["Cinema HD", "Ad-Free", "Debrid Ready", "Clean Mod"],
    versionNote: "Community ad-free release",
  },
  {
    code: "46061",
    name: "FilmPlus",
    category: "Movies & VOD",
    description: "Modern fork of Terrarium TV with active link scrapers, real-debrid premium hosters, and rapid link resolution.",
    targetUrl: "https://filmplus.app",
    tags: ["FilmPlus", "Terrarium Fork", "Real-Debrid", "Fast Scraping"],
    versionNote: "Official FilmPlus APK",
  },
  {
    code: "7895071",
    name: "BeeTV",
    category: "Movies & VOD",
    description: "Extensive video-on-demand search engine for searching and playing top releases with multiple video player support.",
    targetUrl: "https://beetv.net",
    tags: ["BeeTV", "Search Engine", "Debrid Support", "VOD"],
    versionNote: "Official BeeTV build (Alt: 95419)",
  },
  {
    code: "2434497",
    name: "OnStream for Android TV",
    category: "Movies & VOD",
    description: "Sleek, high-definition streaming interface with instant 1-click playback, auto-next episode, and subtitle integration.",
    targetUrl: "https://onstream.to",
    tags: ["OnStream", "1-Click Play", "Auto Next", "Subtitles"],
    versionNote: "OnStream Android TV APK",
  },
  {
    code: "1447489",
    name: "TeaTV",
    category: "Movies & VOD",
    description: "Classic VOD streaming hub featuring comprehensive 1080p and 4K link scrapers and external subtitle downloads.",
    targetUrl: "https://teatv.net",
    tags: ["TeaTV", "1080p/4K", "Subtitles", "TV Shows"],
    versionNote: "Official TeaTV Release",
  },
  {
    code: "37812",
    name: "CyberFlix TV",
    category: "Movies & VOD",
    description: "Reliable Terrarium TV clone with customized resolvers and reliable multi-source video extraction.",
    targetUrl: "https://cyberflix.me",
    tags: ["CyberFlix", "Terrarium", "Resolvers", "Debrid"],
    versionNote: "CyberFlix TV APK mirror",
  },
  {
    code: "82147",
    name: "Viva TV",
    category: "Movies & VOD",
    description: "Minimalist video streaming application with Trakt watchlist syncing and Debrid premium provider support.",
    targetUrl: "https://vivatv.io",
    tags: ["Viva TV", "Trakt", "Real-Debrid", "Minimalist"],
    versionNote: "Viva TV Official APK",
  },
  {
    code: "49102",
    name: "Ocean Streamz",
    category: "Movies & VOD",
    description: "All-in-one streaming app featuring movies, television series, live TV channels, and anime in a unified interface.",
    targetUrl: "https://oceanstreamz.com",
    tags: ["Ocean Streamz", "Anime", "Movies", "Live TV"],
    versionNote: "Ocean Streamz APK Release",
  },

  // 5. Toolbox & App Directory
  {
    code: "250931",
    name: "TROYPOINT Toolbox (Master Hub)",
    category: "Toolbox & App Directory",
    description: "The gold standard Fire TV and Android TV setup toolbox with one-click access to curated players, browsers, launchers, and VPN utilities.",
    targetUrl: "https://troypoint.com/troypoint-toolbox/",
    tags: ["Toolbox", "AIO Directory", "Essential", "Firestick", "TROYPOINT"],
    versionNote: "Official TROYPOINT streaming hub",
  },
  {
    code: "990781",
    name: "DownloaderCodes Mega Toolbox",
    category: "Toolbox & App Directory",
    description: "Extensive community toolbox repository containing utility tools, custom launchers, ad-blockers, and maintenance apps for TV OS.",
    targetUrl: "https://downloadercodes.com/toolbox/",
    tags: ["Mega Directory", "Launchers", "Maintenance", "Tools", "Universal"],
    versionNote: "Universal Android TV / Google TV repository",
  },
  {
    code: "6985536",
    name: "SK TECH Store",
    category: "Toolbox & App Directory",
    description: "Popular Android TV utility hub and alternative installer for streaming apps, system tools, and video players.",
    targetUrl: "https://downloadsktech.pages.dev/download",
    tags: ["Cloudflare Pages", "App Store", "Tools", "Fire TV"],
    versionNote: "Hosted on Cloudflare Pages mirror",
  },
  {
    code: "234753",
    name: "Unlinked App",
    category: "Toolbox & App Directory",
    description: "Alternative decentralized app store client. Enter community library codes (like 55555555 or 44444444) to browse hundreds of curated apps.",
    targetUrl: "https://unlinked.link",
    tags: ["Unlinked", "Decentralized", "Library Codes", "App Store"],
    versionNote: "Official Unlinked APK Client",
  },
  {
    code: "10001",
    name: "FileSynced",
    category: "Toolbox & App Directory",
    description: "Code-based sideloading platform allowing developers and communities to bundle and distribute custom app stores.",
    targetUrl: "https://filesynced.com",
    tags: ["FileSynced", "Custom Codes", "App Bundles", "Sideload"],
    versionNote: "FileSynced Official Distribution",
  },
  {
    code: "55512",
    name: "AppLinked",
    category: "Toolbox & App Directory",
    description: "Fast code-driven installer for downloading APK packages directly to your TV device with automated installation.",
    targetUrl: "https://applinked.store",
    tags: ["AppLinked", "Installer", "Direct Download", "TV OS"],
    versionNote: "AppLinked Universal TV APK",
  },

  // 6. App Stores & Markets
  {
    code: "545293",
    name: "Aptoide TV",
    category: "App Stores & Markets",
    description: "The largest independent open-source app store designed specifically for Android TV, Fire TV, and set-top boxes with remote optimization.",
    targetUrl: "https://aptoide.com/en/aptoide-tv",
    tags: ["Aptoide TV", "Independent Market", "Remote Optimized", "Essential"],
    versionNote: "Official Aptoide TV APK (Alt: 76518)",
  },
  {
    code: "631082",
    name: "Aurora Store",
    category: "App Stores & Markets",
    description: "Open-source Google Play Store client allowing you to download Play Store apps anonymously without a Google account.",
    targetUrl: "https://auroraoss.com",
    tags: ["Aurora Store", "Play Store Client", "Anonymous", "FOSS"],
    versionNote: "Aurora Store v4+ Android TV Release",
  },
  {
    code: "88219",
    name: "F-Droid for TV",
    category: "App Stores & Markets",
    description: "Official catalogue of FOSS (Free and Open Source Software) applications built for the Android platform with remote-friendly layout.",
    targetUrl: "https://f-droid.org",
    tags: ["F-Droid", "Open Source", "FOSS", "Safe Software"],
    versionNote: "F-Droid TV Client APK",
  },
  {
    code: "285544",
    name: "Nebula Manager (Anker / ATV Channel)",
    category: "App Stores & Markets",
    description: "Official Android TV channel shortcut tool developed for Android TV & projectors to manage sideloaded apps and home screen channel banners.",
    targetUrl: "https://nebula-manager.en.aptoide.com/?store_name=catappult&app_id=61078189",
    tags: ["App Manager", "Home Screen", "Aptoide", "Nebula/Anker"],
    versionNote: "Verified Aptoide App ID 61078189 (com.zhixin.atvchannel)",
  },

  // 7. TV Launchers & Home Screen
  {
    code: "28907",
    name: "Projectivy Launcher",
    category: "TV Launchers & Home Screen",
    description: "Highly acclaimed ad-free alternative launcher for Android TV and Google TV with custom wallpapers, remote shortcuts, and zero promotional clutter.",
    targetUrl: "https://github.com/spocky/mimir/releases",
    tags: ["Projectivy", "No Ads", "Custom Wallpapers", "Google TV", "Essential"],
    versionNote: "Projectivy Launcher latest stable (Alt: 7415375, 3352208)",
  },
  {
    code: "39201",
    name: "FLauncher",
    category: "TV Launchers & Home Screen",
    description: "Lightweight, open-source Flutter-based launcher for Android TV that gives you complete control over your home screen categories.",
    targetUrl: "https://gitlab.com/flauncher/flauncher",
    tags: ["FLauncher", "Flutter", "Open Source", "Clean Interface"],
    versionNote: "FLauncher Open Source Build",
  },
  {
    code: "71239",
    name: "Wolf Launcher",
    category: "TV Launchers & Home Screen",
    description: "Classic customizable Firestick launcher allowing custom wallpaper backdrops, app folder grouping, and hidden widgets.",
    targetUrl: "https://troypoint.com/wolf",
    tags: ["Wolf Launcher", "Folders", "Custom UI", "Firestick"],
    versionNote: "Wolf Launcher v0.1.9 Stable",
  },
  {
    code: "61903",
    name: "ATV Launcher Pro",
    category: "TV Launchers & Home Screen",
    description: "Fast, simple launcher offering tile layout customization, color schemes, and password-protected app folders.",
    targetUrl: "https://atvlauncher.com",
    tags: ["ATV Launcher", "Tile UI", "Protected Folders", "Speed"],
    versionNote: "ATV Launcher Pro edition",
  },

  // 8. Utilities & Tools
  {
    code: "44863",
    name: "X-plore File Manager",
    category: "Utilities & Tools",
    description: "Dual-pane file manager with built-in Wi-Fi sharing, cloud storage manager (Google Drive, Dropbox, OneDrive), and ZIP extraction.",
    targetUrl: "https://www.lonelycatgames.com/apps/xplore",
    tags: ["X-plore", "File Manager", "Cloud Storage", "Wi-Fi Server", "Essential"],
    versionNote: "Official Lonely Cat Games APK",
  },
  {
    code: "51408",
    name: "Send Files to TV (SFTV)",
    category: "Utilities & Tools",
    description: "Wirelessly transfer APKs, movies, audio, and documents between your smartphone, PC, and TV over your local Wi-Fi in seconds.",
    targetUrl: "https://sendfilestotv.app",
    tags: ["SFTV", "Wireless Transfer", "Phone to TV", "Instant File Share"],
    versionNote: "Send Files to TV Universal Client",
  },
  {
    code: "5385366",
    name: "Background Apps & Process List",
    category: "Utilities & Tools",
    description: "Crucial performance booster that detects and forces closed memory-hogging background applications to eliminate Firestick lag.",
    targetUrl: "https://troypoint.com/kill-background",
    tags: ["Task Killer", "Speed Boost", "RAM Saver", "Lag Fix", "Essential"],
    versionNote: "Verified Process Cleaner Build",
  },
  {
    code: "33479",
    name: "DefSquid Security & Cleaner",
    category: "Utilities & Tools",
    description: "Comprehensive security, malware scanner, speed test, and device storage cleaner designed for Fire OS and Android TV.",
    targetUrl: "https://defsquid.com",
    tags: ["DefSquid", "Malware Scan", "Cache Cleaner", "Security"],
    versionNote: "Official DefSquid Security APK",
  },
  {
    code: "71735",
    name: "Analiti Speed Test & WiFi Analyzer",
    category: "Utilities & Tools",
    description: "Professional-grade network testing tool providing accurate Wi-Fi signal analysis, buffer bloat testing, and speed benchmarks.",
    targetUrl: "https://analiti.com",
    tags: ["Analiti", "Speed Test", "Wi-Fi Signal", "Buffer Bloat"],
    versionNote: "Official Analiti Speed Test APK",
  },
  {
    code: "19823",
    name: "Fast Task Killer",
    category: "Utilities & Tools",
    description: "1-click memory optimization tool that flushes unused cache memory to maximize streaming buffer performance.",
    targetUrl: "https://troypoint.com/fast-task-killer",
    tags: ["1-Click Cleaner", "RAM Flush", "Optimization", "Speed"],
    versionNote: "Fast Task Killer Standalone",
  },
  {
    code: "25680",
    name: "Mouse Toggle for Fire TV",
    category: "Utilities & Tools",
    description: "Adds a virtual mouse pointer to your standard Firestick remote so you can click buttons on non-TV touchscreen apps.",
    targetUrl: "https://troypoint.com/mouse",
    tags: ["Mouse Toggle", "Virtual Mouse", "Touchscreen APKs", "Firestick"],
    versionNote: "Mouse Toggle v1.11 for Fire TV",
  },

  // 9. Web Browsers
  {
    code: "9953686",
    name: "TV Bro Browser",
    category: "Web Browsers",
    description: "The best open-source web browser built strictly for TV remotes with built-in ad-blocker, download manager, and tabs.",
    targetUrl: "https://github.com/truefedex/tv-bro/releases",
    tags: ["TV Bro", "Open Source", "Adblock", "Tabs", "Essential"],
    versionNote: "TV Bro GitHub Release",
  },
  {
    code: "87412",
    name: "JioPages TV Browser",
    category: "Web Browsers",
    description: "Fast web browser featuring a dedicated TV remote navigation mode, integrated ad-blocker, and video downloader.",
    targetUrl: "https://jiopages.com",
    tags: ["JioPages", "Adblock", "Video Download", "Fast Browser"],
    versionNote: "JioPages Android TV APK",
  },

  // 10. VPN & Privacy
  {
    code: "697672",
    name: "IPVanish VPN",
    category: "VPN & Privacy",
    description: "High-speed VPN client with dedicated Fire TV remote UI to encrypt your streaming traffic and bypass ISP throttling.",
    targetUrl: "https://www.ipvanish.com/vpn-setup/fire-tv/",
    tags: ["IPVanish", "VPN", "WireGuard", "Anti-Throttling", "Essential"],
    versionNote: "Official IPVanish Firestick APK",
  },
  {
    code: "42918",
    name: "Proton VPN",
    category: "VPN & Privacy",
    description: "Renowned Swiss-based privacy VPN with a free tier offering unlimited bandwidth and strict zero-logging policy.",
    targetUrl: "https://protonvpn.com/download-android",
    tags: ["Proton VPN", "Swiss Privacy", "Free Tier", "Zero Logs"],
    versionNote: "Proton VPN Android TV Release",
  },
  {
    code: "98402",
    name: "Surfshark VPN",
    category: "VPN & Privacy",
    description: "Feature-packed VPN featuring CleanWeb ad & malware blocking and unlimited simultaneous device connections.",
    targetUrl: "https://surfshark.com/download/android-tv",
    tags: ["Surfshark", "CleanWeb", "Unlimited Devices", "Fast WireGuard"],
    versionNote: "Surfshark TV APK Mirror",
  },
  {
    code: "18945",
    name: "ExpressVPN",
    category: "VPN & Privacy",
    description: "Ultra-reliable VPN with Lightway protocol engineered for lightning-fast 4K streaming without buffering.",
    targetUrl: "https://www.expressvpn.com/vpn-software/vpn-fire-stick",
    tags: ["ExpressVPN", "Lightway", "4K Streaming", "Low Latency"],
    versionNote: "ExpressVPN Android TV Client",
  },
  {
    code: "45187",
    name: "NordVPN for Android TV",
    category: "VPN & Privacy",
    description: "Fast NordLynx (WireGuard) protocol with Threat Protection Lite to block harmful ads and malicious streaming domains.",
    targetUrl: "https://nordvpn.com/download/android-tv/",
    tags: ["NordVPN", "NordLynx", "Threat Protection", "Secure Streaming"],
    versionNote: "NordVPN Official Android TV APK",
  },
];

const CATEGORIES = [
  "All",
  "Media & Video Players",
  "YouTube & Video Clients",
  "IPTV & Live TV",
  "Movies & VOD",
  "Toolbox & App Directory",
  "App Stores & Markets",
  "TV Launchers & Home Screen",
  "Utilities & Tools",
  "Web Browsers",
  "VPN & Privacy",
];

export default function DownloaderClient() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          if (data.user.role === "member" || data.user.role === "admin") {
            setIsMember(true);
          }
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsMember(false);
      })
      .finally(() => setLoadingAuth(false));
  }, []);

  const handleCopy = (code: string, isLocked: boolean) => {
    if (isLocked) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = DOWNLOADER_CODES.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesQuery =
      !search ||
      item.code.includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Tv className="w-3.5 h-3.5 text-amber-400" />
          <span>Android TV &amp; Firestick Sideload Directory (60 Verified Codes)</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          AFTVnews <span className="shimmer-gold">Downloader Codes</span>
        </h1>
        <p className="text-sm sm:text-base text-hub-text-secondary max-w-2xl mx-auto leading-relaxed">
          Short numerical download codes for the official <strong>Downloader by AFTVnews</strong> app. 
          Enter any code on your Smart TV, Android Box, or Firestick to directly download and install APKs, media players (VLC, Kodi), streaming engines, and utility toolboxes.
        </p>

        {/* How-to banner */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 text-left max-w-3xl mx-auto mt-6 shadow-2xl">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-hub-gold mb-3 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>How to use these short codes in 3 steps</span>
          </div>
          <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed">
            <li>Install and open the free <strong className="text-white">Downloader</strong> app on your Android TV, Google TV, or Firestick.</li>
            <li>In the URL / Search input box, type the <strong className="text-hub-gold font-mono">short code</strong> (e.g. <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">6505538</span> for VLC or <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">250931</span> for Toolbox).</li>
            <li>Press <strong className="text-white">Go</strong>. Downloader redirects immediately to the verified APK or repository mirror.</li>
          </ol>
        </div>

        {/* WhatsApp Channel Callout */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-black/60 to-emerald-950/50 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 text-left max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>CodeVanta WhatsApp Channel</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Official</span>
              </h4>
              <p className="text-xs text-hub-text-secondary mt-0.5">
                Receive new APK codes, TV utilities, and verified free tier drops directly on WhatsApp.
              </p>
            </div>
          </div>
          <a
            href="https://whatsapp.com/channel/0029Vb84p6QKGGGNAp8VIB2g"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-md shrink-0 active:scale-95"
          >
            <span>Follow Channel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Paywall Banner for Non-Members / Guests */}
      {!loadingAuth && !isMember && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/70 via-black/80 to-amber-950/60 border border-amber-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs uppercase tracking-wider font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>{isAuthenticated ? "Membership Paywall" : "Guest Preview Mode"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Unlock Complete 60+ Downloader Codes Catalog
              </h3>
              <p className="text-xs sm:text-sm text-hub-text-secondary leading-relaxed">
                You are currently previewing the top sample codes for free (including VLC, Kodi, and SmartTube). Upgrade to CodeVanta Starter (KES 70), Basic, Pro, or VIP to unlock all 60 verified short codes, one-click direct mirrors, and GitHub release links.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <Link
                href="/plans"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black hover:from-amber-300 hover:to-yellow-400 shadow-gold-glow transition-all active:scale-95 uppercase tracking-wider"
              >
                <Lock className="w-4 h-4" />
                <span>Upgrade from KES 70</span>
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all active:scale-95"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-400 text-black font-bold shadow-gold-glow"
                  : "bg-white/[0.04] text-hub-text-secondary hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted" />
          <input
            type="text"
            placeholder="Search by code, app name (e.g. VLC, Kodi), or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-hub-surface border border-white/[0.1] text-sm text-hub-text-primary focus:outline-none focus:border-hub-gold transition-colors font-mono placeholder:font-sans"
          />
        </div>
      </div>

      {/* Grid of Codes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCodes.map((item, index) => {
          const isLocked = !isMember && index >= 6;
          const displayCode = isLocked ? `${item.code.slice(0, 3)}****` : item.code;

          return (
            <div
              key={item.code}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between group relative overflow-hidden glass-card-interactive card-specular-edge ${
                isLocked
                  ? "border-amber-500/30"
                  : "border-white/[0.08] hover:border-hub-gold/50"
              }`}
            >
              <div>
                {/* Top row: Code badge + Copy button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-2xl sm:text-3xl font-black tracking-wider ${
                      isLocked ? "text-amber-400/80" : "text-amber-400"
                    }`}>
                      {displayCode}
                    </span>
                    {!isLocked ? (
                      <button
                        onClick={() => handleCopy(item.code, isLocked)}
                        className={`p-2 rounded-xl transition-all ${
                          copiedCode === item.code
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/50"
                            : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08]"
                        }`}
                        title="Copy Downloader Code"
                      >
                        {copiedCode === item.code ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    ) : (
                      <span className="p-2 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-500/30" title="Locked for guests">
                        <Lock className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-hub-text-muted">
                    {item.category}
                  </span>
                </div>

                {/* Name & description */}
                <h3 className="text-base font-bold text-white group-hover:text-hub-gold transition-colors mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-hub-text-secondary leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-hub-text-muted border border-white/[0.06]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[11px] text-hub-text-muted truncate max-w-[170px] font-mono">
                  {item.versionNote || "Verified link"}
                </span>

                {isLocked ? (
                  <Link
                    href={isAuthenticated ? "/plans" : "/login"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-700/60 hover:bg-amber-900 transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>{isAuthenticated ? "Upgrade" : "Sign In"}</span>
                  </Link>
                ) : (
                  <a
                    href={`https://go.aftvnews.com/${item.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-sm active:scale-95"
                  >
                    <span>Direct Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back to Resources link */}
      <div className="text-center pt-8 border-t border-white/[0.08]">
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 text-xs font-mono text-hub-text-secondary hover:text-white transition-colors"
        >
          <span>← Browse all Developer Resources &amp; APIs</span>
        </Link>
      </div>
    </div>
  );
}
