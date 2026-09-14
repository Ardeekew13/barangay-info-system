import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { App, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        message.error("Invalid username or password");
        setLoading(false);
        return;
      }

      // Keep the button in its loading state through the redirect itself --
      // resetting it here made the button flash back to "Sign In" for a
      // moment while the next page was still loading. It naturally clears
      // once this page unmounts after the route change completes.
      router.replace("/");
    } catch (error) {
      message.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1E3A8A 0%, #1e5799 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        styles={{ body: { padding: "40px 36px" } }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <img src="/zamora.png" alt="Zamora" style={{ width: 56, height: 56 }} />
            <img src="/bilar.png" alt="Bilar" style={{ width: 56, height: 56 }} />
          </div>
          <Title level={4} style={{ margin: 0, color: "#1E3A8A" }}>
            Barangay Zamora
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Information Management System
          </Text>
        </div>

        <Form layout="vertical" onFinish={handleLogin} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please enter your username" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Username"
              autoComplete="username"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 44, borderRadius: 8, fontSize: 15 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Barangay Zamora, Bilar, Bohol · Philippines
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
