import { Resident } from "@/interfaces";
import dayjs from "@/utils/dayjs";
import { getAge } from "@/utils/helper";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table, Tag } from "antd";
import { TablePaginationConfig, TableProps } from "antd/lib";
import { useRouter } from "next/router";

interface IProps {
	residents: Resident[];
	residentLoading: boolean;
	handleDeleteResident: (record: Resident) => void;
	handleSearch: (value: string) => void;
	pagination: TablePaginationConfig;
}
function ResidentTable(props: IProps) {
	const {
		residents,
		residentLoading,
		handleDeleteResident,
		handleSearch,
		pagination,
	} = props;
	const router = useRouter();

	const columns: TableProps<Resident>["columns"] = [
		{
			title: "Resident Code",
			key: "resident_code",
			dataIndex: "resident_code",
			fixed: "left",
			width: 150,
		},
		{
			title: "Name",
			key: "name",
			width: 280,
			render: (_: any, record: any) => {
				return (
					<Button
						type="link"
						onClick={() => router.push(`/manage/resident/${record.id}`)}
					>
						{record.first_name} {record.middle_name} {record.last_name}
					</Button>
				);
			},
		},
		{
			title: "Age",
			key: "age",
			width: 150,
			render: (_: any, record: any) => getAge(record.birthdate),
		},
		{
			title: "Birthday",
			dataIndex: "birthdate",
			key: "birthdate",
			width: 150,
			render: (val: string) => dayjs(val).format("MMMM DD, YYYY"),
		},
		{
			title: "Address",
			dataIndex: "address",
			key: "address",
			width: 150,
		},
		{
			title: "Sitio",
			dataIndex: ["sitio", "name"],
			key: "sitio",
			width: 150,
		},
		{
			title: "Civil Status",
			dataIndex: "civil_status",
			key: "civil_status",
			width: 150,
		},
		{
			title: "Registered Voter",
			dataIndex: "isRegisteredVoter",
			key: "isRegisteredVoter",
			width: 150,
			render: (val: boolean) => (val ? "Yes" : "No"),
		},
		{
			title: "Classification",
			key: "classification",
			width: 220,
			render: (_: any, record: any) => (
				<Space size={[4, 4]} wrap>
					{record.is4Ps && <Tag color="blue">4P's</Tag>}
					{record.isSeniorCitizen && <Tag color="purple">Senior</Tag>}
					{record.isNHTS && <Tag color="volcano">NHTS</Tag>}
					{record.isFarmer && <Tag color="green">Farmer</Tag>}
				</Space>
			),
		},
		{
			title: "Actions",
			key: "actions",
			width: 200,
			align: "center",
			fixed: "right",
			render: (_: any, record: Resident) => (
				<Space>
					<Popconfirm
						title="Delete resident?"
						description="Are you sure to delete this resident?"
						onConfirm={() => handleDeleteResident(record)}
						okText="Yes"
						cancelText="No"
					>
						<Button size="small" danger >Delete Resident </Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div>
			<Input.Search
				placeholder="Search"
				style={{ marginBottom: 16 }}
				onSearch={handleSearch}
			/>
			<Table
				dataSource={residents ?? ([] as Resident[])}
				loading={residentLoading}
				columns={columns}
				size="small"
				rowKey="id"
				scroll={{ x: "1000" }}
				pagination={{
					...pagination,
					showSizeChanger: true,
					showTotal: (total, range) =>
						`${range[0]}-${range[1]} of ${total} residents`,
					pageSizeOptions: ["10", "20", "50", "100"],
				}}
			/>
		</div>
	);
}

export default ResidentTable;
