import { useState } from "react";
import { useMutation } from "@apollo/client";
import { App, Button, Input, Modal, Select, Switch, Table, Typography } from "antd";
import { UPDATE_CERTIFICATE_TEMPLATE_PLACEHOLDERS } from "@/graphql/certificateTemplate";

const { Text } = Typography;

interface Placeholder {
  key: string;
  label: string;
  source: "resident" | "manual" | "system";
  type: string;
  required: boolean;
  options?: string[];
}

interface Template {
  key: string;
  name: string;
  placeholders: Placeholder[];
}

const SOURCE_OPTIONS = [
  { value: "system", label: "System (auto -- date, captain, barangay, etc.)" },
  { value: "resident", label: "Resident (from the selected resident record)" },
  { value: "manual", label: "Manual (clerk types it in)" },
];

/**
 * Lets an admin review/adjust how each {{TOKEN}} found in a template's .docx
 * gets its value at generation time -- this is what the clerk-facing
 * CertificateForm reads to decide which fields to show and which to fill
 * automatically.
 */
const EditPlaceholdersModal: React.FC<{
  template: Template;
  onClose: () => void;
  onSaved: () => void;
}> = ({ template, onClose, onSaved }) => {
  const { message } = App.useApp();
  const [placeholders, setPlaceholders] = useState<Placeholder[]>(
    template.placeholders.map((p) => ({ ...p }))
  );
  const [saving, setSaving] = useState(false);

  const [updatePlaceholders] = useMutation(UPDATE_CERTIFICATE_TEMPLATE_PLACEHOLDERS);

  const updateRow = (key: string, patch: Partial<Placeholder>) => {
    setPlaceholders((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updatePlaceholders({
        variables: {
          key: template.key,
          placeholders: placeholders.map(({ key, label, source, type, required, options }) => ({
            key,
            label,
            source,
            type: type || "text",
            required,
            options: options ?? [],
          })),
        },
      });
      if (!data?.updateCertificateTemplatePlaceholders?.success) {
        throw new Error(data?.updateCertificateTemplatePlaceholders?.message);
      }
      message.success("Field mapping saved.");
      onSaved();
    } catch (err: any) {
      message.error(err?.message || "Failed to save field mapping.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Placeholder",
      dataIndex: "key",
      key: "key",
      render: (key: string) => <Text code>{`{{${key}}}`}</Text>,
    },
    {
      title: "Label (shown to clerk)",
      dataIndex: "label",
      key: "label",
      render: (label: string, record: Placeholder) => (
        <Input value={label} onChange={(e) => updateRow(record.key, { label: e.target.value })} />
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source: Placeholder["source"], record: Placeholder) => (
        <Select
          value={source}
          options={SOURCE_OPTIONS}
          style={{ width: 260 }}
          onChange={(value) => updateRow(record.key, { source: value })}
        />
      ),
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      width: 90,
      render: (required: boolean, record: Placeholder) => (
        <Switch checked={required} onChange={(checked) => updateRow(record.key, { required: checked })} />
      ),
    },
  ];

  return (
    <Modal
      title={`Field Mapping — ${template.name}`}
      open
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText="Save"
      width={760}
    >
      <Text type="secondary">
        "System" fields fill in automatically (today's date, the sitting captain, etc). "Resident" fields come from
        whichever resident is picked on the generation form. "Manual" fields are typed in by the clerk each time.
      </Text>
      <Table
        style={{ marginTop: 12 }}
        rowKey="key"
        dataSource={placeholders}
        columns={columns as any}
        pagination={false}
        size="small"
      />
    </Modal>
  );
};

export default EditPlaceholdersModal;
