import CommonPageTitle from "@/components/ui/CommonPageTitle";

import { useDialog } from "@/hooks/useDialog";
import { PageContainer } from "@ant-design/pro-layout";
import { Button, App, Tabs } from "antd";
import { useCallback, useMemo, useState } from "react";
import MainLayout from "../../components/layout/Layout";

import SitioTable from "./components/sitioTable";
import { useQuery, useMutation } from "@apollo/client";
import { GET_SITIOS, DELETE_SITIO } from "@/graphql/sitio";
import AddSitioModal from "./components/AddSitioModal";

interface Sitio {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const SitioListPage: React.FC = () => {
  const addSitio = useDialog(AddSitioModal);
  const { message } = App.useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [sitios, setSitios] = useState<Sitio[]>([]);

  // GraphQL Query
  const {
    data,
    loading: sitioLoading,
    refetch,
  } = useQuery<any>(GET_SITIOS, {
    variables: {
      search: searchTerm || undefined,
    },
    onCompleted: (data) => {
      if (data?.sitios?.success) {
        setSitios(data.sitios.sitios);
      }
    },
    onError: (error) => {
      message.error("Failed to load sitios");
    },
  });

  //QUERY
  const refetchSitios = useCallback(async () => {
    refetch({
      search: searchTerm || undefined,
    });
  }, [refetch, searchTerm]);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    await refetch({
      search: value || undefined,
    });
  };

  const handleAddSitioModal = useCallback(
    (record?: Sitio) => {
      addSitio({ record }, (result: string | null) => {
        if (result) {
          message.success(result);
        }
        refetchSitios();
      });
    },
    [addSitio, message, refetchSitios]
  );

  const tableProps = useMemo(
    () => ({
      sitios,
      sitioLoading,
      handleAddSitioModal,
      fetchSitios: refetchSitios,

      handleSearch,
    }),
    [sitios, sitioLoading, handleAddSitioModal]
  );

  return (
    <MainLayout>
      <PageContainer
        title={<CommonPageTitle title="Sitio List" />}
        extra={[
          <Button type="primary" onClick={() => handleAddSitioModal()}>
            Add Sitio
          </Button>,
        ]}
      >
        <Tabs
          defaultActiveKey="sitioList"
          items={[
            {
              label: "Sitio",
              key: "sitioList",
              children: <SitioTable {...tableProps} />,
            },
          ]}
          size="small"
        />
      </PageContainer>
    </MainLayout>
  );
};

export default SitioListPage;
