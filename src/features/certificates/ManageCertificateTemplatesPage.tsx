import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  DeleteOutlined,
  EditOutlined,
  FileWordOutlined,
  InboxOutlined,
  SwapOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  DELETE_CERTIFICATE_TEMPLATE,
  GET_CERTIFICATE_TEMPLATES,
  SET_CERTIFICATE_TEMPLATE_ACTIVE,
} from "@/graphql/certificateTemplate";
import { uploadCertificateTemplate, replaceCertificateTemplateFile, TemplateFileApiError } from "./templateFileApi";
import EditPlaceholdersModal from "./EditPlaceholdersModal";

const { Text } = Typography;
const { Dragger } = Upload;

interface Placeholder {
  key: string;
  label: string;
  source: "resident" | "manual" | "system";
  type: string;
  required: boolean;
  options?: string[];
}

interface CertificateTemplateDto {
  id: string;
  key: string;
  name: string;
  category: string;
  version: number;
  isActive: boolean;
  updatedAt: string;
  placeholders: Placeholder[];
}

const ManageCertificateTemplatesPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { message } = App.useApp();
  const { data, loading, error, refetch } = useQuery(GET_CERTIFICATE_TEMPLATES, { variables: { activeOnly: false } });

  const [setActive] = useMutation(SET_CERTIFICATE_TEMPLATE_ACTIVE);
  const [deleteTemplate] = useMutation(DELETE_CERTIFICATE_TEMPLATE);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm] = Form.useForm();
  const [uploadFile, setUploadFile] = useState<File>();

  const [replaceKey, setReplaceKey] = useState<string>();
  const [replaceFile, setReplaceFile] = useState<File>();
  const [replacing, setReplacing] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplateDto>();

  const templates: CertificateTemplateDto[] = data?.certificateTemplates?.templates ?? [];

  const handleToggleActive = async (template: CertificateTemplateDto, isActive: boolean) => {
    try {
      const { data } = await setActive({ variables: { key: template.key, isActive } });
      if (!data?.setCertificateTemplateActive?.success) throw new Error(data?.setCertificateTemplateActive?.message);
      message.success(`"${template.name}" is now ${isActive ? "active" : "inactive"}.`);
      refetch();
    } catch (err: any) {
      message.error(err?.message || "Failed to update template status.");
    }
  };

  const handleDelete = async (template: CertificateTemplateDto) => {
    try {
      const { data } = await deleteTemplate({ variables: { key: template.key } });
      if (!data?.deleteCertificateTemplate?.success) throw new Error(data?.deleteCertificateTemplate?.message);
      message.success(`"${template.name}" deleted.`);
      refetch();
    } catch (err: any) {
      message.error(err?.message || "Failed to delete template.");
    }
  };

  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields();
      if (!uploadFile) {
        message.error("Please choose a .docx file to upload.");
        return;
      }
      setUploading(true);
      await uploadCertificateTemplate({
        key: values.key,
        name: values.name,
        category: values.category || "General",
        file: uploadFile,
      });
      message.success(`"${values.name}" uploaded. Review its placeholder mapping before use.`);
      setUploadOpen(false);
      uploadForm.resetFields();
      setUploadFile(undefined);
      refetch();
    } catch (err: any) {
      if (err instanceof TemplateFileApiError) {
        message.error(err.message);
      } else if (err?.errorFields) {
        // antd form validation error -- already shown inline
      } else {
        message.error("Failed to upload template.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async () => {
    if (!replaceKey || !replaceFile) return;
    setReplacing(true);
    try {
      const result = await replaceCertificateTemplateFile(replaceKey, replaceFile);
      const removed: string[] = result.removedTags ?? [];
      message.success(
        removed.length
          ? `File replaced (v${result.template.version}). Note: ${removed.join(", ")} no longer appear in the doc.`
          : `File replaced (v${result.template.version}).`
      );
      setReplaceKey(undefined);
      setReplaceFile(undefined);
      refetch();
    } catch (err: any) {
      message.error(err instanceof TemplateFileApiError ? err.message : "Failed to replace template file.");
    } finally {
      setReplacing(false);
    }
  };

  const columns = [
    {
      title: "Template",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: CertificateTemplateDto) => (
        <Space direction="vertical" size={0}>
          <Space size={6}>
            <FileWordOutlined style={{ color: "#1890ff" }} />
            <Text strong>{name}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.key}
          </Text>
        </Space>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: "Fields",
      key: "placeholders",
      render: (_: any, record: CertificateTemplateDto) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => setEditingTemplate(record)}>
          {record.placeholders.length} field{record.placeholders.length === 1 ? "" : "s"}
        </Button>
      ),
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (version: number) => `v${version}`,
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (updatedAt: string) => (updatedAt ? dayjs(Number(updatedAt) || updatedAt).format("MMM D, YYYY") : "—"),
    },
    {
      title: "Status",
      key: "isActive",
      render: (_: any, record: CertificateTemplateDto) => (
        <Switch
          checked={record.isActive}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: CertificateTemplateDto) => (
        <Space>
          <Button size="small" icon={<SwapOutlined />} onClick={() => setReplaceKey(record.key)}>
            Replace File
          </Button>
          <Popconfirm
            title="Delete this template?"
            description="This removes it from the generator and deletes its stored .docx. This can't be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        {onBack && <Button onClick={onBack}>← Back to Reports</Button>}
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
          Upload New Template
        </Button>
      </Space>

      <Table
        rowKey="key"
        loading={loading}
        dataSource={templates}
        columns={columns as any}
        pagination={false}
        locale={{ emptyText: error ? "Failed to load certificate templates." : "No templates yet." }}
      />

      {/* Upload new template */}
      <Modal
        title="Upload New Certificate Template"
        open={uploadOpen}
        onCancel={() => {
          setUploadOpen(false);
          uploadForm.resetFields();
          setUploadFile(undefined);
        }}
        onOk={handleUpload}
        confirmLoading={uploading}
        okText="Upload"
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            name="key"
            label="Key"
            tooltip="Lowercase, hyphenated, unique -- e.g. certificate-of-residency"
            rules={[
              { required: true, message: "Key is required" },
              { pattern: /^[a-z0-9-]+$/, message: "Use lowercase letters, numbers, and hyphens only" },
            ]}
          >
            <Input placeholder="certificate-of-residency" />
          </Form.Item>
          <Form.Item name="name" label="Display Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="Certificate of Residency" />
          </Form.Item>
          <Form.Item name="category" label="Category" initialValue="Certification">
            <Select
              options={[
                { value: "Certification", label: "Certification" },
                { value: "Clearance", label: "Clearance" },
                { value: "General", label: "General" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Template File (.docx)" required>
            <Dragger
              accept=".docx"
              maxCount={1}
              beforeUpload={(file) => {
                setUploadFile(file);
                return false; // prevent auto-upload; we send it ourselves on submit
              }}
              onRemove={() => setUploadFile(undefined)}
              fileList={
                uploadFile ? [{ uid: "1", name: uploadFile.name, status: "done" } as UploadFile] : []
              }
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag a .docx file here</p>
              <p className="ant-upload-hint">Placeholders like {"{{FULL_NAME}}"} are detected automatically.</p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      {/* Replace file for an existing template */}
      <Modal
        title="Replace Template File"
        open={!!replaceKey}
        onCancel={() => {
          setReplaceKey(undefined);
          setReplaceFile(undefined);
        }}
        onOk={handleReplace}
        confirmLoading={replacing}
        okText="Replace"
        okButtonProps={{ disabled: !replaceFile }}
      >
        <Text type="secondary">
          Uploading a new .docx keeps the same template key and generation form -- existing field mappings are kept
          for any placeholder still found in the new file.
        </Text>
        <Dragger
          style={{ marginTop: 12 }}
          accept=".docx"
          maxCount={1}
          beforeUpload={(file) => {
            setReplaceFile(file);
            return false;
          }}
          onRemove={() => setReplaceFile(undefined)}
          fileList={replaceFile ? [{ uid: "1", name: replaceFile.name, status: "done" } as UploadFile] : []}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag the replacement .docx here</p>
        </Dragger>
      </Modal>

      {editingTemplate && (
        <EditPlaceholdersModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(undefined)}
          onSaved={() => {
            setEditingTemplate(undefined);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default ManageCertificateTemplatesPage;
