import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                hostname: "placehold.co",
                protocol: "https",
            },
            {
                hostname: "mcjk.cc",
                protocol: "https",
            },
        ],
        dangerouslyAllowSVG: true,
    },
};

export default nextConfig;
