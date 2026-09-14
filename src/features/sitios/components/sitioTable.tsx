import { DELETE_SITIO } from "@/graphql/sitio";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useMutation } from "@apollo/client";
import { App, Button, Input, Popconfirm, Space, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface Sitio {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

interface SitioTableProps {
	sitios: Sitio[];
	sitioLoading: boolean;
	handleAddSitioModal: (record?: Sitio) => void;
	fetchSitios: () => void;
	handleSearch: (value: string) => void;
}

const SitioTable: React.FC<SitioTableProps> = ({
	sitios,
	sitioLoading,
	handleAddSitioModal,
	fetchSitios,
	handleSearch,
}) => {
	const { message } = App.useApp();

	const [deleteSitio] = useMutation<any>(DELETE_SITIO, {
		onCompleted: (data) => {
			if (data?.deleteSitio?.success) {
				console.log("Delete success, calling messageApi and fetchSitios");
				message.success(data.deleteSitio?.message);
				fetchSitios();
			} else {
				message.error(data?.deleteSitio?.message || "Failed to delete");
			}
		},
		onError: (error) => {
			console.log("Delete onError:", error);
			message.error("Failed to delete sitio");
		},
	});

	const handleDeleteSitio = async (record: Sitio) => {
		await deleteSitio({
			variables: { id: record.id },
		});
	};

	const columns: ColumnsType<Sitio> = [
		{
			title: "Sitio Name",
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
						onClick={() => handleAddSitioModal(record)}
					/>
					<Popconfirm
						title="Delete Sitio"
						description={`Are you sure you want to delete "${record.name}"?`}
						onConfirm={() => handleDeleteSitio(record)}
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
				dataSource={sitios}
				loading={sitioLoading}
				rowKey="id"
				pagination={{
					pageSize: 10,
					showSizeChanger: true,
					showTotal: (total) => `Total ${total} sitios`,
				}}
				size="small"
			/>
		</div>
	);
};

export default SitioTable;
