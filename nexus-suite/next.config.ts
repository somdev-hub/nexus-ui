import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    // image config
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'plus.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ipfs.filebase.io',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.ipfs.filebase.io',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ipfs.io',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'gateway.ipfs.io',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'cloudflare-ipfs.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
