import { EditOutlined, KeyOutlined } from "@ant-design/icons";
import { Button, Input, Space, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  users: UserAccount[];
  usersLoading: boolean;
  handleAddUserModal: (record?: UserAccount) => void;
  handleResetPasswordModal: (record: UserAccount) => void;
  handleSearch: (value: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "red",
  encoder: "blue",
  viewer: "default",
};

const UserTable: React.FC<UserTableProps> = ({
  users,
  usersLoading,
  handleAddUserModal,
  handleResetPasswordModal,
  handleSearch,
}) => {
  const columns: ColumnsType<UserAccount> = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: "Full Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => <Tag color={ROLE_COLORS[role] || "default"}>{role.toUpperCase()}</Tag>,
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Encoder", value: "encoder" },
        { text: "Viewer", value: "viewer" },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "default"}>{isActive ? "Active" : "Deactivated"}</Tag>
      ),
      filters: [
        { text: "Active", value: true },
        { text: "Deactivated", value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("MMM DD, YYYY hh:mm A"),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleAddUserModal(record)} />
          <Button type="link" icon={<KeyOutlined />} onClick={() => handleResetPasswordModal(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Input.Search
        placeholder="Search by username or name"
        style={{ marginBottom: 16 }}
        onSearch={handleSearch}
      />

      <Table
        columns={columns}
        dataSource={users}
        loading={usersLoading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} accounts`,
        }}
        size="small"
      />
    </div>
  );
};

export default UserTable;
