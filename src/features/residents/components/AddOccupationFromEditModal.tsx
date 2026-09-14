import { CREATE_OCCUPATION } from "@/graphql/occupation";
import { requiredFields } from "@/utils/constant";
import { useMutation } from "@apollo/client";
import { App, Form, Input, Modal } from "antd";

interface Props {
	open: boolean;
	onClose: (occupationName?: string) => void;
}

const AddOccupationFromEditModal: React.FC<Props> = ({ open, onClose }) => {
	const [form] = Form.useForm();
	const { message } = App.useApp();

	const [createOccupation, { loading: saveLoading }] = useMutation<any>(
		CREATE_OCCUPATION,
		{
			onCompleted: (data) => {
				if (data?.createOccupation.success) {
					const occupation = data.createOccupation.occupation;
					message.success("Occupation added successfully");
					form.resetFields();
					onClose(occupation.name);
				} else {
					message.error(
						data?.createOccupation.message || "Failed to add occupation",
					);
				}
			},
			onError: (error) => {
				message.error(error.message || "Failed to add occupation");
			},
		},
	);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();

			await createOccupation({
				variables: {
					input: {
						name: values.name,
					},
				},
			});
		} catch (error) {
			// validation error
		}
	};

	return (
		<Modal
			title="Add New Occupation"
			open={open}
			onOk={handleOk}
			onCancel={() => {
				form.resetFields();
				onClose();
			}}
			confirmLoading={saveLoading}
			destroyOnClose
		>
			<Form form={form} layout="vertical" preserve={false}>
				<Form.Item label="Occupation Name" name="name" rules={requiredFields}>
					<Input placeholder="Enter occupation name" />
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default AddOccupationFromEditModal;
