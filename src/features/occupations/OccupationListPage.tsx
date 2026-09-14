import CommonPageTitle from "@/components/ui/CommonPageTitle";

import { useDialog } from "@/hooks/useDialog";
import { PageContainer } from "@ant-design/pro-layout";
import { Button, App, Tabs } from "antd";
import { useCallback, useMemo, useState } from "react";
import MainLayout from "../../components/layout/Layout";

import OccupationTable from "./components/occupationTable";
import { useQuery, useMutation } from "@apollo/client";
import { GET_OCCUPATIONS, DELETE_OCCUPATION } from "@/graphql/occupation";
import AddOccupationModal from "./components/AddOccupationModal";

interface Occupation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const OccupationListPage: React.FC = () => {
  const addOccupation = useDialog(AddOccupationModal);
  const { message } = App.useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [occupations, setOccupations] = useState<Occupation[]>([]);

  // GraphQL Query
  const {
    data,
    loading: occupationLoading,
    refetch,
  } = useQuery<any>(GET_OCCUPATIONS, {
    variables: {
      search: searchTerm || undefined,
    },
    onCompleted: (data) => {
      if (data?.occupations?.success) {
        setOccupations(data.occupations.occupations);
      }
    },
    onError: (error) => {
      message.error("Failed to load occupations");
    },
  });

  //QUERY
  const refetchOccupations = useCallback(async () => {
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

  const handleAddOccupationModal = useCallback(
    (record?: Occupation) => {
      addOccupation({ record }, (result: string | null) => {
        if (result) {
          message.success(result);
        }
        refetchOccupations();
      });
    },
    [addOccupation, message, refetchOccupations]
  );

  const tableProps = useMemo(
    () => ({
      occupations,
      occupationLoading,
      handleAddOccupationModal,
      fetchOccupations: refetchOccupations,
      handleSearch,
    }),
    [occupations, occupationLoading, handleAddOccupationModal]
  );

  return (
    <MainLayout>
      <PageContainer
        title={<CommonPageTitle title="Occupation List" />}
        extra={[
          <Button type="primary" onClick={() => handleAddOccupationModal()}>
            Add Occupation
          </Button>,
        ]}
      >
        <Tabs
          defaultActiveKey="occupationList"
          items={[
            {
              label: "Occupation",
              key: "occupationList",
              children: <OccupationTable {...tableProps} />,
            },
          ]}
          size="small"
        />
      </PageContainer>
    </MainLayout>
  );
};

export default OccupationListPage;
