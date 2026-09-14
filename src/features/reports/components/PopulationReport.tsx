import { GET_POPULATION_REPORT } from "@/graphql/resident";
import { useQuery } from "@apollo/client";
import { Button, Card, Col, Row, Space, Statistic, Table, Typography } from "antd";

const { Title, Text } = Typography;

const PopulationReport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
	const { data, loading } = useQuery(GET_POPULATION_REPORT);
	const report = data?.populationReport?.report;

	const columns = [
		{
			title: "INDICATORS",
			dataIndex: "indicator",
			key: "indicator",
			width: "40%",
		},
		{
			title: "MALE",
			dataIndex: "male",
			key: "male",
			align: "center" as const,
			width: "20%",
		},
		{
			title: "FEMALE",
			dataIndex: "female",
			key: "female",
			align: "center" as const,
			width: "20%",
		},
		{
			title: "TOTAL",
			dataIndex: "total",
			key: "total",
			align: "center" as const,
			width: "20%",
		},
	];

	const toTableData = (items: any[]) =>
		(items || []).map((item: any) => ({ ...item, key: item.indicator }));

	const seniorColumns = [
		{ title: "Resident Code", dataIndex: "resident_code", key: "resident_code", width: "18%" },
		{ title: "Name", dataIndex: "name", key: "name", width: "28%" },
		{ title: "Age", dataIndex: "age", key: "age", align: "center" as const, width: "10%" },
		{ title: "Gender", dataIndex: "gender", key: "gender", align: "center" as const, width: "12%" },
		{ title: "Sitio", dataIndex: "sitio", key: "sitio", width: "16%" },
		{ title: "Address", dataIndex: "address", key: "address", width: "16%" },
	];

	return (
		<div>
			<Space style={{ marginBottom: 16 }}>
				<Button onClick={onBack}>← Back to Reports</Button>
			</Space>

			<Card style={{ marginBottom: 16 }} loading={loading}>
				<Row gutter={16}>
					<Col span={12}>
						<Text strong>Region:</Text> VII
						<br />
						<Text strong>Province:</Text> Bohol
						<br />
						<Text strong>City/Municipality:</Text> Bilar
						<br />
						<Text strong>Barangay:</Text> Zamora
					</Col>
					<Col span={12} style={{ textAlign: "right" }}>
						<Title level={4} style={{ margin: 0 }}>
							MONITORING REPORT
						</Title>
						<Text>
							Total No. of Barangay Inhabitants:{" "}
							<strong>{report?.totalInhabitants ?? "—"}</strong>
						</Text>
						<br />
						<Text strong>
							Male: {report?.totalMale ?? "—"} | Female:{" "}
							{report?.totalFemale ?? "—"}
						</Text>
					</Col>
				</Row>
			</Card>

			{/* Population by Age Bracket */}
			<Card
				title="Population by Age Bracket"
				style={{ marginBottom: 16 }}
				loading={loading}
			>
				<Table
					columns={columns}
					dataSource={toTableData(report?.ageBrackets)}
					pagination={false}
					size="small"
					bordered
					summary={() => (
						<Table.Summary.Row>
							<Table.Summary.Cell index={0}>
								<Text strong>TOTAL</Text>
							</Table.Summary.Cell>
							<Table.Summary.Cell index={1} align="center">
								<Text strong>{report?.totalMale ?? 0}</Text>
							</Table.Summary.Cell>
							<Table.Summary.Cell index={2} align="center">
								<Text strong>{report?.totalFemale ?? 0}</Text>
							</Table.Summary.Cell>
							<Table.Summary.Cell index={3} align="center">
								<Text strong>{report?.totalInhabitants ?? 0}</Text>
							</Table.Summary.Cell>
						</Table.Summary.Row>
					)}
				/>
			</Card>

			{/* Population by Sector */}
			<Card
				title="Population by Sector"
				style={{ marginBottom: 16 }}
				loading={loading}
			>
				<Table
					columns={columns}
					dataSource={toTableData(report?.sectors)}
					pagination={false}
					size="small"
					bordered
				/>
			</Card>

			{/* Civil Status */}
			<Card
				title="Civil Status"
				style={{ marginBottom: 16 }}
				loading={loading}
			>
				<Table
					columns={columns}
					dataSource={toTableData(report?.civilStatus)}
					pagination={false}
					size="small"
					bordered
				/>
			</Card>

			{/* Citizenship */}
			<Card title="Citizenship" style={{ marginBottom: 16 }} loading={loading}>
				<Table
					columns={columns}
					dataSource={toTableData(report?.citizenship)}
					pagination={false}
					size="small"
					bordered
					summary={() => {
						const items = report?.citizenship || [];
						const totalMale = items.reduce((s: number, r: any) => s + r.male, 0);
						const totalFemale = items.reduce((s: number, r: any) => s + r.female, 0);
						const total = items.reduce((s: number, r: any) => s + r.total, 0);
						return (
							<Table.Summary.Row>
								<Table.Summary.Cell index={0}>
									<Text strong>TOTAL</Text>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={1} align="center">
									<Text strong>{totalMale}</Text>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={2} align="center">
									<Text strong>{totalFemale}</Text>
								</Table.Summary.Cell>
								<Table.Summary.Cell index={3} align="center">
									<Text strong>{total}</Text>
								</Table.Summary.Cell>
							</Table.Summary.Row>
						);
					}}
				/>
			</Card>

			{/* Household / Family / Classification Summary */}
			<Card
				title="Household & Classification Summary"
				style={{ marginBottom: 16 }}
				loading={loading}
			>
				<Row gutter={[16, 16]}>
					<Col xs={12} sm={8} md={4}>
						<Statistic title="Total Household" value={report?.totalHouseholds ?? 0} />
					</Col>
					<Col xs={12} sm={8} md={4}>
						<Statistic title="Total Population" value={report?.totalInhabitants ?? 0} />
					</Col>
					<Col xs={12} sm={8} md={4}>
						<Statistic title="Total Families" value={report?.totalFamilies ?? 0} />
					</Col>
					<Col xs={12} sm={8} md={4}>
						<Statistic title="4P's" value={report?.total4Ps ?? 0} />
					</Col>
					<Col xs={12} sm={8} md={4}>
						<Statistic title="Senior Citizens" value={report?.totalSeniors ?? 0} />
					</Col>
					<Col xs={12} sm={8} md={4}>
						<Statistic title="Farmers" value={report?.totalFarmers ?? 0} />
					</Col>
				</Row>
			</Card>

			{/* List of Senior Citizens */}
			<Card title="List of Senior Citizens" style={{ marginBottom: 16 }} loading={loading}>
				<Table
					columns={seniorColumns}
					dataSource={(report?.seniorCitizens || []).map((s: any) => ({ ...s, key: s.id }))}
					pagination={false}
					size="small"
					bordered
				/>
			</Card>
		</div>
	);
};

export default PopulationReport;

