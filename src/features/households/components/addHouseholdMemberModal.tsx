import { Household, Resident } from "@/interfaces";
import { Button, Checkbox, Input, Modal, Table, Typography, App } from "antd";
import { TableProps } from "antd/lib";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import {
	GET_RESIDENTS,
	GET_RESIDENTS_WITHOUT_HOUSEHOLD,
} from "@/graphql/resident";

interface ModalProps {
	hide: (members: Resident[] | null) => void;
	record: Household;
}

function AddHouseholdMemberModal(props: ModalProps) {
	const { hide, record } = props;
	console.log("AddHouseholdMemberModal record:", props);
	const [residents, setResidents] = useState<Resident[]>([]);
	const [members, setMember] = useState<Resident[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const { message } = App.useApp();

	// GraphQL Query - fetch all residents
	const {
		data,
		loading: residentLoading,
		refetch,
	} = useQuery<any>(GET_RESIDENTS_WITHOUT_HOUSEHOLD, {
		variables: {
			search: searchTerm || undefined,
		},
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

	const handleSearch = async (value: string) => {
		setSearchTerm(value);
		await refetch({ search: value || undefined });
	};

	const onChange = (record: any, checked: boolean) => {
		setMember((prevChecked) =>
			checked
				? [...prevChecked, record]
				: prevChecked.filter((item) => item.id !== record.id),
		);
	};

	const columns: TableProps<Resident>["columns"] = [
		{
			title: "Name",
			key: "name",
			render: (_: any, record: any) =>
				`${record.first_name} ${record.middle_name} ${record.last_name}`,
		},
		{
			title: "Action",
			key: "action",
			width: 100,
			render: (_: any, record: any) => {
				return (
					<Checkbox
						onChange={(e) => onChange(record, e.target.checked)}
					></Checkbox>
				);
			},
		},
	];

	return (
		<Modal
			title={<Typography.Title level={3}>Add Members</Typography.Title>}
			width={800}
			maskClosable={false}
			open={true}
			onCancel={() => hide(null)}
			footer={[
				<Button
					form="householdForm"
					type="primary"
					onClick={() => {
						props.hide(members);
					}}
					//loading={loading}
				>
					Submit
				</Button>,
				<Button key="back" onClick={() => hide(null)}>
					Cancel
				</Button>,
			]}
		>
			<Input.Search
				placeholder="Search resident"
				allowClear
				enterButton
				style={{ marginBottom: 16 }}
				onSearch={handleSearch}
			/>
			<Table
				columns={columns}
				dataSource={residents}
				loading={residentLoading}
			/>
		</Modal>
	);
}

export default AddHouseholdMemberModal;
