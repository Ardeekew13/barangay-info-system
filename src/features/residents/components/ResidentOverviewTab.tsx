import { Resident } from "@/interfaces";
import { getAge } from "@/utils/helper";
import { Descriptions, Divider, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
	resident: Resident;
}

const ResidentOverviewTab: React.FC<Props> = ({ resident }) => {
	return (
		<>
			<Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
				<Descriptions.Item label="First Name">
					{resident?.first_name}
				</Descriptions.Item>
				<Descriptions.Item label="Middle Name">
					{resident?.middle_name}
				</Descriptions.Item>
				<Descriptions.Item label="Last Name">
					{resident?.last_name}
				</Descriptions.Item>
				<Descriptions.Item label="Email">
					{resident?.email || "—"}
				</Descriptions.Item>
				<Descriptions.Item label="Birthdate">
					{dayjs(resident?.birthdate).format("MMMM DD, YYYY")}
				</Descriptions.Item>
				<Descriptions.Item label="Place of Birth">
					{resident?.place_of_birth}
				</Descriptions.Item>
				<Descriptions.Item label="Address">
					{resident?.address}
				</Descriptions.Item>
				<Descriptions.Item label="Gender">
					{resident?.gender}
				</Descriptions.Item>
				<Descriptions.Item label="Sitio">
					{resident?.sitio?.name}
				</Descriptions.Item>
				<Descriptions.Item label="Civil Status">
					{resident?.civil_status}
				</Descriptions.Item>
				<Descriptions.Item label="Occupation">
					{resident?.occupation}
				</Descriptions.Item>
				<Descriptions.Item label="Citizenship">
					{resident?.citizenship}
				</Descriptions.Item>
				<Descriptions.Item label="Indigenous Group">
					{resident?.indigenous_group}
				</Descriptions.Item>
			</Descriptions>

			<Divider orientation="left" plain>
				Tags & Classifications
			</Divider>
			<Space size={[8, 8]} wrap>
				{resident?.registered_voter && (
					<Tag color="blue">Registered Voter</Tag>
				)}
				{resident?.is_ofw && <Tag color="purple">OFW</Tag>}
				{resident?.is_solo_parent && <Tag color="magenta">Solo Parent</Tag>}
				{resident?.osc && <Tag color="orange">Out of School Youth</Tag>}
				{resident?.indigent && <Tag color="volcano">Indigent</Tag>}
				{resident?.isPwd && <Tag color="red">PWD</Tag>}
				{resident?.isHead && <Tag color="gold">Head of Household</Tag>}
				{!resident?.registered_voter &&
					!resident?.is_ofw &&
					!resident?.is_solo_parent &&
					!resident?.osc &&
					!resident?.indigent &&
					!resident?.isPwd && (
						<Text type="secondary">No tags assigned</Text>
					)}
			</Space>
		</>
	);
};

export default ResidentOverviewTab;
