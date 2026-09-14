import CommonPageTitle from "@/components/ui/CommonPageTitle";
import { useDialog } from "@/hooks/useDialog";
import { GET_USERS } from "@/graphql/user";
import { PageContainer } from "@ant-design/pro-layout";
import { LockOutlined } from "@ant-design/icons";
import { useQuery } from "@apollo/client";
import { App, Button, Result } from "antd";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
import MainLayout from "../../components/layout/Layout";
import AddUserModal from "./components/AddUserModal";
import ResetPasswordModal from "./components/ResetPasswordModal";
import UserTable from "./components/UserTable";

interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserListPage: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const role = currentUser?.role;

  const addUser = useDialog(AddUserModal);
  const resetPassword = useDialog(ResetPasswordModal);
  const { message } = App.useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserAccount[]>([]);

  const { loading: usersLoading, refetch } = useQuery<any>(GET_USERS, {
    variables: { search: searchTerm || undefined },
    skip: role !== "admin",
    onCompleted: (data) => {
      if (data?.users?.success) {
        setUsers(data.users.users);
      }
    },
    onError: () => {
      message.error("Failed to load accounts");
    },
  });

  const refetchUsers = useCallback(async () => {
    refetch({ search: searchTerm || undefined });
  }, [refetch, searchTerm]);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    await refetch({ search: value || undefined });
  };

  const handleAddUserModal = useCallback(
    (record?: UserAccount) => {
      const isSelf = !!record?.id && record.id === currentUser?.id;
      addUser({ record, isSelf }, (result: string | null) => {
        if (result) {
          message.success(result);
        }
        refetchUsers();
      });
    },
    [addUser, currentUser?.id, message, refetchUsers]
  );

  const handleResetPasswordModal = useCallback(
    (record: UserAccount) => {
      resetPassword({ record }, (result: string | null) => {
        if (result) {
          message.success(result);
        }
      });
    },
    [resetPassword, message]
  );

  const tableProps = useMemo(
    () => ({
      users,
      usersLoading,
      handleAddUserModal,
      handleResetPasswordModal,
      handleSearch,
    }),
    [users, usersLoading, handleAddUserModal, handleResetPasswordModal]
  );

  if (role && role !== "admin") {
    return (
      <MainLayout>
        <PageContainer title={<CommonPageTitle title="Manage Accounts" />}>
          <Result
            icon={<LockOutlined />}
            title="Admins only"
            subTitle="Managing login accounts is restricted to admin accounts."
          />
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer
        title={<CommonPageTitle title="Manage Accounts" />}
        extra={[
          <Button type="primary" onClick={() => handleAddUserModal()}>
            Add Account
          </Button>,
        ]}
      >
        <UserTable {...tableProps} />
      </PageContainer>
    </MainLayout>
  );
};

export default UserListPage;
