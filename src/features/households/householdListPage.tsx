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
	const [totalCount, setTotalCount] = useState(0);
	const { message } = App.useApp();
	const [filters, setFilters] = useState({});
	const [searchTerm, setSearchTerm] = useState("");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const residentFilterDrawer = useDrawer();

	// GraphQL Query
	const {
		data,
		loading: householdLoading,
		refetch,
	} = useQuery<any>(GET_HOUSEHOLDS, {
		variables: {
			search: searchTerm || undefined,
			page,
			pageSize,
		},
		onCompleted: (data) => {
			if (data?.households?.success) {
				setHouseholds(data?.households?.households);
				setTotalCount(data?.households?.totalCount || 0);
			}
		},
		onError: (error) => {
			message.error("Failed to load households");
		},
	});

	//QUERY
	const refetchHouseholds = useCallback(async () => {
		await refetch({ search: searchTerm || undefined, page, pageSize });
	}, [refetch, searchTerm, page, pageSize]);

	const handleSearch = (value: string) => {
		setSearchTerm(value);
		setPage(1);
	};

	const handlePageChange = (nextPage: number, nextPageSize: number) => {
		setPage(nextPage);
		setPageSize(nextPageSize);
	};

	const onResetFilter = () => {
		setFilters({});
		setSearchTerm("");
		setPage(1);
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
			totalCount,
			page,
			pageSize,
			handleSearch,
			handlePageChange,
		}),
		[households, householdLoading, handleAddHouseholdModal, refetchHouseholds, totalCount, page, pageSize],
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
