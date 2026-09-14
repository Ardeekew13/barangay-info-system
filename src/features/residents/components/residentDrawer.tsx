import { useSitioOptions } from "@/hooks/useSitioOption";
import { ResidentFilters } from "@/interfaces";
import {
  Button,
  Col,
  Drawer,
  Form,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
  Divider,
} from "antd";
import { DrawerProps } from "antd/lib";
import { FilterOutlined, UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

export interface ResidentFilterDrawerProps extends DrawerProps {
  onClose?: () => void;
  filters: ResidentFilters;
  setFilters: (filters: ResidentFilters) => void;
  onApply: () => void;
}

const ResidentFilterDrawer: React.FC<ResidentFilterDrawerProps> = ({
  open,
  onClose,
  filters,
  setFilters,
  onApply,
  ...rest
}) => {
  const [form] = Form.useForm();
  const { sitios, loading: sitioLoading } = useSitioOptions();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <Space>
          <FilterOutlined />
          <span>Filter Residents</span>
        </Space>
      }
      width={400}
      {...rest}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={filters}
      >
        {/* Location Section */}
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
            <UserOutlined /> LOCATION
          </Text>
          <Divider style={{ margin: "12px 0" }} />
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="sitioId" label="Sitio">
                <Select
                  options={sitios}
                  loading={sitioLoading}
                  notFoundContent={sitioLoading ? <Spin size="small" /> : undefined}
                  allowClear
                  placeholder="Select sitio"
                  onChange={(value) => {
                    setFilters({ ...filters, sitioId: value });
                  }}
                  value={filters.sitioId}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Demographics Section */}
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
            DEMOGRAPHICS
          </Text>
          <Divider style={{ margin: "12px 0" }} />
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="civil_status" label="Civil Status">
                <Select
                  options={[
                    { value: "Single", label: "Single" },
                    { value: "Married", label: "Married" },
                  ]}
                  allowClear
                  placeholder="Select civil status"
                  onChange={(value) => {
                    setFilters({ ...filters, civil_status: value });
                  }}
                  value={filters.civil_status}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Special Categories Section */}
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
            SPECIAL CATEGORIES
          </Text>
          <Divider style={{ margin: "12px 0" }} />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item name="is_ofw" label="OFW" valuePropName="checked">
                <Switch 
                  checkedChildren="Yes" 
                  unCheckedChildren="No"
                  checked={filters.is_ofw}
                  onChange={(checked) => {
                    setFilters({ ...filters, is_ofw: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_solo_parent"
                label="Solo Parent"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Yes" 
                  unCheckedChildren="No"
                  checked={filters.is_solo_parent}
                  onChange={(checked) => {
                    setFilters({ ...filters, is_solo_parent: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="osc" label="OSC" valuePropName="checked">
                <Switch 
                  checkedChildren="Yes" 
                  unCheckedChildren="No"
                  checked={filters.osc}
                  onChange={(checked) => {
                    setFilters({ ...filters, osc: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="indigent"
                label="Indigent"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Yes" 
                  unCheckedChildren="No"
                  checked={filters.indigent}
                  onChange={(checked) => {
                    setFilters({ ...filters, indigent: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_pwd" label="PWD" valuePropName="checked">
                <Switch 
                  checkedChildren="Yes" 
                  unCheckedChildren="No"
                  checked={filters.isPwd}
                  onChange={(checked) => {
                    setFilters({ ...filters, isPwd: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="registered_voter"
                label="Voter"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  checked={filters.registered_voter}
                  onChange={(checked) => {
                    setFilters({ ...filters, registered_voter: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is4Ps" label="4P's" valuePropName="checked">
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  checked={filters.is4Ps}
                  onChange={(checked) => {
                    setFilters({ ...filters, is4Ps: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isSeniorCitizen"
                label="Senior Citizen"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  checked={filters.isSeniorCitizen}
                  onChange={(checked) => {
                    setFilters({ ...filters, isSeniorCitizen: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isNHTS" label="NHTS" valuePropName="checked">
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  checked={filters.isNHTS}
                  onChange={(checked) => {
                    setFilters({ ...filters, isNHTS: checked });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isFarmer" label="Farmer" valuePropName="checked">
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  checked={filters.isFarmer}
                  onChange={(checked) => {
                    setFilters({ ...filters, isFarmer: checked });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Space style={{ width: "100%" }} direction="vertical" size={8}>
          <Button
            type="primary"
            block
            size="large"
            icon={<FilterOutlined />}
            onClick={() => {
              onApply();
              onClose?.();
            }}
          >
            Apply Filters
          </Button>
          <Button
            onClick={() => {
              setFilters({});
              form.resetFields();
              onApply();
              onClose?.();
            }}
            block
            size="large"
          >
            Clear All
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};

export default ResidentFilterDrawer;
