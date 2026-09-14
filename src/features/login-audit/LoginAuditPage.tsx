import CommonPageTitle from "@/components/ui/CommonPageTitle";
import { useLoginAudits } from "@/hooks/useLoginAudits";
import { PageContainer } from "@ant-design/pro-layout";
import { LockOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Input, Result, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { useState } from "react";
import MainLayout from "../../components/layout/Layout";

const { Text } = Typography;

const REASON_LABELS: Record<string, string> = {
  success: "Signed in",
  invalid_username: "Unknown username",
  invalid_password: "Wrong password",
  inactive_account: "Account disabled",
  account_locked: "Account locked (too many attempts)",
};

const LoginAuditPage: React.FC = () => {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { audits, totalCount, loading, notAuthorized } = useLoginAudits({
    username,
    page,
    pageSize,
  });

  if (role && role !== "admin") {
    return (
      <MainLayout>
        <PageContainer title={<CommonPageTitle title="Login Activity" />}>
          <Result
            icon={<LockOutlined />}
            title="Admins only"
            subTitle="Login activity is restricted to admin accounts."
          />
        </PageContainer>
      </MainLayout>
    );
  }

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Status",
      dataIndex: "success",
      key: "success",
      render: (success: boolean) =>
        success ? <Tag color="green">Success</Tag> : <Tag color="red">Failed</Tag>,
    },
    {
      title: "Details",
      dataIndex: "reason",
      key: "reason",
      render: (reason: string) => REASON_LABELS[reason] || reason,
    },
    {
      title: "IP Address",
      dataIndex: "ip",
      key: "ip",
      render: (ip: string) => ip || "—",
    },
    {
      title: "Device",
      dataIndex: "userAgent",
      key: "userAgent",
      render: (ua: string) => (
        <Tooltip title={ua}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {ua ? (ua.length > 40 ? `${ua.slice(0, 40)}…` : ua) : "—"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => dayjs(value).format("MMM DD, YYYY h:mm A"),
    },
  ];

  return (
    <MainLayout>
      <PageContainer title={<CommonPageTitle title="Login Activity" />}>
        {notAuthorized && (
          <Alert
            type="warning"
            showIcon
            message="You don't have permission to view this."
            style={{ marginBottom: 16 }}
          />
        )}

        <Input
          placeholder="Search by username"
          prefix={<SearchOutlined />}
          allowClear
          style={{ maxWidth: 320, marginBottom: 16 }}
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          onPressEnter={() => {
            setUsername(usernameInput || undefined);
            setPage(1);
          }}
        />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={audits}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </PageContainer>
    </MainLayout>
  );
};

export default LoginAuditPage;
