import { Layout } from "antd";
import React from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";

const { Content } = Layout;

interface Props {
	children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
	const router = useRouter();
	const hideSidebar = router.pathname.startsWith("/manage");

	return (
		<Layout style={{ minHeight: "100vh" }}>
			{!hideSidebar && <Sidebar />}
			<Layout>
				<Content style={{ margin: "12px" }}>
					<div>{children}</div>
				</Content>
			</Layout>
		</Layout>
	);
};

export default MainLayout;
