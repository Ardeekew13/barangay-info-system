import { SAVE_HOUSEHOLD } from "@/graphql/household";
import { useSitioOptions } from "@/hooks/useSitioOption";
import { requiredFields } from "@/utils/constant";
import { useMutation } from "@apollo/client";
import { App, Form, Modal, Select, Spin } from "antd";

interface Props {
	open: boolean;
	onClose: (householdId?: string, householdLabel?: string) => void;
}

const AddHouseholdFromEditModal: React.FC<Props> = ({
open,
onClose,
}) => {
	const [form] = Form.useForm();
	const { message } = App.useApp();
	const { sitios, loading: sitioLoading } = useSitioOptions();

	const [saveHousehold, { loading: saveLoading }] = useMutation<any>(
		SAVE_HOUSEHOLD,
		{
			onCompleted: (data) => {
				if (data?.saveHousehold.success) {
					const hh = data.saveHousehold.household;
					message.success("Household created successfully");
					form.resetFields();
					onClose(hh.id, hh.household_code);
				} else {
					message.error(
data?.saveHousehold.message || "Failed to create household",
);
				}
			},
			onError: () => {
				message.error("Failed to create household");
			},
		},
	);

	const handleOk = async () => {
		try {
			const values = await form.validateFields();

			await saveHousehold({
variables: {
input: {
sitioId: values.sitio,
},
},
});
		} catch (error) {
			// validation error
		}
	};

	return (
<Modal
			title="Create New Household"
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
				<Form.Item label="Sitio" name="sitio" rules={requiredFields}>
					<Select
						showSearch
						placeholder="Select Sitio"
						options={sitios}
						loading={sitioLoading}
						notFoundContent={sitioLoading ? <Spin size="small" /> : undefined}
						filterOption={(input, option) =>
							(option?.label ?? "")
								.toString()
								.toLowerCase()
								.includes(input.toLowerCase())
						}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default AddHouseholdFromEditModal;
