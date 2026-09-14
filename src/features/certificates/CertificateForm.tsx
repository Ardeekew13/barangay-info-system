import { useState } from "react";
import { Button, Form, Input, InputNumber, Select, Space, Card, App, Spin } from "antd";
import { useResidentOptions } from "@/hooks/useResidentOption";
import { renderCertificate, CertificateApiError } from "./api";
import CertificatePreview from "./CertificatePreview";

interface Placeholder {
  key: string;
  label: string;
  source: "resident" | "manual" | "system";
  type: string;
  required: boolean;
}

interface CertificateTemplateDto {
  key: string;
  name: string;
  placeholders: Placeholder[];
}

const CertificateForm: React.FC<{ template: CertificateTemplateDto; onBack: () => void }> = ({
  template,
  onBack,
}) => {
  const { residents, loading: residentsLoading } = useResidentOptions();
  const [residentId, setResidentId] = useState<string>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const { message } = App.useApp();

  const manualFields = template.placeholders.filter((p) => p.source === "manual");
  const needsResident = template.placeholders.some((p) => p.source === "resident");

  const handleRender = async (mode: "preview" | "generate") => {
    setMissingFields([]);
    if (needsResident && !residentId) {
      message.error("Please select a resident first.");
      return;
    }
    setSubmitting(true);
    try {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = await renderCertificate({ templateKey: template.key, residentId, values, mode, format: "pdf" });
      setPdfUrl(url);
      if (mode === "generate") message.success("Certificate generated and logged.");
    } catch (err) {
      if (err instanceof CertificateApiError) {
        message.error(err.message);
        if (err.fields) setMissingFields(err.fields);
      } else {
        message.error("Failed to generate certificate.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDocx = async () => {
    setMissingFields([]);
    if (needsResident && !residentId) {
      message.error("Please select a resident first.");
      return;
    }
    setSubmitting(true);
    try {
      const url = await renderCertificate({ templateKey: template.key, residentId, values, mode: "generate", format: "docx" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.key}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success("Certificate downloaded.");
    } catch (err) {
      if (err instanceof CertificateApiError) {
        message.error(err.message);
        if (err.fields) setMissingFields(err.fields);
      } else {
        message.error("Failed to download certificate.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={onBack}>← Back to Certificates</Button>
      </Space>
      <Card title={template.name}>
        <Form layout="vertical">
          {needsResident && (
            <Form.Item
              label="Resident"
              required
              validateStatus={missingFields.includes("FULL_NAME") ? "error" : undefined}
            >
              <Select
                showSearch
                placeholder="Search resident by name"
                options={residents}
                loading={residentsLoading}
                notFoundContent={residentsLoading ? <Spin size="small" /> : undefined}
                value={residentId}
                onChange={setResidentId}
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}
          {manualFields.map((f) => (
            <Form.Item
              key={f.key}
              label={f.label}
              required={f.required}
              validateStatus={missingFields.includes(f.key) ? "error" : undefined}
              help={missingFields.includes(f.key) ? "This field is required" : undefined}
            >
              {f.type === "currency" ? (
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  precision={2}
                  formatter={(value) => (value !== undefined ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                  parser={(value) => (value ? Number(value.replace(/,/g, "")) : 0) as any}
                  value={values[f.key] ? Number(values[f.key]) : undefined}
                  onChange={(val) => setValues((v) => ({ ...v, [f.key]: val === null ? "" : String(val) }))}
                />
              ) : (
                <Input
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </Form.Item>
          ))}
          <Space>
            <Button onClick={() => handleRender("preview")} loading={submitting}>
              Preview PDF
            </Button>
            <Button type="primary" onClick={() => handleRender("generate")} loading={submitting}>
              Generate & Log (PDF)
            </Button>
            <Button onClick={handleDownloadDocx} loading={submitting}>
              Download DOCX
            </Button>
          </Space>
        </Form>
      </Card>
      {pdfUrl && (
        <Card style={{ marginTop: 16 }}>
          <CertificatePreview pdfUrl={pdfUrl} templateKey={template.key} />
        </Card>
      )}
    </div>
  );
};

export default CertificateForm;
