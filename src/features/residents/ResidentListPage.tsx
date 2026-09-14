import CommonPageTitle from "@/components/ui/CommonPageTitle";

import { useDrawer } from "@/hooks/useDrawer";
import { Resident, ResidentFilters } from "@/interfaces";
import { FilterOutlined, UndoOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-layout";
import { Button, message, Space, Tabs } from "antd";
import { useCallback, useMemo, useState } from "react";
import MainLayout from "../../components/layout/Layout";
import ResidentFilterDrawer from "./components/residentDrawer";
import ResidentTable from "./components/residentTable";
import { useQuery, useMutation } from "@apollo/client";
import { GET_RESIDENTS, DELETE_RESIDENT } from "@/graphql/resident";
import { useRouter } from "next/router";

const About: React.FC = () => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchTerm, setSearchTerm] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const residentFilterDrawer = useDrawer();
  
  const [filters, setFilters] = useState<ResidentFilters>({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [totalCount, setTotalCount] = useState(0);

  // GraphQL Query
  const {
    data,
    loading: residentLoading,
    refetch,
  } = useQuery<any>(GET_RESIDENTS, {
    variables: {
      filters: filters,
      search: searchTerm || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    onCompleted: (data) => {
      if (data?.residents?.success) {
        setResidents(data.residents.residents);
        setTotalCount(data.residents.totalCount);
      }
    },
    onError: (error) => {
      messageApi.error("Failed to load residents");
    },
  });

  // GraphQL Mutation
  const [deleteResident] = useMutation<any>(DELETE_RESIDENT, {
    onCompleted: (data) => {
      if (data?.deleteResident.success) {
        messageApi.success(data.deleteResident.message);
        refetchResidents();
      } else {
        messageApi.error(data?.deleteResident.message || "Failed to delete");
      }
    },
    onError: () => {
      messageApi.error("Failed to delete resident");
    },
  });

  //QUERY
  const refetchResidents = async () => {
    await refetch({
      filters: filters,
      search: searchTerm || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
    await refetch({
      filters: filters,
      search: value || undefined,
      page: 1,
      pageSize: pagination.pageSize,
    });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize });
  };

  const handleDeleteResident = async (record: Resident) => {
    await deleteResident({
      variables: { id: record.id },
    });
  };

  const onResetFilter = () => {
    // Reset filter state
    setFilters({});
    refetchResidents();
  };

  const handleAddResidentModal = useCallback(
    () => {
      router.push("/manage/resident/manage");
    },
    [router]
  );

  const tableProps = useMemo(
    () => ({
      residents,
      residentLoading,
      fetchResidents: refetchResidents,
      handleDeleteResident,
      handleSearch,
      pagination: {
        current: pagination.page,
        pageSize: pagination.pageSize,
        total: totalCount,
        onChange: handlePageChange,
      },
    }),
    [residents, residentLoading, handleDeleteResident, pagination, totalCount]
  );

  return (
    <MainLayout>
      <PageContainer
        title={<CommonPageTitle title="Resident List" />}
        extra={[
          <Button type="primary" onClick={() => handleAddResidentModal()}>
            Add Resident
          </Button>,
        ]}
      >
        {contextHolder}
        <Tabs
          defaultActiveKey="residentList"
          items={[
            {
              label: "Resident",
              key: "residentList",
              children: <ResidentTable {...tableProps} />,
            },
          ]}
          size="small"
          tabBarExtraContent={
            <Space>
              <Button
                icon={<UndoOutlined />}
                shape="round"
                style={{
                  marginBottom: 10,
                }}
                onClick={onResetFilter}
                danger
              >
                Reset
              </Button>
              <Button
                icon={<FilterOutlined />}
                shape="round"
                style={{ marginBottom: 10 }}
                onClick={() => residentFilterDrawer.openDrawer()}
              >
                Filter
              </Button>
            </Space>
          }
        />
      </PageContainer>
      <ResidentFilterDrawer
        open={residentFilterDrawer.visible}
        onClose={() => residentFilterDrawer.closeDrawer()}
        filters={filters}
        setFilters={setFilters}
        onApply={refetchResidents}
      />
    </MainLayout>
  );
};

export default About;
