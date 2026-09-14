import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, Col, Row } from "antd";
import { FileWordOutlined, BarChartOutlined, SettingOutlined } from "@ant-design/icons";
import MainLayout from "@/components/layout/Layout";
import CommonPageTitle from "@/components/ui/CommonPageTitle";
import { PageContainer } from "@ant-design/pro-layout";
import PopulationReport from "./components/PopulationReport";
import CertificatesPage from "@/features/certificates/CertificatesPage";
import ManageCertificateTemplatesPage from "@/features/certificates/ManageCertificateTemplatesPage";

type ActiveView = "menu" | "certificates" | "population" | "manage-templates";

const menuItems: { key: ActiveView; title: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { key: "certificates", title: "Certificates & Clearances", icon: <FileWordOutlined style={{ fontSize: 28 }} /> },
  { key: "population", title: "Population Report", icon: <BarChartOutlined style={{ fontSize: 28 }} /> },
  {
    key: "manage-templates",
    title: "Manage Certificate Templates",
    icon: <SettingOutlined style={{ fontSize: 28 }} />,
    adminOnly: true,
  },
];

const ReportsPage: React.FC = () => {
  const [active, setActive] = useState<ActiveView>("menu");
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const handleBack = () => setActive("menu");
  const visibleMenuItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

  if (active === "certificates") {
    return (
      <MainLayout>
        <PageContainer title={<CommonPageTitle title="Certificates & Clearances" />}>
          <CertificatesPage onBack={handleBack} />
        </PageContainer>
      </MainLayout>
    );
  }

  if (active === "population") {
    return (
      <MainLayout>
        <PageContainer title={<CommonPageTitle title="Population Report" />}>
          <PopulationReport onBack={handleBack} />
        </PageContainer>
      </MainLayout>
    );
  }

  if (active === "manage-templates" && isAdmin) {
    return (
      <MainLayout>
        <PageContainer title={<CommonPageTitle title="Manage Certificate Templates" />}>
          <ManageCertificateTemplatesPage onBack={handleBack} />
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer title={<CommonPageTitle title="Reports & Certifications" />}>
        <Row gutter={[16, 16]}>
          {visibleMenuItems.map((item) => (
            <Col key={item.key} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                onClick={() => setActive(item.key)}
                style={{ textAlign: "center", height: "100%" }}
                styles={{ body: { padding: "20px 12px" } }}
              >
                <div style={{ marginBottom: 10, color: "#1890ff" }}>{item.icon}</div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{item.title}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </PageContainer>
    </MainLayout>
  );
};

export default ReportsPage;
