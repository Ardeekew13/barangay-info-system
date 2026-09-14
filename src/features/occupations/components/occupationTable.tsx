import { DELETE_OCCUPATION } from "@/graphql/occupation";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useMutation } from "@apollo/client";
import { App, Button, Input, Popconfirm, Space, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Occupation {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

interface OccupationTableProps {
	occupations: Occupation[];
	occupationLoading: boolean;
	handleAddOccupationModal: (record?: Occupation) => void;
	fetchOccupations: () => void;
	handleSearch: (value: string) => void;
}

const OccupationTable: React.FC<OccupationTableProps> = ({
	occupations,
	occupationLoading,
	handleAddOccupationModal,
	fetchOccupations,
	handleSearch,
}) => {
	const { message } = App.useApp();

	const [deleteOccupation] = useMutation<any>(DELETE_OCCUPATION, {
		onCompleted: (data) => {
			if (data?.deleteOccupation?.success) {
				message.success(data.deleteOccupation?.message);
				fetchOccupations();
			} else {
				message.error(data?.deleteOccupation?.message || "Failed to delete");
			}
		},
		onError: () => {
			message.error("Failed to delete occupation");
		},
	});

	const handleDeleteOccupation = async (record: Occupation) => {
		await deleteOccupation({
			variables: { id: record.id },
		});
	};

	const columns: ColumnsType<Occupation> = [
		{
			title: "Occupation Name",
			dataIndex: "name",
			key: "name",
			sorter: (a, b) => a.name.localeCompare(b.name),
		},
		{
			title: "Created At",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (date) => dayjs(Number(date)).format("MMM DD, YYYY hh:mm A"),
			sorter: (a, b) => Number(a.createdAt) - Number(b.createdAt),
		},
		{
			title: "Updated At",
			dataIndex: "updatedAt",
			key: "updatedAt",
			render: (date) => dayjs(Number(date)).format("MMM DD, YYYY hh:mm A"),
			sorter: (a, b) => Number(a.updatedAt) - Number(b.updatedAt),
		},
		{
			title: "Actions",
			key: "actions",
			fixed: "right",
			width: 120,
			render: (_, record) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EditOutlined />}
						onClick={() => handleAddOccupationModal(record)}
					/>
					<Popconfirm
						title="Delete Occupation"
						description={`Are you sure you want to delete "${record.name}"?`}
						onConfirm={() => handleDeleteOccupation(record)}
						okText="Delete"
						cancelText="Cancel"
						okButtonProps={{ danger: true, size: "small" }}
						cancelButtonProps={{ size: "small" }}
					>
						<Button type="link" danger icon={<DeleteOutlined />} size="small" />
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
				columns={columns}
				dataSource={occupations}
				loading={occupationLoading}
				rowKey="id"
				pagination={{
					pageSize: 10,
					showSizeChanger: true,
					showTotal: (total) => `Total ${total} occupations`,
				}}
				size="small"
			/>
		</div>
	);
};

export default OccupationTable;
