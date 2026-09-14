import { CREATE_OCCUPATION, UPDATE_OCCUPATION } from "@/graphql/occupation";
import { useMutation } from "@apollo/client";
import { App, Form, Input, Modal } from "antd";

interface Occupation {
  id?: string;
  name: string;
}

interface ModalProps {
  hide: (result: string | null) => void;
  record?: Occupation;
}

const AddOccupationModal: React.FC<ModalProps> = ({ hide, record }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!record?.id;

  // Create mutation
  const [createOccupation, { loading: createLoading }] = useMutation<any>(CREATE_OCCUPATION, {
    onCompleted: (data) => {
      if (data?.createOccupation.success) {
        hide(data.createOccupation.message);
      } else {
        message.error(data?.createOccupation.message || "Failed to create occupation");
      }
    },
    onError: (error) => {
      message.error(error.message || "Failed to create occupation");
    },
  });

  // Update mutation
  const [updateOccupation, { loading: updateLoading }] = useMutation<any>(UPDATE_OCCUPATION, {
    onCompleted: (data) => {
      if (data?.updateOccupation.success) {
        hide(data.updateOccupation.message);
      } else {
        message.error(data?.updateOccupation.message || "Failed to update occupation");
      }
    },
    onError: (error) => {
      message.error(error.message || "Failed to update occupation");
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit) {
        await updateOccupation({
          variables: {
            id: record.id,
            input: {
              name: values.name,
            },
          },
        });
      } else {
        await createOccupation({
          variables: {
            input: {
              name: values.name,
            },
          },
        });
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      open
      title={isEdit ? "Edit Occupation" : "Add Occupation"}
      onCancel={() => hide(null)}
      onOk={handleSubmit}
      confirmLoading={createLoading || updateLoading}
      width={500}
    >
      <Form form={form} layout="vertical" initialValues={record}>
        <Form.Item
          name="name"
          label="Occupation Name"
          rules={[
            { required: true, message: "Please enter occupation name" },
            { min: 2, message: "Occupation name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="Enter occupation name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddOccupationModal;
