import { Avatar, Card, Typography } from "antd";
import styled from "styled-components";

const { Title, Text } = Typography;

interface IProps {
	title: string;
	total: number;
	icon: React.ReactNode;
}

const SummaryCard = (props: IProps) => {
	const { title, total, icon } = props;
	return (
		<Card
			style={{
				width: "100%",
			}}
		>
			<Div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>
					<Text type="secondary" style={{ fontSize: 16 }}>
						{title}
					</Text>
					<Title level={3} style={{ margin: 0 }}>
						{total}
					</Title>
				</div>
				<Avatar size={42} style={{ backgroundColor: "#012169" }} icon={icon} />
			</Div>
		</Card>
	);
};

export default SummaryCard;

const Div = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;
