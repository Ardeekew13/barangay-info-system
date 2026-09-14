import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Card, Col, Row, Spin, Alert, Button, Space } from "antd";
import { FileWordOutlined } from "@ant-design/icons";
import { GET_CERTIFICATE_TEMPLATES } from "@/graphql/certificateTemplate";
import CertificateForm from "./CertificateForm";

const CertificatesPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [selectedKey, setSelectedKey] = useState<string>();
  const { data, loading, error } = useQuery(GET_CERTIFICATE_TEMPLATES, { variables: { activeOnly: true } });

  if (loading) return <Spin />;
  if (error || !data?.certificateTemplates?.success) {
    return <Alert type="error" message="Failed to load certificate templates" />;
  }

  const templates = data.certificateTemplates.templates;
  const selected = templates.find((t: any) => t.key === selectedKey);

  if (selected) {
    return <CertificateForm template={selected} onBack={() => setSelectedKey(undefined)} />;
  }

  return (
    <div>
      {onBack && (
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={onBack}>← Back to Reports</Button>
        </Space>
      )}
      <Row gutter={[16, 16]}>
        {templates.map((t: any) => (
          <Col key={t.key} xs={24} sm={12} md={8} lg={6}>
            <Card hoverable onClick={() => setSelectedKey(t.key)} style={{ textAlign: "center", height: "100%" }}>
              <div style={{ marginBottom: 10, color: "#1890ff" }}>
                <FileWordOutlined style={{ fontSize: 28 }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{t.name}</p>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CertificatesPage;
