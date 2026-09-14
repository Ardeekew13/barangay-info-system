import { Avatar, Button, Dropdown, Layout, Space, Tag, Typography } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { signOut, useSession } from "next-auth/react";

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
	const { data: session } = useSession();
	const user = session?.user as any;

	const handleLogout = () => {
		signOut({ callbackUrl: "/login" });
	};

	return (
		<Header
			style={{
				background: "#fff",
				padding: "0 24px",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				borderBottom: "1px solid #f0f0f0",
				boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
			}}
		>
			<h2 style={{ margin: 0, fontSize: 16, color: "#1E3A8A" }}>
				Barangay Zamora Information System
			</h2>

			{user && (
				<Dropdown
					menu={{
						items: [
							{
								key: "info",
								label: (
									<div style={{ padding: "4px 0" }}>
										<div><Text strong>{user.name}</Text></div>
										<div><Text type="secondary" style={{ fontSize: 12 }}>@{user.username}</Text></div>
									</div>
								),
								disabled: true,
							},
							{ type: "divider" },
							{
								key: "logout",
								label: "Sign Out",
								icon: <LogoutOutlined />,
								danger: true,
								onClick: handleLogout,
							},
						],
					}}
					placement="bottomRight"
					arrow
				>
					<Space style={{ cursor: "pointer" }}>
						<Avatar
							size={34}
							icon={<UserOutlined />}
							style={{ backgroundColor: "#1E3A8A" }}
						/>
						<div style={{ lineHeight: 1.3 }}>
							<Text strong style={{ fontSize: 13, display: "block" }}>
								{user.name}
							</Text>
							<Tag
								color={user.role === "admin" ? "gold" : user.role === "encoder" ? "blue" : "default"}
								style={{ fontSize: 10, lineHeight: "16px", padding: "0 5px", margin: 0 }}
							>
								{user.role}
							</Tag>
						</div>
					</Space>
				</Dropdown>
			)}
		</Header>
	);
};

export default AppHeader;

