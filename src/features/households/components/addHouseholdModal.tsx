import { useDialog } from "@/hooks/useDialog";
import { useSitioOptions } from "@/hooks/useSitioOption";
import { Members, Resident, ResidentHousehold } from "@/interfaces";
import { requiredFields } from "@/utils/constant";
import { getAge } from "@/utils/helper";
import {
	App,
	Button,
	Card,
	Col,
	Form,
	Input,
	Modal,
	Popconfirm,
	Row,
	Select,
	Space,
	Spin,
	Table,
	Tag,
	Typography,
} from "antd";
import { TableProps } from "antd/lib";
import dayjs from "dayjs";
import { useState } from "react";

import { DELETE_HOUSEHOLD_MEMBER, GET_HOUSEHOLDS, SAVE_HOUSEHOLD } from "@/graphql/household";
import { GET_RESIDENTS_WITHOUT_HOUSEHOLD } from "@/graphql/resident";
import { useMutation, useQuery } from "@apollo/client";
import AddHouseholdMemberModal from "./addHouseholdMemberModal";

interface ModalProps {
	hide: (result: boolean) => void;
	record: ResidentHousehold;
	fetchHouseholds: () => void;
}

function AddHouseholdModal(props: ModalProps) {
	console.log("AddHouseholdModal record:", props);
	const { hide, record, fetchHouseholds } = props;
	const [form] = Form.useForm();
	const { sitios, loading: sitioLoading } = useSitioOptions();
	const [selectedMembers, setSelectedMembers] = useState<Members[]>(
		record?.members ?? [],
	);

	// Options for "which household is this one under" -- every other household
	// (a married child's family can be placed under their parents' household while
	// still keeping its own single head).
	const { data: householdsData, loading: householdsLoading } = useQuery<any>(GET_HOUSEHOLDS);
	const parentHouseholdOptions = (householdsData?.households?.households ?? [])
		.filter((hh: any) => hh.id !== record?.id)
		.map((hh: any) => ({
			value: hh.id,
			label: `${hh.household_code}${hh.head_of_household ? ` — ${hh.head_of_household.first_name} ${hh.head_of_household.last_name}` : ""}`,
		}));
	const addMembers = useDialog(AddHouseholdMemberModal);
	const { message } = App.useApp();
	const [showResidentTable, setShowResidentTable] = useState<Boolean>(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [resident, setResidents] = useState<Resident[]>([]);

	const {
		data,
		loading: residentLoading,
		refetch,
	} = useQuery<any>(GET_RESIDENTS_WITHOUT_HOUSEHOLD, {
		variables: {
			search: searchTerm || undefined,
		},
		skip: !showResidentTable,
		onCompleted: (data) => {
			if (data?.getResidentWithoutHousehold?.success) {
				// Filter out residents who are already heads of household
				const nonHeadResidents =
					data.getResidentWithoutHousehold.residents.filter(
						(resident: Resident) => !resident.isHead,
					);
				setResidents(nonHeadResidents);
			}
		},
		onError: (error) => {
			message.error("Failed to load residents");
		},
	});

	// GraphQL Mutations
	const [saveHousehold, { loading: saveLoading }] = useMutation<any>(
		SAVE_HOUSEHOLD,
		{
			onCompleted: (data) => {
				if (data?.saveHousehold.success) {
					hide(data.saveHousehold.message);
					fetchHouseholds();
				} else {
					message.error(
						data?.saveHousehold.message || "Failed to save household",
					);
				}
			},
			onError: () => {
				message.error("Failed to save household");
			},
		},
	);

	const [handleRemove, { loading: removeLoading }] = useMutation<any>(
		DELETE_HOUSEHOLD_MEMBER,
		{
			onCompleted: (data) => {
				if (data?.deleteHouseholdMember.success) {
					message.success(data.deleteHouseholdMember.message);
					fetchHouseholds();
				} else {
					message.error(
						data?.deleteHouseholdMember.message || "Failed to remove member",
					);
				}
			},
			onError: () => {
				message.error("Failed to remove member from household");
			},
		},
	);

	const handleDeleteHousehold = (member: Members) => {
		handleRemove({
			variables: {
				residentId: member.id,
			},
		});
		setSelectedMembers((prev) => prev.filter((m) => m.id !== member.id));
	};

	const loading = saveLoading || removeLoading;

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			console.log("Form Values:", values);

			const input: any = {
				sitioId: values.sitio?.value || values.sitio,
				membersIds: selectedMembers.map((member) => member.id),
				parentHouseholdId: values.parentHouseholdId || null,
			};

			const head = selectedMembers.find((m) => m.isHead);
			if (head) {
				input.headResidentId = head.id;
			}

			// Use saveHousehold for both create and update
			await saveHousehold({
				variables: {
					id: record?.id, // undefined for create, ID for update
					input,
				},
			});
		} catch (error: any) {
			console.log("ERROR", error);
		}
	};

	const handleSetHead = (memberId: number) => {
		setSelectedMembers((prev) =>
			prev.map((m) => ({
				...m,
				isHead: m.id === memberId,
			})),
		);
	};

	const residentColumn: TableProps<Resident>["columns"] = [
		{
			title: "Name",
			key: "name",
			render: (_: any, record: Resident) => {
				return (
					<>
						{`${record?.first_name} ${record.middle_name || ""} ${record.last_name}`.trim()}
						{record?.isHead && (
							<Tag color="blue" style={{ marginLeft: 6 }}>
								Head
							</Tag>
						)}
					</>
				);
			},
		},
		{
			title: "Age",
			key: "age",
			render: (_: any, record: any) => getAge(record.birthdate),
			width: 100,
		},
		{
			title: "Birth Date",
			dataIndex: "birthdate",
			key: "birthdate",
			render: (val: string) => dayjs(val).format("MMMM DD, YYYY"),
			width: 150,
		},
		{
			title: "Actions",
			key: "actions",
			width: 220,
			align: "center",
			render: (_: any, record: Resident) => {
				let isSelected = selectedMembers.some(
					(member) => member.id === record.id,
				);
				return (
					<Space>
						<Button
							type="primary"
							size="middle"
							disabled={isSelected}
							onClick={() => handleAddMember(record)}
						>
							Add Member
						</Button>
					</Space>
				);
			},
		},
	];

	const columns: TableProps<Members>["columns"] = [
		{
			title: "Resident Code",
			key: "resident_code",
			dataIndex: "resident_code",
			width: 150,
		},
		{
			title: "Name",
			key: "name",

			render: (_: any, record: Members) => {
				return (
					<>
						{`${record?.first_name} ${record.middle_name || ""} ${record.last_name}`.trim()}
						{record?.isHead && (
							<Tag color="blue" style={{ marginLeft: 6 }}>
								Head
							</Tag>
						)}
					</>
				);
			},
		},
		{
			title: "Age",
			key: "age",
			width: 100,
			render: (_: any, record: any) => getAge(record.birthdate),
		},
		{
			title: "Birth Date",
			dataIndex: "birthdate",
			key: "birthdate",
			render: (val: string) => dayjs(val).format("MMMM DD, YYYY"),
			width: 150,
		},
		{
			title: "Actions",
			key: "actions",
			width: 200,
			render: (_: any, record: Members) => (
				<Space>
					{!record.isHead && (
						<Button
							size="middle"
							type="primary"
							onClick={() => handleSetHead(record.id)}
						>
							Set as Head
						</Button>
					)}
					<Popconfirm
						title="Remove resident from this household?"
						description="Are you sure to remove this resident from this household?"
						onConfirm={() => handleDeleteHousehold(record)}
						okText="Yes"
						cancelText="No"
					>
						<Button
							size="middle"
							danger
							style={{ backgroundColor: "red", color: "white" }}
						>
							Remove
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	const handleAddMember = (resident: Resident) => {
		if (!resident.id) return;

		setSelectedMembers((prev) => [
			...prev,
			{
				id: resident.id!,
				resident_code: resident.resident_code,
				first_name: resident.first_name,
				middle_name: resident.middle_name,
				last_name: resident.last_name,
				birthdate: resident.birthdate,
				isHead: false,
				civil_status: resident.civil_status,
			},
		]);
	};

	return (
		<Modal
			title={<Typography.Title level={3}>Add Household</Typography.Title>}
			width="100vw"
			style={{ top: 0, maxWidth: "100vw", paddingBottom: 0 }}
			styles={{ body: { height: "calc(100vh - 110px)", overflowY: "auto" } }}
			maskClosable={false}
			open={true}
			onCancel={() => hide(false)}
			footer={[
				<Button
					form="householdForm"
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
				name="householdForm"
				onFinish={handleSubmit}
				initialValues={{
					sitio:
						record?.sitio && typeof record.sitio === "object"
							? {
									value: (record.sitio as any).id,
									label: (record.sitio as any).name,
								}
							: undefined,
					parentHouseholdId: record?.parentHousehold?.id,
				}}
			>
				<Row gutter={[16, 2]}>
					<Col span={24}>
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
					<Col span={24}>
						<Form.Item
							label="Under Household (optional)"
							name="parentHouseholdId"
							tooltip="If this family lives in the same house as another household -- e.g. a married child staying with their parents -- pick that household here. Each household still has its own single head."
						>
							<Select
								placeholder="None -- this is its own standalone household"
								allowClear
								loading={householdsLoading}
								notFoundContent={householdsLoading ? <Spin size="small" /> : undefined}
								options={parentHouseholdOptions}
							/>
						</Form.Item>
					</Col>
				</Row>
			</Form>
			<Row>
				<Col span={24} style={{ textAlign: "right", marginBottom: 12 }}>
					<Button
						type="primary"
						onClick={() => setShowResidentTable(!showResidentTable)}
					>
						{showResidentTable ? "Close" : "Add Member"}
					</Button>
				</Col>
			</Row>
			{showResidentTable && (
				<Card style={{ marginBottom: 24 }}>
					<Typography.Title level={4} style={{ marginBottom: 8 }}>
						Resident Without Household
					</Typography.Title>
					<Input.Search
						name="filter"
						placeholder="Search resident"
						allowClear
						style={{ marginBottom: 24}}
					/>
					<Table
						dataSource={resident ?? ([] as Members[])}
						loading={residentLoading}
						columns={residentColumn}
						size="small"
						rowKey="key"
						scroll={{ x: 800 }}
						pagination={{ pageSize: 5, size: "small" }}
						style={{ marginBottom: 16 }}
						bordered
					/>
				</Card>
			)}

			<Table
				dataSource={selectedMembers ?? ([] as Members[])}
				loading={residentLoading}
				columns={columns}
				size="small"
				rowKey="key"
				scroll={{ x: 800 }}
				pagination={false}
				bordered
				title={() => (
					<Typography.Title level={4} style={{ marginBottom: 8 }}>
						Household Members
					</Typography.Title>
				)}
			/>
		</Modal>
	);
}

export default AddHouseholdModal;
