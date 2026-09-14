import { GET_RESIDENT, UPDATE_RESIDENT } from "@/graphql/resident";
import { useSitioOptions } from "@/hooks/useSitioOption";
import { Resident } from "@/interfaces";
import { getAge } from "@/utils/helper";
import { useMutation, useQuery } from "@apollo/client";
import {
	ArrowLeftOutlined,
	EditOutlined,
	HistoryOutlined,
	IdcardOutlined,
	MailOutlined,
	ManOutlined,
	WomanOutlined,
	HomeOutlined,
	CalendarOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-layout";
import {
	App,
	Avatar,
	Button,
	Card,
	Col,
	Form,
	Row,
	Skeleton,
	Space,
	Tabs,
	Tag,
	Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useState } from "react";
import MainLayout from "@/components/layout/Layout";
import ManageResidentEditTab from "./ManageResidentEditTab";
import ManageResidentOverviewTab from "./ManageResidentOverviewTab";
import ResidentHistoryTab from "./components/ResidentHistoryTab";

const { Title, Text } = Typography;

const ManageResidentPage: React.FC = () => {
	const router = useRouter();
	const { id } = router.query;
	const [form] = Form.useForm();
	const { message } = App.useApp();
	const { sitios, loading: sitioLoading } = useSitioOptions();

	const [occupation, setOccupation] = useState([]);
	const [citizenship, setCitizenship] = useState([]);
	const [indigenous, setIndigenous] = useState([]);
	const [status, setStatus] = useState([]);

	// Query resident by ID
	const {
		data,
		loading: residentLoading,
		refetch,
	} = useQuery<any>(GET_RESIDENT, {
		variables: { id },
		skip: !id,
		onCompleted: (data) => {
			if (data?.resident?.success && data.resident.resident) {
				const r = data.resident.resident;
				form.setFieldsValue({
					first_name: r.first_name,
					middle_name: r.middle_name,
					last_name: r.last_name,
					email: r.email,
					birthdate: r.birthdate ? dayjs(r.birthdate) : null,
					place_of_birth: r.place_of_birth,
					address: r.address,
					gender: r.gender,
					sitio: r.sitio
						? { value: r.sitio.id, label: r.sitio.name }
						: undefined,
					civilStatus: r.civil_status,
					occupation: r.occupation,
					employment_status: r.employment_status,
					citizenship: r.citizenship,
					indigenous_group: r.indigenous_group,
					registeredVoter: r.registered_voter,
					is_ofw: r.is_ofw,
					is_solo_parent: r.is_solo_parent,
					osc: r.osc,
					indigent: r.indigent,
					isPwd: r.isPwd,
					status: r.status,
					isHead: r.isHead,
					is4Ps: r.is4Ps,
					isSeniorCitizen: r.isSeniorCitizen,
					isNHTS: r.isNHTS,
					isFarmer: r.isFarmer,
					household: r.household
						? { value: r.household.id, label: r.household.household_code }
						: undefined,
				});
			}
		},
		onError: () => {
			message.error("Failed to load resident");
		},
	});

	const resident: Resident | null = data?.resident?.resident || null;

	// Update mutation
	const [updateResident, { loading: updateLoading }] = useMutation<any>(
		UPDATE_RESIDENT,
		{
			onCompleted: (data) => {
				if (data?.updateResident.success) {
					message.success(data.updateResident.message);
					refetch();
				} else {
					message.error(data?.updateResident.message || "Failed to update");
				}
			},
			onError: (error) => {
				message.error(error.message || "An error occurred");
			},
		},
	);

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			console.log("Form Values:", values);
			const input = {
				first_name: values.first_name,
				middle_name: values.middle_name,
				last_name: values.last_name,
				email: values.email || null,
				birthdate: values.birthdate
					? dayjs(values.birthdate).format("YYYY-MM-DD")
					: null,
				place_of_birth: values.place_of_birth,
				address: values.address,
				gender: values.gender,
				sitioId: values.sitio?.value || values.sitio?.id || values.sitio,
				civil_status: values.civilStatus,
				occupation: values.occupation,
				employment_status: values.employment_status,
				citizenship: values.citizenship,
				indigenous_group: values.indigenous_group,
				registered_voter: values.registeredVoter ?? false,
				is_ofw: values.is_ofw ?? false,
				is_solo_parent: values.is_solo_parent ?? false,
				osc: values.osc ?? false,
				indigent: values.indigent ?? false,
				isPwd: values.isPwd ?? false,
				status: values.status,
				isHead: values.isHead ?? false,
				is4Ps: values.is4Ps ?? false,
				isSeniorCitizen: values.isSeniorCitizen ?? false,
				isNHTS: values.isNHTS ?? false,
				isFarmer: values.isFarmer ?? false,
				householdId: values?.household?.value || null,
			};

			await updateResident({
				variables: { id, input },
			});
		} catch (error: any) {
			console.log("Validation error:", error);
		}
	};

	const statusColor =
		resident?.status === "Active"
			? "green"
			: resident?.status === "Deceased"
				? "red"
				: "orange";

	const genderIcon =
		resident?.gender === "Female" ? <WomanOutlined /> : <ManOutlined />;

	return (
		<MainLayout>
			<PageContainer
				title={false}
				header={{ title: false, breadcrumb: {} }}
				footer={[
					<Button
						key="back"
						icon={<ArrowLeftOutlined />}
						onClick={() => router.push("/resident-list")}
					>
						Back to Residents
					</Button>,
					<Button
						key="save"
						type="primary"
						loading={updateLoading}
						onClick={handleSubmit}
					>
						Save Changes
					</Button>,
				]}
				footerToolBarProps={{
					style: {
						background: "#fff",
						borderTop: "1px solid #f0f0f0",
						boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
					},
				}}
			>
				{residentLoading ? (
					<Card>
						<Skeleton active avatar paragraph={{ rows: 8 }} />
					</Card>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						{/* ── Profile Header Card ── */}
						<Card
							style={{ borderRadius: 12 }}
							styles={{ body: { padding: "24px 32px" } }}
						>
							<Row gutter={24} align="middle">
								<Col>
									<Avatar
										size={80}
										icon={<UserOutlined />}
										style={{
											backgroundColor:
												resident?.gender === "Female" ? "#eb2f96" : "#1677ff",
											fontSize: 36,
										}}
									/>
								</Col>
								<Col flex="auto">
									<Space direction="vertical" size={2}>
										<Space align="center" size={12}>
											<Title level={3} style={{ margin: 0 }}>
												{resident?.first_name} {resident?.middle_name}{" "}
												{resident?.last_name}
											</Title>
											<Tag color={statusColor}>{resident?.status}</Tag>
											{resident?.isHead && (
												<Tag color="gold">Head of Household</Tag>
											)}
										</Space>
										<Space size={16} style={{ color: "#8c8c8c" }}>
											<Space size={4}>
												<IdcardOutlined />
												<Text type="secondary">{resident?.resident_code}</Text>
											</Space>
											<Space size={4}>
												{genderIcon}
												<Text type="secondary">{resident?.gender}</Text>
											</Space>
											<Space size={4}>
												<CalendarOutlined />
												<Text type="secondary">
													{dayjs(resident?.birthdate).format("MMMM DD, YYYY")} (
													{getAge(resident?.birthdate || "")} yrs old)
												</Text>
											</Space>
											{resident?.email && (
												<Space size={4}>
													<MailOutlined />
													<Text type="secondary">{resident?.email}</Text>
												</Space>
											)}
										</Space>
									</Space>
								</Col>
							</Row>
						</Card>

						{/* ── Quick Info Cards ── */}
						<Row gutter={16}>
							<Col xs={24} sm={8}>
								<Card size="small" style={{ borderRadius: 10 }}>
									<Space>
										<HomeOutlined style={{ fontSize: 20, color: "#1677ff" }} />
										<div>
											<Text type="secondary" style={{ fontSize: 12 }}>
												Address
											</Text>
											<br />
											<Text strong>{resident?.address || "—"}</Text>
										</div>
									</Space>
								</Card>
							</Col>
							<Col xs={24} sm={8}>
								<Card size="small" style={{ borderRadius: 10 }}>
									<Space>
										<IdcardOutlined
											style={{ fontSize: 20, color: "#52c41a" }}
										/>
										<div>
											<Text type="secondary" style={{ fontSize: 12 }}>
												Civil Status
											</Text>
											<br />
											<Text strong>{resident?.civil_status || "—"}</Text>
										</div>
									</Space>
								</Card>
							</Col>
							<Col xs={24} sm={8}>
								<Card size="small" style={{ borderRadius: 10 }}>
									<Space>
										<UserOutlined style={{ fontSize: 20, color: "#faad14" }} />
										<div>
											<Text type="secondary" style={{ fontSize: 12 }}>
												Sitio
											</Text>
											<br />
											<Text strong>{resident?.sitio?.name || "—"}</Text>
										</div>
									</Space>
								</Card>
							</Col>
						</Row>

						{/* ── Tabs: Details & Edit ── */}
						<Card style={{ borderRadius: 12 }}>
							<Tabs
								defaultActiveKey="details"
								items={[
									{
										key: "details",
										label: (
											<span>
												<IdcardOutlined /> Overview
											</span>
										),
										children: resident ? (
											<ManageResidentOverviewTab resident={resident} />
										) : null,
									},
									{
										key: "edit",
										label: (
											<span>
												<EditOutlined /> Edit Information
											</span>
										),
										children: (
											<ManageResidentEditTab
												form={form}
												residentId={id as string}
												occupation={occupation}
												setOccupation={setOccupation}
												citizenship={citizenship}
												setCitizenship={setCitizenship}
												indigenous={indigenous}
												setIndigenous={setIndigenous}
												status={status}
												setStatus={setStatus}
												sitioLoading={sitioLoading}
												sitios={sitios}
											/>
										),
									},
									{
										key: "history",
										label: (
											<span>
												<HistoryOutlined /> History
											</span>
										),
										children: id ? (
											<ResidentHistoryTab residentId={id as string} />
										) : null,
									},
								]}
							/>
						</Card>
					</div>
				)}
			</PageContainer>
		</MainLayout>
	);
};

export default ManageResidentPage;
