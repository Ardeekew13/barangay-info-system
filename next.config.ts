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
]);

const nextConfig: NextConfig = {
	transpilePackages: [
		"@ant-design/pro-components",
		"@ant-design/icons",
		"@rc-component/util",
	],
	reactStrictMode: true,
};

export default withTM(nextConfig);
