import { Typography } from "antd";

interface CommonPageTitleProps {
	title: string;
}

const CommonPageTitle: React.FC<CommonPageTitleProps> = ({ title }) => {
	return <Typography.Title level={4}>{title}</Typography.Title>;
};

export default CommonPageTitle;
