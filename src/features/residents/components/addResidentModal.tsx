import {
	CREATE_RESIDENT,
	GET_RESIDENTS_WITHOUT_HOUSEHOLD,
	UPDATE_RESIDENT,
} from "@/graphql/resident";
import { useSitioOptions } from "@/hooks/useSitioOption";
import { useOccupationOptions } from "@/hooks/useOccupationOption";
import { Resident } from "@/interfaces";
import {
	civilStatusOptions,
	genderOptions,
	requiredFields,
	responsiveColumn3,
	responsiveColumn4,
} from "@/utils/constant";
import { useMutation, useQuery } from "@apollo/client";
import {
	App,
	AutoComplete,
	Button,
	Checkbox,
	Col,
	DatePicker,
	Divider,
	Form,
	Input,
	Modal,
	Row,
	Select,
	Space,
	Spin,
	Table,
	Typography,
} from "antd";
import { TableProps } from "antd/lib";
import dayjs from "dayjs";
import { useState } from "react";
import AddOccupationFromEditModal from "./AddOccupationFromEditModal";

interface ModalProps {
	hide: (result: boolean) => void;
	record: Resident;
}

const citizenshipOptions = [{ value: "FILIPINO" }];
const indigenousOptions = [{ value: "NON-INDIGENOUS" }];
const statusOptions = [
	{ value: "Active" },
	{ value: "Deceased" },
	{ value: "Moved Out" },
];

function AddResidentModal(props: ModalProps) {
	const { hide, record } = props;
	const [form] = Form.useForm();
	const [citizenship, setCitizenship] = useState([]);
	const [indigenous, setIndigenous] = useState([]);
	const [status, setStatus] = useState([]);
	const { sitios, loading: sitioLoading } = useSitioOptions();
	const { occupations, loading: occupationLoading, refetch: refetchOccupations } =
		useOccupationOptions();
	const [showOccupationModal, setShowOccupationModal] = useState(false);
	const { message } = App.useApp();

	// Track isHead checkbox
	const [isHeadChecked, setIsHeadChecked] = useState(record?.isHead ?? false);

	// Members selection state
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

	// Filter residents: only those without a household and not heads
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

	// GraphQL Mutations
	const [createResident, { loading: createLoading }] = useMutation<any>(
		CREATE_RESIDENT,
		{
			onCompleted: (data) => {
				if (data?.createResident.success) {
					hide(data.createResident.message);
				} else {
					message.error(data?.createResident.message || "Failed to create");
				}
			},
			onError: (error) => {
				message.error(error.message || "An error occurred");
			},
		},
	);

	const [updateResident, { loading: updateLoading }] = useMutation<any>(
		UPDATE_RESIDENT,
		{
			onCompleted: (data) => {
				if (data?.updateResident.success) {
					hide(data.updateResident.message);
				} else {
					message.error(data?.updateResident.message || "Failed to update");
				}
			},
			onError: (error) => {
				message.error(error.message || "An error occurred");
			},
		},
	);

	const loading = createLoading || updateLoading;

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			console.log("values", values);

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
				householdId: values.householdId || null,
				memberIds:
					values.isHead && isHeadChecked && selectedMembers.length > 0
						? selectedMembers.map((m) => m.id)
						: [],
			};

			if (record?.id) {
				// Update existing resident
				await updateResident({
					variables: { id: record.id, input },
				});
			} else {
				// Create new resident
				await createResident({
					variables: { input },
				});
			}
		} catch (error: any) {
			console.log("ERROR", error);
		}
	};

	return (
		<Modal
			title={
				<Typography.Title level={3}>
					{record?.id ? "Edit" : "Add"} Resident
				</Typography.Title>
			}
			width={1200}
			maskClosable={false}
			open={true}
			onCancel={() => hide(false)}
			footer={[
				<Button
					key="submit"
					form="residentForm"
					type="primary"
					htmlType="submit"
					loading={loading}
				>
					Submit
				</Button>,
				<Button key="back" onClick={() => hide(false)}>
					Cancel
				</Button>,
			]}
		>
			<Form
				form={form}
				layout="vertical"
				name="residentForm"
				onFinish={handleSubmit}
				initialValues={{
					first_name: record?.first_name,
					middle_name: record?.middle_name,
					last_name: record?.last_name,
					email: record?.email,
					birthdate: record?.birthdate
						? dayjs(record.birthdate, "YYYY-MM-DD")
						: null,
					place_of_birth: record?.place_of_birth,
					address: record?.address,
					gender: record?.gender,
					sitio: record?.sitio
						? { value: record.sitio.id, label: record.sitio.name }
						: undefined,
					civilStatus: record?.civil_status,
					occupation: record?.occupation,
					citizenship: record?.citizenship,
					indigenous_group: record?.indigenous_group,
					registeredVoter: record?.registered_voter ?? false,
					is_ofw: record?.is_ofw ?? false,
					is_solo_parent: record?.is_solo_parent ?? false,
					osc: record?.osc ?? false,
					indigent: record?.indigent ?? false,
					isPwd: record?.isPwd ?? false,
					status: record?.status,
					isHead: record?.isHead ?? false,
					is4Ps: record?.is4Ps ?? false,
					isSeniorCitizen: record?.isSeniorCitizen ?? false,
					isNHTS: record?.isNHTS ?? false,
					isFarmer: record?.isFarmer ?? false,
				}}
			>
				<Row gutter={[16, 2]}>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="First Name"
							name="first_name"
							rules={requiredFields}
						>
							<Input placeholder="First Name" name="first_name" />
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Middle Name"
							name="middle_name"
							rules={requiredFields}
						>
							<Input placeholder="Middle Name" name="middle_name" />
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Last Name"
							name="last_name"
							rules={requiredFields}
						>
							<Input placeholder="Last Name" name="last_name" />
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Email"
							name="email"
							validateTrigger="onBlur"
							rules={[{ type: "email", message: "Invalid email format" }]}
						>
							<Input placeholder="Email (Optional)" name="email" />
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Birth Date"
							name="birthdate"
							rules={requiredFields}
						>
							<DatePicker
								placeholder="Birth Date"
								name="birthdate"
								style={{ width: "100%" }}
								format="YYYY-MM-DD"
							/>
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Place of Birth"
							name="place_of_birth"
							rules={requiredFields}
						>
							<Input placeholder="Place of Birth" name="place_of_birth" />
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item label="Address" name="address" rules={requiredFields}>
							<Input placeholder="Address" name="address" />
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item label="Gender" name="gender" rules={requiredFields}>
							<Select
								placeholder="Gender"
								id="gender"
								options={genderOptions}
							/>
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item label="Sitio" name="sitio" rules={requiredFields}>
							<Select
								placeholder="Sitio"
								id="sitio"
								loading={sitioLoading}
								notFoundContent={sitioLoading ? <Spin size="small" /> : undefined}
								options={sitios}
								labelInValue
							/>
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Civil Status"
							name="civilStatus"
							rules={requiredFields}
						>
							<Select
								placeholder="Civil Status"
								id="civilStatus"
								options={civilStatusOptions}
							/>
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
						<Form.Item
							label="Citizenship"
							name="citizenship"
							rules={requiredFields}
						>
							<AutoComplete
								options={citizenshipOptions}
								placeholder="Enter citizenship or select 'Filipino'"
								value={citizenship}
								onChange={setCitizenship}
								filterOption={(inputValue, option) =>
									option && option.value
										? option.value
												.toUpperCase()
												.includes(inputValue.toUpperCase())
										: false
								}
							/>
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Indigenous"
							name="indigenous_group"
							rules={requiredFields}
						>
							<AutoComplete
								options={indigenousOptions}
								placeholder="Indigenous Person (IP)'"
								value={indigenous}
								onChange={setIndigenous}
								filterOption={(inputValue, option) =>
									option && option.value
										? option.value
												.toUpperCase()
												.includes(inputValue.toUpperCase())
										: false
								}
							/>
						</Form.Item>
					</Col>
					<Col {...responsiveColumn3}>
						<Form.Item
							label="Resident Status"
							name="status"
							rules={requiredFields}
						>
							<AutoComplete
								options={statusOptions}
								placeholder="Resident Status"
								value={status}
								onChange={setStatus}
								filterOption={(inputValue, option) =>
									option && option.value
										? option.value
												.toUpperCase()
												.includes(inputValue.toUpperCase())
										: false
								}
							/>
						</Form.Item>
					</Col>
					{/* <Col {...responsiveColumn3}>
            <Form.Item label="Household" name="householdId">
              <Select
              disabled
                placeholder="Household"
                id="householdId"
                // loading={householdLoading}
                // options={households.map(household => ({ label: household.name, value: household.id }))}
                // labelInValue
              />
            </Form.Item>
          </Col> */}
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
			</Form>

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
		</Modal>
	);
}

export default AddResidentModal;
