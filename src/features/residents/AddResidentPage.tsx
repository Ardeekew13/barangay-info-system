import { CREATE_RESIDENT, GET_RESIDENTS_WITHOUT_HOUSEHOLD } from "@/graphql/resident";
import { useSitioOptions } from "@/hooks/useSitioOption";
import { useHouseholdOptions } from "@/hooks/useHouseholdList";
import { useOccupationOptions } from "@/hooks/useOccupationOption";
import { Resident } from "@/interfaces";
import {
	civilStatusOptions,
	employmentStatusOptions,
	genderOptions,
	requiredFields,
	responsiveColumn3,
	responsiveColumn4,
} from "@/utils/constant";
import { useMutation, useQuery } from "@apollo/client";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-layout";
import {
	App,
	AutoComplete,
	Button,
	Card,
	Checkbox,
	Col,
	DatePicker,
	Form,
	Input,
	Row,
	Select,
	Space,
	Spin,
	Table,
	Typography,
} from "antd";
import { TableProps } from "antd/lib";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useState } from "react";
import MainLayout from "@/components/layout/Layout";
import AddHouseholdFromEditModal from "./components/AddHouseholdFromEditModal";
import AddOccupationFromEditModal from "./components/AddOccupationFromEditModal";

const { Title } = Typography;

const citizenshipOptions = [{ value: "FILIPINO" }];
const indigenousOptions = [{ value: "NON-INDIGENOUS" }];
const statusOptions = [
	{ value: "Active" },
	{ value: "Deceased" },
	{ value: "Moved Out" },
];

const AddResidentPage: React.FC = () => {
	const router = useRouter();
	const [form] = Form.useForm();
	const { message } = App.useApp();
	const { sitios, loading: sitioLoading } = useSitioOptions();
	const { households: householdList, loading: householdLoading, refetch: refetchHouseholds } = useHouseholdOptions();
	const [showHouseholdModal, setShowHouseholdModal] = useState(false);
	const { occupations, loading: occupationLoading, refetch: refetchOccupations } = useOccupationOptions();
	const [showOccupationModal, setShowOccupationModal] = useState(false);

	const [citizenship, setCitizenship] = useState([]);
	const [indigenous, setIndigenous] = useState([]);
	const [status, setStatus] = useState([]);
	const [isHeadChecked, setIsHeadChecked] = useState(false);
	const [selectedMembers, setSelectedMembers] = useState<Resident[]>([]);
	const [memberSearch, setMemberSearch] = useState("");

	// Fetch available residents (no household) for member selection
	const { data: residentsData, loading: residentsLoading } = useQuery<any>(
		GET_RESIDENTS_WITHOUT_HOUSEHOLD,
		{
			variables: { search: memberSearch || undefined },
			skip: !isHeadChecked,
		},
	);

	const availableResidents = (
		residentsData?.getResidentWithoutHousehold?.residents || []
	).filter((r: Resident) => !r.householdId && !r.isHead);

	const memberColumns: TableProps<Resident>["columns"] = [
		{
			title: "Resident Code",
			dataIndex: "resident_code",
			key: "resident_code",
			width: 140,
		},
		{
			title: "Name",
			key: "name",
			render: (_: any, r: Resident) =>
				`${r.first_name} ${r.middle_name} ${r.last_name}`,
		},
		{
			title: "Action",
			key: "action",
			width: 100,
			render: (_: any, r: any) => {
				const checked = selectedMembers.some((m) => m.id === r.id);
				return (
					<Checkbox
						checked={checked}
						onChange={(e) => {
							setSelectedMembers((prev) =>
								e.target.checked
									? [...prev, r]
									: prev.filter((m) => m.id !== r.id),
							);
						}}
					/>
				);
			},
		},
	];

	const [createResident, { loading: createLoading }] = useMutation<any>(
		CREATE_RESIDENT,
		{
			onCompleted: (data) => {
				if (data?.createResident.success) {
					message.success(data.createResident.message);
					router.push("/resident-list");
				} else {
					message.error(data?.createResident.message || "Failed to create");
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
				householdId: values.household?.value || values.household || null,
				memberIds:
					values.isHead && isHeadChecked && selectedMembers.length > 0
						? selectedMembers.map((m) => m.id)
						: [],
			};

			await createResident({ variables: { input } });
		} catch (error: any) {
			console.log("Validation error:", error);
		}
	};

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
						loading={createLoading}
						onClick={handleSubmit}
					>
						Save Resident
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
				<Card style={{ borderRadius: 12 }}>
					<Title level={3} style={{ marginBottom: 24 }}>
						Add New Resident
					</Title>
					<Form
						form={form}
						layout="vertical"
						name="residentForm"
						onFinish={handleSubmit}
						initialValues={{
							registeredVoter: false,
							is_ofw: false,
							is_solo_parent: false,
							osc: false,
							indigent: false,
							isPwd: false,
							isHead: false,
						}}
					>
						<Row gutter={[16, 2]}>
							<Col {...responsiveColumn3}>
								<Form.Item label="First Name" name="first_name" rules={requiredFields}>
									<Input placeholder="First Name" />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Middle Name" name="middle_name" rules={requiredFields}>
									<Input placeholder="Middle Name" />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Last Name" name="last_name" rules={requiredFields}>
									<Input placeholder="Last Name" />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item
									label="Email"
									name="email"
									validateTrigger="onBlur"
									rules={[{ type: "email", message: "Invalid email format" }]}
								>
									<Input placeholder="Email (Optional)" />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Birth Date" name="birthdate" rules={requiredFields}>
									<DatePicker
										placeholder="Birth Date"
										style={{ width: "100%" }}
										format="YYYY-MM-DD"
									/>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Place of Birth" name="place_of_birth" rules={requiredFields}>
									<Input placeholder="Place of Birth" />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Address" name="address" rules={requiredFields}>
									<Input placeholder="Address" />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Gender" name="gender" rules={requiredFields}>
									<Select placeholder="Gender" options={genderOptions} />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Sitio" name="sitio" rules={requiredFields}>
									<Select
										placeholder="Sitio"
										loading={sitioLoading}
										notFoundContent={sitioLoading ? <Spin size="small" /> : undefined}
										options={sitios}
										labelInValue
									/>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Civil Status" name="civilStatus" rules={requiredFields}>
									<Select placeholder="Civil Status" options={civilStatusOptions} />
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Occupation" style={{ marginBottom: 0 }}>
									<Space.Compact style={{ width: "100%" }}>
										<Form.Item name="occupation" rules={requiredFields} noStyle>
											<Select
												showSearch
												placeholder="Select Occupation"
												options={occupations}
												loading={occupationLoading}
												notFoundContent={occupationLoading ? <Spin size="small" /> : undefined}
												style={{ width: "100%" }}
												filterOption={(input, option) =>
													(option?.label ?? "")
														.toString()
														.toLowerCase()
														.includes(input.toLowerCase())
												}
											/>
										</Form.Item>
										<Button onClick={() => setShowOccupationModal(true)}>+</Button>
									</Space.Compact>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Employment Status" name="employment_status" rules={requiredFields}>
									<Select
										placeholder="Select Employment Status"
										options={employmentStatusOptions}
									/>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Citizenship" name="citizenship" rules={requiredFields}>
									<AutoComplete
										options={citizenshipOptions}
										placeholder="Enter citizenship or select 'Filipino'"
										value={citizenship}
										onChange={setCitizenship}
										filterOption={(inputValue, option) =>
											option?.value?.toUpperCase().includes(inputValue.toUpperCase()) ?? false
										}
									/>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Indigenous" name="indigenous_group" rules={requiredFields}>
									<AutoComplete
										options={indigenousOptions}
										placeholder="Indigenous Person (IP)"
										value={indigenous}
										onChange={setIndigenous}
										filterOption={(inputValue, option) =>
											option?.value?.toUpperCase().includes(inputValue.toUpperCase()) ?? false
										}
									/>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Resident Status" name="status" rules={requiredFields}>
									<AutoComplete
										options={statusOptions}
										placeholder="Resident Status"
										value={status}
										onChange={setStatus}
										filterOption={(inputValue, option) =>
											option?.value?.toUpperCase().includes(inputValue.toUpperCase()) ?? false
										}
									/>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn3}>
								<Form.Item label="Household" name="household">
									<Space.Compact style={{ width: "100%" }}>
										<Select
											showSearch
											placeholder="Search Household"
											options={householdList}
											loading={householdLoading}
											notFoundContent={householdLoading ? <Spin size="small" /> : undefined}
											labelInValue
											style={{ width: "100%" }}
											filterOption={(input, option) =>
												(option?.label ?? "")
													.toString()
													.toLowerCase()
													.includes(input.toLowerCase())
											}
										/>
										<Button onClick={() => setShowHouseholdModal(true)}>+</Button>
									</Space.Compact>
								</Form.Item>
							</Col>
						</Row>
						<Row>
							<Col {...responsiveColumn4}>
								<Form.Item name="registeredVoter" valuePropName="checked">
									<Checkbox>Registered Voter?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="is_ofw" valuePropName="checked">
									<Checkbox>Is OFW?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="is_solo_parent" valuePropName="checked">
									<Checkbox>A Solo Parent?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="osc" valuePropName="checked">
									<Checkbox>Out of School Youth (OSC)?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="indigent" valuePropName="checked">
									<Checkbox>Indigent?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="isPwd" valuePropName="checked">
									<Checkbox>A Person with Disability (PWD)?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="isHead" valuePropName="checked">
									<Checkbox onChange={(e) => setIsHeadChecked(e.target.checked)}>
										Head of Household?
									</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="is4Ps" valuePropName="checked">
									<Checkbox>4P's Beneficiary?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="isSeniorCitizen" valuePropName="checked">
									<Checkbox>Senior Citizen?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="isNHTS" valuePropName="checked">
									<Checkbox>NHTS Listed?</Checkbox>
								</Form.Item>
							</Col>
							<Col {...responsiveColumn4}>
								<Form.Item name="isFarmer" valuePropName="checked">
									<Checkbox>Farmer?</Checkbox>
								</Form.Item>
							</Col>
						</Row>

						{/* Members table shown when isHead is checked */}
						{isHeadChecked && (
							<>
								<Title level={5} style={{ marginTop: 16 }}>
									Assign Household Members
								</Title>
								<Input.Search
									placeholder="Search residents without household..."
									onSearch={(val) => setMemberSearch(val)}
									onChange={(e) => setMemberSearch(e.target.value)}
									style={{ marginBottom: 12, maxWidth: 400 }}
									allowClear
								/>
								<Table
									dataSource={availableResidents}
									columns={memberColumns}
									rowKey="id"
									loading={residentsLoading}
									size="small"
									pagination={{ pageSize: 5 }}
									scroll={{ y: 200 }}
								/>
							</>
						)}
					</Form>

					<AddHouseholdFromEditModal
						open={showHouseholdModal}
						onClose={(householdId?: string, householdLabel?: string) => {
							setShowHouseholdModal(false);
							if (householdId && householdLabel) {
								form.setFieldsValue({ household: { value: householdId, label: householdLabel } });
								refetchHouseholds();
							}
						}}
					/>

					<AddOccupationFromEditModal
						open={showOccupationModal}
						onClose={(occupationName?: string) => {
							setShowOccupationModal(false);
							if (occupationName) {
								form.setFieldsValue({ occupation: occupationName });
								refetchOccupations();
							}
						}}
					/>
				</Card>
			</PageContainer>
		</MainLayout>
	);
};

export default AddResidentPage;
