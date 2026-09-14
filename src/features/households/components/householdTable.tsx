import { Household } from "@/interfaces";
import { Button, Input, Popconfirm, Space, Table, App } from "antd";
import { TableProps } from "antd/lib";
import { useMutation } from "@apollo/client";
import { DELETE_HOUSEHOLD } from "@/graphql/household";

interface IProps {
	households: Household[];
	householdLoading: boolean;
	handleAddHouseholdModal: (record?: Household) => void;
	fetchHouseholds: () => void;
}

function HouseholdTable(props: IProps) {
	const {
		households,
		householdLoading,
		handleAddHouseholdModal,
		fetchHouseholds,
	} = props;
	const { message } = App.useApp();

	// GraphQL Mutation
	const [deleteHousehold] = useMutation<any>(DELETE_HOUSEHOLD, {
		onCompleted: (data) => {
			if (data?.deleteHousehold.success) {
				message.success(data.deleteHousehold.message);
				fetchHouseholds();
			} else {
				message.error(data?.deleteHousehold.message || "Failed to delete");
			}
		},
		onError: () => {
			message.error("Failed to delete household");
		},
	});

	const handleDeleteHousehold = async (record: Household) => {
		await deleteHousehold({
			variables: { id: record.id },
		});
	};

	const columns: TableProps<Household>["columns"] = [
		{
			title: "Household Code",
			key: "household_code",
			dataIndex: "household_code",
		},
		{
			title: "Head of Household",
			key: "head_of_household",
			dataIndex: "head_of_household",
			render: (_: any, record: any) => {
				const head = record.head_of_household;
				if (!head) return "-";
				return `${head.first_name} ${head.middle_name || ""} ${head.last_name}`.trim();
			},
		},
		{
			title: "Sitio",
			dataIndex: "sitio",
			key: "sitio",
			render: (_: any, record: any) => record.sitio?.name || "-",
		},
		{
			title: "Under Household",
			key: "parentHousehold",
			render: (_: any, record: any) => record.parentHousehold?.household_code || "-",
		},
		{
			title: "Actions",
			key: "actions",
			width: 200,
			align: "center",
			render: (_: any, record: Household) => (
				<Space>
					<Button
						type="primary"
						onClick={() => handleAddHouseholdModal(record)}
					>
						Edit
					</Button>
					<Popconfirm
						title="Delete resident?"
						description="Are you sure to delete this resident?"
						onConfirm={() => handleDeleteHousehold(record)}
						okText="Yes"
						cancelText="No"
					>
						<Button danger style={{ backgroundColor: "red", color: "white" }}>
							Delete
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div>
			<Input.Search placeholder="Search" style={{ marginBottom: 16 }} />
			<Table
				dataSource={households ?? ([] as Household[])}
				loading={householdLoading}
				columns={columns}
				size="small"
				rowKey="key"
				scroll={{ x: "1000" }}
			/>
		</div>
	);
}

export default HouseholdTable;
