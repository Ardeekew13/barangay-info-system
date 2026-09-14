import {
  useResidentHistory,
  ResidentHistoryEntry,
} from "@/hooks/useResidentHistory";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Empty, Skeleton, Space, Tag, Timeline, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

interface ResidentHistoryTabProps {
  residentId: string;
}

const ACTION_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  created: {
    color: "green",
    icon: <PlusCircleOutlined />,
    label: "Record created",
  },
  updated: {
    color: "blue",
    icon: <EditOutlined />,
    label: "Information updated",
  },
  deleted: {
    color: "red",
    icon: <DeleteOutlined />,
    label: "Record deleted",
  },
};

const ResidentHistoryTab: React.FC<ResidentHistoryTabProps> = ({
  residentId,
}) => {
  const { history, loading } = useResidentHistory(residentId);

  if (loading && history.length === 0) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  if (!loading && history.length === 0) {
    return (
      <Empty
        description="No edit history recorded yet"
        style={{ padding: "40px 0" }}
      />
    );
  }

  const items = history.map((entry: ResidentHistoryEntry) => {
    const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.updated;

    return {
      key: entry.id,
      color: config.color,
      dot: config.icon,
      children: (
        <div style={{ paddingBottom: 8 }}>
          <Space size={8} wrap>
            <Tag color={config.color}>{config.label}</Tag>
            <Space size={4}>
              <UserOutlined style={{ color: "#8c8c8c" }} />
              <Text strong>{entry.editedByName || "Unknown user"}</Text>
            </Space>
            <Space size={4}>
              <ClockCircleOutlined style={{ color: "#8c8c8c" }} />
              <Text type="secondary">
                {dayjs(entry.createdAt).format("MMM DD, YYYY [at] h:mm A")}
              </Text>
            </Space>
          </Space>

          {entry.changes.length > 0 && (
            <div
              style={{
                marginTop: 10,
                background: "#fafafa",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                {entry.changes.map((change) => (
                  <div key={change.field} style={{ fontSize: 13 }}>
                    <Text strong>{change.label}: </Text>
                    <Text type="secondary" delete>
                      {change.oldValue || "—"}
                    </Text>
                    <Text type="secondary"> → </Text>
                    <Text>{change.newValue || "—"}</Text>
                  </div>
                ))}
              </Space>
            </div>
          )}
        </div>
      ),
    };
  });

  return (
    <div style={{ paddingTop: 8 }}>
      <Timeline items={items} />
    </div>
  );
};

export default ResidentHistoryTab;
