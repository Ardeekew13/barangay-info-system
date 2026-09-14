import { Button, Space } from "antd";

const CertificatePreview: React.FC<{ pdfUrl: string; templateKey?: string }> = ({ pdfUrl, templateKey }) => {
  const handlePrint = () => {
    const win = window.open(pdfUrl, "_blank");
    win?.addEventListener("load", () => win.print());
  };

  return (
    <div>
      <iframe
        src={pdfUrl}
        style={{ width: "100%", height: "80vh", border: "1px solid #d9d9d9" }}
        title="Certificate preview"
      />
      <Space style={{ marginTop: 12 }}>
        <Button type="primary" onClick={handlePrint}>
          Print
        </Button>
        <Button href={pdfUrl} download={templateKey ? `${templateKey}.pdf` : "certificate.pdf"}>
          Download PDF
        </Button>
      </Space>
    </div>
  );
};

export default CertificatePreview;

