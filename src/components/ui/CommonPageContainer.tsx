import { Card } from "antd";

interface Props {
	title: React.ReactNode;
	children: React.ReactNode;
}

export const CommonPageContainer: React.FC<Props> = ({ title, children }) => {
	return <Card title={title}>{children}</Card>;
};
