import {
  Admin,
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  DeleteButton,
  Edit,
  EditButton,
  FunctionField,
  List,
  NumberField,
  NumberInput,
  Resource,
  SelectInput,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  TopToolbar,
  CreateButton,
  ExportButton,
  FilterButton,
  SearchInput,
  Pagination,
} from "react-admin";
import PersonIcon from "@mui/icons-material/Person";
import QuizIcon from "@mui/icons-material/Quiz";
import ReportIcon from "@mui/icons-material/Report";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import PaymentIcon from "@mui/icons-material/Payment";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { superAdminDataProvider } from "@/admin/superAdminDataProvider";
import { superAdminAuthProvider } from "@/admin/superAdminAuthProvider";

const requiredMissing = (value: unknown) => (value == null || value === "" ? "Required" : undefined);

const quizFilters = [
  <SearchInput source="search" alwaysOn placeholder="Title or creator..." />,
  <TextInput source="categoryId" label="Category ID" />,
];

const userFilters = [
  <SearchInput source="search" alwaysOn placeholder="Username or email..." />,
  <SelectInput
    source="isAdmin"
    label="Staff admin"
    choices={[
      { id: "", name: "All" },
      { id: "true", name: "Yes" },
      { id: "false", name: "No" },
    ]}
    emptyText="All"
    parse={(v) => v || undefined}
    format={(v) => (v === undefined || v === "" ? "" : String(v))}
  />,
];

const reportFilters = [
  <SelectInput
    source="status"
    choices={[
      { id: "PENDING", name: "Pending" },
      { id: "RESOLVED", name: "Resolved" },
      { id: "DISMISSED", name: "Dismissed" },
    ]}
    emptyText="All statuses"
  />,
  <SelectInput
    source="reportType"
    choices={[
      { id: "QUIZ", name: "Quiz" },
      { id: "USER", name: "User" },
      { id: "OTHER", name: "Other" },
    ]}
    emptyText="All types"
  />,
];

const aiJobFilters = [
  <TextInput source="userId" label="User ID" />,
  <SelectInput
    source="status"
    choices={[
      { id: "PENDING", name: "Pending" },
      { id: "PROCESSING", name: "Processing" },
      { id: "COMPLETED", name: "Completed" },
      { id: "APPROVED", name: "Approved" },
      { id: "FAILED", name: "Failed" },
    ]}
    emptyText="All"
  />,
];

const QuizListActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
  </TopToolbar>
);

const UserListToolbar = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
  </TopToolbar>
);

const ReportListToolbar = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
  </TopToolbar>
);

const PromotionListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const ExportListActions = () => (
  <TopToolbar>
    <ExportButton />
  </TopToolbar>
);

const QuizList = () => (
  <List actions={<QuizListActions />} filters={quizFilters} perPage={25} pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="title" />
      <FunctionField label="Creator" render={(r: { creator?: { username?: string } }) => r.creator?.username ?? "—"} />
      <BooleanField source="isPublic" />
      <DateField source="createdAt" showTime />
      <ShowButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

const QuizShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <FunctionField label="Creator" render={(r: { creator?: { username?: string; email?: string } }) => r.creator?.username ?? "—"} />
      <FunctionField label="Creator email" render={(r: { creator?: { email?: string } }) => r.creator?.email ?? "—"} />
      <TextField source="category.name" label="Category" />
      <BooleanField source="isPublic" />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);

const UserList = () => (
  <List actions={<UserListToolbar />} filters={userFilters} perPage={25} pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="username" />
      <TextField source="email" />
      <BooleanField source="isAdmin" label="Staff" />
      <DateField source="createdAt" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);

const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="username" />
      <TextField source="email" />
      <BooleanField source="isAdmin" label="Staff admin" />
      <DateField source="createdAt" showTime />
      <FunctionField
        label="Organizations (count)"
        render={(r: { organizationMembers?: unknown[] }) => String(r.organizationMembers?.length ?? 0)}
      />
    </SimpleShowLayout>
  </Show>
);

const ReportList = () => (
  <List actions={<ReportListToolbar />} filters={reportFilters} perPage={25} pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="reportType" />
      <TextField source="targetId" />
      <TextField source="status" />
      <FunctionField label="Reporter" render={(r: { reporter?: { username?: string } }) => r.reporter?.username ?? "—"} />
      <DateField source="createdAt" showTime />
      <EditButton />
    </Datagrid>
  </List>
);

const ReportEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="reportType" disabled />
      <TextInput source="targetId" disabled />
      <TextInput source="reason" disabled multiline fullWidth minRows={2} />
      <SelectInput
        source="status"
        choices={[
          { id: "PENDING", name: "Pending" },
          { id: "RESOLVED", name: "Resolved" },
          { id: "DISMISSED", name: "Dismissed" },
        ]}
      />
    </SimpleForm>
  </Edit>
);

const PromotionList = () => (
  <List actions={<PromotionListActions />} perPage={25} pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="title" />
      <FunctionField label="Plan" render={(r: { plan?: { name?: string } }) => r.plan?.name ?? "—"} />
      <NumberField source="discountedPriceMonthly" options={{ maximumFractionDigits: 2 }} />
      <BooleanField source="isPublished" />
      <BooleanField source="isActive" />
      <DateField source="expiresAt" showTime />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

const PromotionShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="subtitle" />
      <TextField source="description" />
      <NumberField source="planId" />
      <TextField source="plan.name" label="Plan" />
      <NumberField source="discountedPriceMonthly" options={{ maximumFractionDigits: 2 }} />
      <NumberField source="discountedPriceYearly" options={{ maximumFractionDigits: 2 }} />
      <BooleanField source="isActive" />
      <BooleanField source="isPublished" />
      <DateField source="expiresAt" showTime />
    </SimpleShowLayout>
  </Show>
);

const PromotionCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <TextInput source="title" validate={[requiredMissing]} fullWidth />
      <TextInput source="subtitle" fullWidth />
      <TextInput source="description" fullWidth multiline minRows={2} />
      <NumberInput source="planId" validate={[requiredMissing]} />
      <NumberInput source="discountedPriceMonthly" defaultValue={0} />
      <NumberInput source="discountedPriceYearly" defaultValue={0} />
      <DateTimeInput source="expiresAt" validate={[requiredMissing]} />
      <BooleanInput source="isPublished" defaultValue={false} />
      <TextInput source="bannerColor" fullWidth helperText='e.g. #0078D4' />
      <TextInput source="badgeText" fullWidth />
    </SimpleForm>
  </Create>
);

const PromotionEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="title" validate={[requiredMissing]} fullWidth />
      <TextInput source="subtitle" fullWidth />
      <TextInput source="description" fullWidth multiline minRows={2} />
      <NumberInput source="planId" validate={[requiredMissing]} />
      <NumberInput source="discountedPriceMonthly" />
      <NumberInput source="discountedPriceYearly" />
      <DateTimeInput source="expiresAt" />
      <BooleanInput source="isActive" />
      <BooleanInput source="isPublished" />
      <TextInput source="bannerColor" fullWidth />
      <TextInput source="badgeText" fullWidth />
    </SimpleForm>
  </Edit>
);

const PlanList = () => (
  <List actions={<ExportListActions />} perPage={25} pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="type" />
      <TextField source="name" />
      <NumberField source="priceMonthly" options={{ maximumFractionDigits: 2 }} />
      <NumberField source="priceYearly" options={{ maximumFractionDigits: 2 }} />
      <BooleanField source="isActive" />
      <EditButton />
    </Datagrid>
  </List>
);

const PlanShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="type" />
      <TextField source="name" />
      <TextField source="description" />
      <NumberField source="priceMonthly" />
      <NumberField source="priceYearly" />
      <BooleanField source="isActive" />
      <FunctionField label="Features" render={(r: { features?: { featureKey?: string }[] }) => (r.features?.length ? r.features.map((f) => f.featureKey).join(", ") : "—")} />
    </SimpleShowLayout>
  </Show>
);

const PlanEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="type" disabled fullWidth helperText="Plan type cannot be changed here; feature matrix unchanged from this screen" />
      <TextInput source="name" validate={[requiredMissing]} fullWidth />
      <TextInput source="description" fullWidth multiline minRows={2} />
      <NumberInput source="priceMonthly" />
      <NumberInput source="priceYearly" />
      <BooleanInput source="isActive" />
    </SimpleForm>
  </Edit>
);

const AiJobList = () => (
  <List actions={<QuizListActions />} filters={aiJobFilters} perPage={25} pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="id" />
      <TextField source="status" />
      <FunctionField label="User" render={(r: { user?: { username?: string } }) => r.user?.username ?? "—"} />
      <TextField source="suggestedTitle" label="Suggested title" emptyText="—" />
      <NumberField source="questionCount" label="Qs" />
      <DateField source="createdAt" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);

const AiJobShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="status" />
      <FunctionField label="User" render={(r: { user?: { username?: string; email?: string } }) => `${r.user?.username ?? ""} (${r.user?.email ?? ""})`} />
      <TextField source="instruction" />
      <TextField source="suggestedTitle" />
      <TextField source="suggestedDescription" />
      <NumberField source="questionCount" />
      <NumberField source="totalTokens" emptyText="—" />
      <TextField source="errorMessage" emptyText="—" />
      <DateField source="createdAt" showTime />
    </SimpleShowLayout>
  </Show>
);

export default function SuperAdminConsole() {
  return (
    <div className="fixed inset-0 z-30 lg:left-0">
      <Admin
        basename="/admin/super"
        dataProvider={superAdminDataProvider}
        authProvider={superAdminAuthProvider}
        loginPage={false}
        title="Quizmon Super Admin"
        requireAuth
      >
        <Resource name="users" icon={PersonIcon} list={UserList} show={UserShow} recordRepresentation="username" />
        <Resource name="quizzes" icon={QuizIcon} list={QuizList} show={QuizShow} />
        <Resource name="reports" icon={ReportIcon} list={ReportList} edit={ReportEdit} />
        <Resource
          name="promotions"
          icon={CardGiftcardIcon}
          list={PromotionList}
          show={PromotionShow}
          create={PromotionCreate}
          edit={PromotionEdit}
        />
        <Resource name="plans" icon={PaymentIcon} list={PlanList} show={PlanShow} edit={PlanEdit} />
        <Resource name="ai-jobs" options={{ label: "AI jobs" }} icon={SmartToyIcon} list={AiJobList} show={AiJobShow} />
      </Admin>
    </div>
  );
}
