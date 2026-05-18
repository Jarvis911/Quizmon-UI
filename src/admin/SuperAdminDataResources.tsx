import {
  Datagrid,
  DateField,
  ExportButton,
  FilterButton,
  FunctionField,
  List,
  NumberField,
  Pagination,
  SearchInput,
  SelectInput,
  Show,
  ShowButton,
  SimpleShowLayout,
  TextField,
  TopToolbar,
} from "react-admin";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BarChartIcon from "@mui/icons-material/BarChart";
import { OrganizationToolbarFilter } from "@/admin/superAdminOrgToolbar";

const listToolbar = (
  <TopToolbar>
    <OrganizationToolbarFilter />
    <FilterButton />
    <ExportButton />
  </TopToolbar>
);

const searchOnlyFilter = [<SearchInput key="search" source="search" alwaysOn placeholder="Search..." />];

export const organizationIcon = BusinessIcon;
export const classroomIcon = SchoolIcon;
export const matchIcon = SportsEsportsIcon;
export const homeworkIcon = AssignmentIcon;
export const subscriptionIcon = SubscriptionsIcon;
export const paymentIcon = ReceiptIcon;
export const usageMetricIcon = BarChartIcon;

export const OrganizationList = () => (
  <List
    actions={listToolbar}
    filters={[<SearchInput key="search" source="search" alwaysOn placeholder="Name or slug..." />]}
    perPage={25}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
  >
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
      <FunctionField
        label="Members"
        render={(r: { _count?: { members?: number } }) => String(r._count?.members ?? 0)}
      />
      <FunctionField
        label="Plan"
        render={(r: { subscriptions?: { plan?: { name?: string } }[] }) =>
          r.subscriptions?.[0]?.plan?.name ?? "—"
        }
      />
      <DateField source="createdAt" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);

export const OrganizationShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
      <TextField source="logoUrl" emptyText="—" />
      <FunctionField
        label="Members"
        render={(r: { _count?: { members?: number } }) => String(r._count?.members ?? 0)}
      />
      <FunctionField
        label="Quizzes"
        render={(r: { _count?: { quizzes?: number } }) => String(r._count?.quizzes ?? 0)}
      />
      <FunctionField
        label="Classrooms"
        render={(r: { _count?: { classrooms?: number } }) => String(r._count?.classrooms ?? 0)}
      />
      <FunctionField
        label="Matches"
        render={(r: { _count?: { matches?: number } }) => String(r._count?.matches ?? 0)}
      />
      <FunctionField
        label="Current plan"
        render={(r: { subscriptions?: { plan?: { name?: string }; status?: string }[] }) => {
          const sub = r.subscriptions?.[0];
          if (!sub) return "—";
          return `${sub.plan?.name ?? "—"} (${sub.status ?? ""})`;
        }}
      />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);

export const ClassroomList = () => (
  <List
    actions={listToolbar}
    filters={searchOnlyFilter}
    perPage={25}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
  >
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="name" />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string } }) => r.organization?.name ?? "—"}
      />
      <FunctionField
        label="Teacher"
        render={(r: { teacher?: { username?: string } }) => r.teacher?.username ?? "—"}
      />
      <TextField source="joinCode" label="Join code" />
      <FunctionField
        label="Members"
        render={(r: { _count?: { members?: number } }) => String(r._count?.members ?? 0)}
      />
      <DateField source="createdAt" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);

export const ClassroomShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" emptyText="—" />
      <TextField source="joinCode" />
      <TextField source="inviteLink" />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string; slug?: string } }) =>
          r.organization ? `${r.organization.name} (${r.organization.slug})` : "—"
        }
      />
      <FunctionField
        label="Teacher"
        render={(r: { teacher?: { username?: string; email?: string } }) =>
          r.teacher ? `${r.teacher.username ?? ""} (${r.teacher.email ?? ""})` : "—"
        }
      />
      <FunctionField
        label="Members"
        render={(r: { _count?: { members?: number } }) => String(r._count?.members ?? 0)}
      />
      <FunctionField
        label="Assignments"
        render={(r: { _count?: { assignments?: number } }) => String(r._count?.assignments ?? 0)}
      />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);

const MatchDatagrid = () => (
  <Datagrid bulkActionButtons={false}>
    <TextField source="id" />
    <TextField source="pin" emptyText="—" />
    <FunctionField label="Quiz" render={(r: { quiz?: { title?: string } }) => r.quiz?.title ?? "—"} />
    <TextField source="mode" />
    <FunctionField
      label="Organization"
      render={(r: { organization?: { name?: string } }) => r.organization?.name ?? "—"}
    />
    <FunctionField
      label="Classroom"
      render={(r: { classroom?: { name?: string } }) => r.classroom?.name ?? "—"}
    />
    <FunctionField label="Host" render={(r: { host?: { username?: string } }) => r.host?.username ?? "—"} />
    <FunctionField
      label="Players"
      render={(r: { _count?: { participants?: number } }) => String(r._count?.participants ?? 0)}
    />
    <DateField source="createdAt" showTime />
    <ShowButton />
  </Datagrid>
);

export const MatchList = () => (
  <List
    actions={listToolbar}
    filters={searchOnlyFilter}
    perPage={25}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
  >
    <MatchDatagrid />
  </List>
);

export const MatchShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="pin" emptyText="—" />
      <TextField source="mode" />
      <FunctionField label="Quiz" render={(r: { quiz?: { title?: string } }) => r.quiz?.title ?? "—"} />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string } }) => r.organization?.name ?? "—"}
      />
      <FunctionField
        label="Classroom"
        render={(r: { classroom?: { name?: string } }) => r.classroom?.name ?? "—"}
      />
      <FunctionField label="Host" render={(r: { host?: { username?: string; email?: string } }) => r.host?.username ?? "—"} />
      <DateField source="deadline" showTime emptyText="—" />
      <DateField source="startTime" showTime emptyText="—" />
      <DateField source="endTime" showTime emptyText="—" />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);

export const HomeworkList = () => (
  <List
    actions={listToolbar}
    filters={searchOnlyFilter}
    perPage={25}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
  >
    <MatchDatagrid />
  </List>
);

export const HomeworkShow = MatchShow;

const subscriptionStatusFilter = (
  <SelectInput
    key="status"
    source="status"
    choices={[
      { id: "ACTIVE", name: "Active" },
      { id: "PAST_DUE", name: "Past due" },
      { id: "CANCELED", name: "Canceled" },
      { id: "TRIALING", name: "Trialing" },
    ]}
    emptyText="All statuses"
  />
);

export const SubscriptionList = () => (
  <List
    actions={listToolbar}
    filters={[subscriptionStatusFilter]}
    perPage={25}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
  >
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string } }) => r.organization?.name ?? "—"}
      />
      <FunctionField label="Plan" render={(r: { plan?: { name?: string } }) => r.plan?.name ?? "—"} />
      <TextField source="status" />
      <TextField source="billingCycle" label="Billing" />
      <DateField source="currentPeriodEnd" showTime label="Period end" />
      <ShowButton />
    </Datagrid>
  </List>
);

export const SubscriptionShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string; slug?: string } }) =>
          r.organization ? `${r.organization.name} (${r.organization.slug})` : "—"
        }
      />
      <FunctionField label="Plan" render={(r: { plan?: { name?: string; type?: string } }) => r.plan?.name ?? "—"} />
      <TextField source="status" />
      <TextField source="billingCycle" />
      <DateField source="currentPeriodStart" showTime />
      <DateField source="currentPeriodEnd" showTime />
      <DateField source="trialEndsAt" showTime emptyText="—" />
      <DateField source="canceledAt" showTime emptyText="—" />
    </SimpleShowLayout>
  </Show>
);

export const PaymentList = () => (
  <List
    actions={listToolbar}
    filters={[
      <SelectInput
        key="status"
        source="status"
        choices={[
          { id: "PAY_PENDING", name: "Pending" },
          { id: "COMPLETED", name: "Completed" },
          { id: "PAY_FAILED", name: "Failed" },
          { id: "REFUNDED", name: "Refunded" },
        ]}
        emptyText="All statuses"
      />,
    ]}
    perPage={25}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
  >
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string } }) => r.organization?.name ?? "—"}
      />
      <NumberField source="amount" options={{ maximumFractionDigits: 2 }} />
      <TextField source="currency" />
      <TextField source="status" />
      <TextField source="paymentMethod" label="Method" />
      <DateField source="createdAt" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);

export const PaymentShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string } }) => r.organization?.name ?? "—"}
      />
      <NumberField source="amount" />
      <TextField source="currency" />
      <TextField source="status" />
      <TextField source="paymentMethod" />
      <TextField source="externalId" emptyText="—" />
      <TextField source="description" emptyText="—" />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);

export const UsageMetricList = () => (
  <List
    actions={listToolbar}
    filters={[<SearchInput key="key" source="key" placeholder="Metric key..." />]}
    perPage={25}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
  >
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <FunctionField
        label="Organization"
        render={(r: { organization?: { name?: string } }) => r.organization?.name ?? "—"}
      />
      <TextField source="key" />
      <NumberField source="value" />
      <DateField source="periodStart" showTime />
      <DateField source="periodEnd" showTime />
    </Datagrid>
  </List>
);
