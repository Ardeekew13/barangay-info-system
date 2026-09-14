import MainLayout from "@/components/layout/Layout";
import CommonPageTitle from "@/components/ui/CommonPageTitle";

import { useDialog } from "@/hooks/useDialog";
import { useDrawer } from "@/hooks/useDrawer";
import { Household, Members } from "@/interfaces";
import { FilterOutlined, UndoOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-layout";
import { Button, App, Space, Tabs } from "antd";
import { useCallback, useMemo, useState } from "react";
import HouseholdTable from "./components/householdTable";
import { useQuery } from "@apollo/client";
import { GET_HOUSEHOLDS } from "@/graphql/household";
import AddHouseholdModal from "./components/addHouseholdModal";

const HouseholdListPage = () => {
	const addHousehold = useDialog(AddHouseholdModal);
	const [households, setHouseholds] = useState<Household[]>([]);
	const { message } = App.useApp();
	const [filters, setFilters] = useState({});
	const residentFilterDrawer = useDrawer();

	// GraphQL Query
	const {
		data,
		loading: householdLoading,
		refetch,
	} = useQuery<any>(GET_HOUSEHOLDS, {
		onCompleted: (data) => {
			if (data?.households?.success) {
				setHouseholds(data?.households?.households);
			}
		},
		onError: (error) => {
			message.error("Failed to load households");
		},
	});

	//QUERY
	const refetchHouseholds = useCallback(async () => {
		const result = await refetch();
	}, [refetch]);

	const onResetFilter = () => {
		setFilters({});
		refetchHouseholds();
	};

	const handleAddHouseholdModal = useCallback(
		(record?: Household) => {
			addHousehold(
				{ record, fetchHouseholds: refetchHouseholds },
				(result: string) => {
					if (result) {
						message.success(result);
						refetchHouseholds();
					}
				},
			);
		},
		[addHousehold, message, refetchHouseholds],
	);

	const tableProps = useMemo(
		() => ({
			households: households,
			householdLoading,
			handleAddHouseholdModal,
			fetchHouseholds: refetchHouseholds,
		}),
		[households, householdLoading, handleAddHouseholdModal, refetchHouseholds],
	);

	return (
		<MainLayout>
			<PageContainer
				title={<CommonPageTitle title="Household List" />}
				extra={[
					<Button type="primary" onClick={() => handleAddHouseholdModal()}>
						Add Households
					</Button>,
				]}
			>
				<Tabs
					defaultActiveKey="householdList"
					items={[
						{
							label: "Household",
							key: "householdList",
							children: <HouseholdTable {...tableProps} />,
						},
					]}
					size="small"
					tabBarExtraContent={
						<Space>
							<Button
								icon={<UndoOutlined />}
								shape="round"
								style={{
									marginBottom: 10,
								}}
								//   onClick={onResetFilter}
								danger
							>
								Reset
							</Button>
							<Button
								icon={<FilterOutlined />}
								shape="round"
								style={{ marginBottom: 10 }}
								/*  onClick={() => {
                                    residentFilterDrawer.openDrawer(
                                        filters,
                                        (selectedFilters) => {
                                            if (selectedFilters) {
                                                setFilters(selectedFilters);
                                                fetchResidentsWithFilters(selectedFilters); // custom function
                                            }
                                        }
                                    );
                                }} */
							>
								Filter
							</Button>
						</Space>
					}
				/>
			</PageContainer>
			{/* <ResidentFilterDrawer
				open={residentFilterDrawer.visible}
				onClose={() => residentFilterDrawer.closeDrawer()}
				onSubmit={residentFilterDrawer.closeDrawer}
				initialFilters={residentFilterDrawer.data}
			/> */}
		</MainLayout>
	);
};

export default HouseholdListPage;
