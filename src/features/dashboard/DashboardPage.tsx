import CommonPageTitle from "@/components/ui/CommonPageTitle";

import { GET_DASHBOARD_STATS } from "@/graphql/resident";
import { responsiveColumn4 } from "@/utils/constant";
import { useQuery } from "@apollo/client";
import { PageContainer } from "@ant-design/pro-layout";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import GroupsIcon from "@mui/icons-material/Groups";
import HouseIcon from "@mui/icons-material/House";
import { Col, Row } from "antd";
import dynamic from "next/dynamic";
import SummaryCard from "./widgets/SummaryCards";

const MainLayout = dynamic(() => import("../../components/layout/Layout"), {
	ssr: false,
});

export default function Home() {
	const { data, loading } = useQuery(GET_DASHBOARD_STATS);
	const stats = data?.dashboardStats?.stats;

	return (
		<MainLayout>
			<PageContainer title={<CommonPageTitle title="Dashboard" />}>
				<Row gutter={[8, 16]}>
					<Col {...responsiveColumn4}>
						<SummaryCard
							title="Total Household"
							total={loading ? 0 : stats?.totalHouseholds ?? 0}
							icon={<HouseIcon />}
						/>
					</Col>
					<Col {...responsiveColumn4}>
						<SummaryCard
							title="Total Population"
							total={loading ? 0 : stats?.totalPopulation ?? 0}
							icon={<GroupsIcon />}
						/>
					</Col>
					<Col {...responsiveColumn4}>
						<SummaryCard
							title="Total Families"
							total={loading ? 0 : stats?.totalFamilies ?? 0}
							icon={<FamilyRestroomIcon />}
						/>
					</Col>
				</Row>
			</PageContainer>
		</MainLayout>
	);
}
