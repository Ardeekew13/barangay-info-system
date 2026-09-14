import { CREATE_SITIO, UPDATE_SITIO } from "@/graphql/sitio";
import { useMutation } from "@apollo/client";
import { App, Form, Input, Modal } from "antd";

interface Sitio {
  id?: string;
  name: string;
}

interface ModalProps {
  hide: (result: string | null) => void;
  record?: Sitio;
}

const AddSitioModal: React.FC<ModalProps> = ({ hide, record }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!record?.id;

  // Create mutation
  const [createSitio, { loading: createLoading }] = useMutation<any>(CREATE_SITIO, {
    onCompleted: (data) => {
      if (data?.createSitio.success) {
        hide(data.createSitio.message);
      } else {
        message.error(data?.createSitio.message || "Failed to create sitio");
      }
    },
    onError: (error) => {
      message.error(error.message || "Failed to create sitio");
    },
  });

  // Update mutation
  const [updateSitio, { loading: updateLoading }] = useMutation<any>(UPDATE_SITIO, {
    onCompleted: (data) => {
      if (data?.updateSitio.success) {
        hide(data.updateSitio.message);
      } else {
        message.error(data?.updateSitio.message || "Failed to update sitio");
      }
    },
    onError: (error) => {
      message.error(error.message || "Failed to update sitio");
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit) {
        await updateSitio({
          variables: {
            id: record.id,
            input: {
              name: values.name,
            },
          },
        });
      } else {
        await createSitio({
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
      title={isEdit ? "Edit Sitio" : "Add Sitio"}
      onCancel={() => hide(null)}
      onOk={handleSubmit}
      confirmLoading={createLoading || updateLoading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={record}
      >
        <Form.Item
          name="name"
          label="Sitio Name"
          rules={[
            { required: true, message: "Please enter sitio name" },
            { min: 2, message: "Sitio name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="Enter sitio name" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddSitioModal;
