import { Layout, type LayoutProps } from "react-admin";

/** Full-viewport layout with a scrollable main content pane (lists + edit forms). */
export function SuperAdminLayout(props: LayoutProps) {
  return (
    <Layout
      {...props}
      sx={{
        height: "100%",
        minHeight: "0 !important",
        "& .RaLayout-appFrame": {
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        },
        "& .RaLayout-contentWithSidebar": {
          flex: 1,
          minHeight: 0,
        },
        "& .RaLayout-content": {
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        },
      }}
    />
  );
}
