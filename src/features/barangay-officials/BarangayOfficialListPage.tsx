import {
	ADD_BARANGAY_OFFICIAL,
	GET_BARANGAY_OFFICIALS,
	REMOVE_BARANGAY_OFFICIAL,
} from "@/graphql/barangayOfficial";
import { useResidentOptions } from "@/hooks/useResidentOption";
import { useMutation, useQuery } from "@apollo/client";
import {
	App,
	Button,
	Card,
	Col,
	Form,
	Modal,
	Popconfirm,
	Row,
	Select,
	Spin,
	Table,
	Tag,
	Typography,
} from "antd";
import { useState } from "react";
import MainLayout from "@/components/layout/Layout";
import { PageContainer } from "@ant-design/pro-layout";
import CommonPageTitle from "@/components/ui/CommonPageTitle";

const { Title } = Typography;

const ROLES = [
	"Punong Barangay",
	"Barangay Kagawad",
	"SK Chairperson",
	"Barangay Secretary",
	"Barangay Treasurer",
];

const ROLE_COLORS: Record<string, string> = {
	"Punong Barangay": "gold",
	"Barangay Kagawad": "blue",
	"SK Chairperson": "green",
	"Barangay Secretary": "purple",
	"Barangay Treasurer": "orange",
};

const BarangayOfficialListPage: React.FC = () => {
	const { message } = App.useApp();
	const [modalOpen, setModalOpen] = useState(false);
	const [form] = Form.useForm();
	const { residents, loading: residentLoading } = useResidentOptions();

	const { data, loading, refetch } = useQuery<any>(GET_BARANGAY_OFFICIALS);
	const officials = data?.barangayOfficials?.officials || [];

	const [addOfficial, { loading: addLoading }] = useMutation(ADD_BARANGAY_OFFICIAL, {
		onCompleted: (data) => {
			if (data?.addBarangayOfficial?.success) {
				message.success(data.addBarangayOfficial.message);
				setModalOpen(false);
				form.resetFields();
				refetch();
			} else {
				message.error(data?.addBarangayOfficial?.message);
			}
		},
		onError: () => message.error("Failed to add official"),
	});

	const [removeOfficial] = useMutation(REMOVE_BARANGAY_OFFICIAL, {
		onCompleted: (data) => {
			if (data?.removeBarangayOfficial?.success) {
				message.success(data.removeBarangayOfficial.message);
				refetch();
			} else {
				message.error(data?.removeBarangayOfficial?.message);
			}
		},
		onError: () => message.error("Failed to remove official"),
	});

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			await addOfficial({
				variables: {
					residentId: values.resident,
					role: values.role,
				},
			});
		} catch (err) {
			// validation error
		}
	};

	// Filter out residents already assigned as officials
	const officialResidentIds = officials.map((o: any) => o.resident?.id);
	const availableResidents = residents.filter(
		(r: any) => !officialResidentIds.includes(r.value),
	);

	const columns = [
		{
			title: "Resident Code",
			key: "resident_code",
			render: (_: any, record: any) => record.resident?.resident_code,
			width: 150,
		},
		{
			title: "Name",
			key: "name",
			render: (_: any, record: any) => {
				const r = record.resident;
				return `${r?.first_name} ${r?.middle_name || ""} ${r?.last_name}`.trim();
			},
		},
		{
			title: "Role",
			key: "role",
			dataIndex: "role",
			render: (role: string) => <Tag color={ROLE_COLORS[role] || "default"}>{role}</Tag>,
		},
		{
			title: "Sitio",
			key: "sitio",
			render: (_: any, record: any) => record.resident?.sitio?.name || "-",
		},
		{
			title: "Actions",
			key: "actions",
			width: 120,
			render: (_: any, record: any) => (
				<Popconfirm
					title="Remove this official?"
					onConfirm={() => removeOfficial({ variables: { id: record.id } })}
					okText="Yes"
					cancelText="No"
				>
					<Button danger size="small">
						Remove
					</Button>
				</Popconfirm>
			),
		},
	];

	return (
		<MainLayout>
			<PageContainer
				title={<CommonPageTitle title="Barangay Officials" />}
				extra={[
					<Button key="add" type="primary" onClick={() => setModalOpen(true)}>
						Add Official
					</Button>,
				]}
			>
				<Card>
					<Table
						dataSource={officials}
						columns={columns}
						loading={loading}
						rowKey="id"
						size="large"
						scroll={{ x: 800 }}
					/>
				</Card>

				<Modal
					title="Add Barangay Official"
					open={modalOpen}
					onCancel={() => setModalOpen(false)}
					onOk={handleSubmit}
					confirmLoading={addLoading}
					destroyOnClose
				>
					<Form form={form} layout="vertical" preserve={false}>
						<Form.Item
							label="Role"
							name="role"
							rules={[{ required: true, message: "Please select a role" }]}
						>
							<Select placeholder="Select Role">
								{ROLES.map((role) => (
									<Select.Option key={role} value={role}>
										{role}
									</Select.Option>
								))}
							</Select>
						</Form.Item>
						<Form.Item
							label="Resident"
							name="resident"
							rules={[{ required: true, message: "Please select a resident" }]}
						>
							<Select
								showSearch
								placeholder="Search Resident"
								options={availableResidents}
								loading={residentLoading}
								notFoundContent={residentLoading ? <Spin size="small" /> : undefined}
								filterOption={(input, option) =>
									(option?.label ?? "")
										.toString()
										.toLowerCase()
										.includes(input.toLowerCase())
								}
							/>
						</Form.Item>
					</Form>
				</Modal>
			</PageContainer>
		</MainLayout>
	);
};

export default BarangayOfficialListPage;
