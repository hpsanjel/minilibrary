/** @type {import('next').NextConfig} */

const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "i.etsystatic.com",
			},
			{
				protocol: "https",
				hostname: "www.thebookdesigner.com",
			},
			{
				protocol: "https",
				hostname: "checkout.norli.no",
			},
			{
				protocol: "https",
				hostname: "s26162.pcdn.co",
			},
			{
				protocol: "https",
				hostname: "encrypted-tbn0.gstatic.com",
			},
			{
				protocol: "https",
				hostname: "marketplace.canva.com",
			},
			{
				protocol: "https",
				hostname: "images.cdn.europe-west1.gcp.commercetools.com",
			},
		],
	},
};

export default nextConfig;
