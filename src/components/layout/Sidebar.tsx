import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import WorkIcon from "@mui/icons-material/Work";
import HistoryIcon from "@mui/icons-material/History";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { Layout, Menu, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useLayoutEffect, useState } from "react";
import brgyLogo from "../../assets/brgy-logo.png";

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar: React.FC = () => {
	const router = useRouter();
	const { data: session } = useSession();
	const role = (session?.user as any)?.role;
	const [collapsed, setCollapsed] = useState(false);
	const [screenWidth, setScreenWidth] = useState(0);

	const sidebarMenuItems = [
		{
			key: "home",
			label: "Home",
			icon: <DashboardIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
			href: "/",
		},
		{
			key: "resident",
			label: "Resident List",
			icon: <GroupIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
			href: "/resident-list",
		},
		{
			key: "household",
			label: "Household List",
			icon: <HomeWorkIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
			href: "/household-list",
		},
		{
			key: "sitio",
			label: "Sitio List",
			icon: <LocationOnIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
			href: "/sitio-list",
		},
		{
			key: "occupation",
			label: "Occupation List",
			icon: <WorkIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
			href: "/occupation-list",
		},
		{
			key: "barangay-officials",
			label: "Barangay Officials",
			icon: <GroupIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
			href: "/barangay-officials",
		},
		{
			key: "reports",
			label: "Reports & Data",
			icon: <DescriptionIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
			href: "/reports",
		},
		...(role === "admin"
			? [
					{
						key: "manage-accounts",
						label: "Manage Accounts",
						icon: <ManageAccountsIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
						href: "/manage-accounts",
					},
					{
						key: "login-audit",
						label: "Login Activity",
						icon: <HistoryIcon sx={{ fontSize: 18, width: 18, height: 18 }} />,
						href: "/login-audit",
					},
				]
			: []),
	];

	const activeKey = sidebarMenuItems.find(
		(item) => router.pathname === item.href
	)?.key;

	useLayoutEffect(() => {
		const handleResize = () => {
			setScreenWidth(window.innerWidth);
		};

		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<Sider
			breakpoint="lg"
			collapsible
			collapsedWidth={`${screenWidth > 480 ? 80 : 0}`}
			width={250}
			collapsed={collapsed}
			onCollapse={setCollapsed}
		>
			<div
				style={{
					color: "#fff",
					padding: 16,
					textAlign: "center",
					display: "flex",
					alignItems: "center",
				}}
			>
				<Image
					src={brgyLogo}
					alt="Barangay Zamora Logo"
					width={collapsed ? 50 : 70}
				/>
				{!collapsed && (
					<Title
						level={5}
						style={{ color: "#fff", marginTop: 8, marginLeft: 6 }}
					>
						Barangay Zamora
					</Title>
				)}
			</div>
			<Menu
				theme="dark"
				mode="inline"
				selectedKeys={activeKey ? [activeKey] : []}
				items={sidebarMenuItems.map((item) => ({
					key: item.key,
					icon: item.icon,
					label: <Link href={item.href}>{item.label}</Link>,
				}))}
			/>
		</Sider>
	);
};

export default Sidebar;
