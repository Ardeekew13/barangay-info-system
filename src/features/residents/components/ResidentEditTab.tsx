import { useSitioOptions } from "@/hooks/useSitioOption";
import { useOccupationOptions } from "@/hooks/useOccupationOption";
import {
	civilStatusOptions,
	genderOptions,
	requiredFields,
	responsiveColumn3,
	responsiveColumn4,
} from "@/utils/constant";
import {
	AutoComplete,
	Button,
	Checkbox,
	Col,
	DatePicker,
	Divider,
	Form,
	FormInstance,
	Input,
	Row,
	Select,
	Space,
	Spin,
} from "antd";
import { useState } from "react";
import AddOccupationFromEditModal from "./AddOccupationFromEditModal";

const citizenshipOptions = [{ value: "FILIPINO" }];
const indigenousOptions = [{ value: "NON-INDIGENOUS" }];
const statusOptions = [
	{ value: "Active" },
	{ value: "Deceased" },
	{ value: "Moved Out" },
];

interface Props {
	form: FormInstance;
}

const ResidentEditTab: React.FC<Props> = ({ form }) => {
	const { sitios, loading: sitioLoading } = useSitioOptions();
	const { occupations, loading: occupationLoading, refetch: refetchOccupations } =
		useOccupationOptions();
	const [showOccupationModal, setShowOccupationModal] = useState(false);
	const [citizenship, setCitizenship] = useState([]);
	const [indigenous, setIndigenous] = useState([]);
	const [status, setStatus] = useState([]);

	return (
		<Form form={form} layout="vertical" name="manageResidentForm" style={{ marginBottom: 20 }}>
			<Divider orientation="left" plain>
				Personal Information
			</Divider>
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
			</Row>

			<Divider orientation="left" plain>
				Location & Demographics
			</Divider>
			<Row gutter={[16, 2]}>
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
					<Form.Item label="Citizenship" name="citizenship" rules={requiredFields}>
						<AutoComplete
							options={citizenshipOptions}
							placeholder="Citizenship"
							value={citizenship}
							onChange={setCitizenship}
							filterOption={(inputValue, option) =>
								option?.value
									? option.value.toUpperCase().includes(inputValue.toUpperCase())
									: false
							}
						/>
					</Form.Item>
				</Col>
				<Col {...responsiveColumn3}>
					<Form.Item label="Indigenous Group" name="indigenous_group" rules={requiredFields}>
						<AutoComplete
							options={indigenousOptions}
							placeholder="Indigenous Person (IP)"
							value={indigenous}
							onChange={setIndigenous}
							filterOption={(inputValue, option) =>
								option?.value
									? option.value.toUpperCase().includes(inputValue.toUpperCase())
									: false
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
								option?.value
									? option.value.toUpperCase().includes(inputValue.toUpperCase())
									: false
							}
						/>
					</Form.Item>
				</Col>
			</Row>

			<Divider orientation="left" plain>
				Classifications
			</Divider>
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
						<Checkbox>Head of Household?</Checkbox>
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
		</Form>
	);
};

export default ResidentEditTab;
