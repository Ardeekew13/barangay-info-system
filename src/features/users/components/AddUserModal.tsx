import { CREATE_USER_ACCOUNT, UPDATE_USER_ACCOUNT } from "@/graphql/user";
import { useMutation } from "@apollo/client";
import { App, Form, Input, Modal, Select, Switch } from "antd";

interface UserAccount {
  id?: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface ModalProps {
  hide: (result: string | null) => void;
  record?: UserAccount;
  isSelf?: boolean;
}

const ROLE_OPTIONS = [
  { label: "Admin (full access)", value: "admin" },
  { label: "Encoder (create/update)", value: "encoder" },
  { label: "Viewer (read-only)", value: "viewer" },
];

const AddUserModal: React.FC<ModalProps> = ({ hide, record, isSelf }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!record?.id;

  const [createUserAccount, { loading: createLoading }] = useMutation<any>(CREATE_USER_ACCOUNT, {
    onCompleted: (data) => {
      if (data?.createUserAccount.success) {
        hide(data.createUserAccount.message);
      } else {
        message.error(data?.createUserAccount.message || "Failed to create account");
      }
    },
    onError: (error) => {
      message.error(error.message || "Failed to create account");
    },
  });

  const [updateUserAccount, { loading: updateLoading }] = useMutation<any>(UPDATE_USER_ACCOUNT, {
    onCompleted: (data) => {
      if (data?.updateUserAccount.success) {
        hide(data.updateUserAccount.message);
      } else {
        message.error(data?.updateUserAccount.message || "Failed to update account");
      }
    },
    onError: (error) => {
      message.error(error.message || "Failed to update account");
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit) {
        await updateUserAccount({
          variables: {
            id: record!.id,
            input: {
              name: values.name,
              role: values.role,
              isActive: values.isActive,
            },
          },
        });
      } else {
        await createUserAccount({
          variables: {
            input: {
              username: values.username,
              name: values.name,
              password: values.password,
              role: values.role,
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
      title={isEdit ? "Edit Account" : "Add Account"}
      onCancel={() => hide(null)}
      onOk={handleSubmit}
      confirmLoading={createLoading || updateLoading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={record ?? { role: "encoder", isActive: true }}
      >
        {!isEdit && (
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: "Please enter a username" },
              { min: 3, message: "Username must be at least 3 characters" },
              { pattern: /^[a-z0-9._-]+$/i, message: "Letters, numbers, dots, underscores, and dashes only" },
            ]}
          >
            <Input placeholder="e.g. jsantos" autoComplete="off" />
          </Form.Item>
        )}

        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: "Please enter a full name" }]}
        >
          <Input placeholder="e.g. Juan Santos" />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter a password" }, { min: 8, message: "At least 8 characters" }]}
          >
            <Input.Password placeholder="At least 8 characters" autoComplete="new-password" />
          </Form.Item>
        )}

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: "Please choose a role" }]}
          extra={isSelf ? "You can't change your own role." : undefined}
        >
          <Select options={ROLE_OPTIONS} disabled={isSelf} />
        </Form.Item>

        {isEdit && (
          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            extra={isSelf ? "You can't deactivate your own account." : "Deactivated accounts can't sign in."}
          >
            <Switch disabled={isSelf} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default AddUserModal;
