import { RESET_USER_ACCOUNT_PASSWORD } from "@/graphql/user";
import { useMutation } from "@apollo/client";
import { App, Form, Input, Modal } from "antd";

interface ModalProps {
  hide: (result: string | null) => void;
  record: { id: string; username: string };
}

const ResetPasswordModal: React.FC<ModalProps> = ({ hide, record }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const [resetPassword, { loading }] = useMutation<any>(RESET_USER_ACCOUNT_PASSWORD, {
    onCompleted: (data) => {
      if (data?.resetUserAccountPassword.success) {
        hide(data.resetUserAccountPassword.message);
      } else {
        message.error(data?.resetUserAccountPassword.message || "Failed to reset password");
      }
    },
    onError: (error) => {
      message.error(error.message || "Failed to reset password");
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await resetPassword({ variables: { id: record.id, newPassword: values.newPassword } });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      open
      title={`Reset Password -- ${record.username}`}
      onCancel={() => hide(null)}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={440}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[{ required: true, message: "Please enter a new password" }, { min: 8, message: "At least 8 characters" }]}
        >
          <Input.Password placeholder="At least 8 characters" autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ResetPasswordModal;
