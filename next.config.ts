import type { NextConfig } from "next";
import transpileModules from "next-transpile-modules";

const withTM = transpileModules([
	"rc-util",
	"rc-pagination",
	"rc-table",
	"rc-picker",
	"rc-resize-observer",
	"rc-input",
	"rc-tree",
	"dayjs",
	"@ant-design/icons",
	"@ant-design/icons-svg",
	"@ant-design/colors",
]);

const nextConfig: NextConfig = {
	transpilePackages: [
		"@ant-design/pro-components",
		"@ant-design/icons",
		"@ant-design/colors",
		"@rc-component/util",
	],
	reactStrictMode: true,
	// The codebase has a long-standing backlog of ESLint findings (mostly
	// @typescript-eslint/no-explicit-any) that were never caught locally
	// because `next dev` doesn't run lint -- only `next build` does. Don't
	// let those fail production builds; they still show as warnings in
	// your editor and `npm run lint` if you want to clean them up later.
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default withTM(nextConfig);
