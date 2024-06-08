import { useRead } from "@lib/hooks";
import { sanitizeOnlySpan, sync_no_changes } from "@lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/tabs";
import { useState } from "react";
import { ResourceSyncConfig } from "./config";
import { Section } from "@components/layouts";
import { Types } from "@monitor/client";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/card";

const PENDING_TYPE_KEYS: Array<[string, string]> = [
  ["Server", "server_updates"],
  ["Deployment", "deployment_updates"],
  ["Build", "build_updates"],
  ["Repo", "repo_updates"],
  ["Procedure", "procedure_updates"],
  ["Alerter", "alerter_updates"],
  ["Builder", "builder_updates"],
  ["Server Template", "server_template_updates"],
  ["Resource Sync", "resource_sync_updates"],
  ["Variable", "variable_updates"],
  ["User Group", "user_group_updates"],
];

export const PendingOrConfig = ({ id }: { id: string }) => {
  const [view, setView] = useState("Pending");

  const sync = useRead("GetResourceSync", { sync: id }).data;

  const pendingDisabled = !sync || sync_no_changes(sync);
  const currentView = view === "Pending" && pendingDisabled ? "Config" : view;

  const pending = sync?.info?.pending;

  const tabsList = (
    <TabsList className="justify-start w-fit">
      <TabsTrigger
        value="Pending"
        className="w-[110px]"
        disabled={pendingDisabled}
      >
        Pending
      </TabsTrigger>
      <TabsTrigger value="Config" className="w-[110px]">
        Config
      </TabsTrigger>
    </TabsList>
  );
  return (
    <Tabs value={currentView} onValueChange={setView} className="grid gap-4">
      <TabsContent value="Config">
        <ResourceSyncConfig id={id} titleOther={tabsList} />
      </TabsContent>
      <TabsContent value="Pending">
        <Section titleOther={tabsList}>
          {pending?.hash && pending.message && (
            <Card>
              <CardHeader className="flex items-center gap-4 text-muted-foreground">
                Commit: {pending.hash}: {pending.message}
              </CardHeader>
            </Card>
          )}
          {pending?.data.type === "Ok" &&
            PENDING_TYPE_KEYS.map(([type, key]) => (
              <PendingView
                key={type}
                type={type}
                pending={pending.data.data[key]}
              />
            ))}
          {pending?.data.type === "Err" && (
            <Card>
              <CardHeader className="flex items-center justify-between gap-4">
                <CardTitle>Pending Error</CardTitle>
              </CardHeader>
              <CardContent>
                <pre
                  dangerouslySetInnerHTML={{
                    __html: sanitizeOnlySpan(pending.data.data.message),
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Section>
      </TabsContent>
    </Tabs>
  );
};

const PendingView = ({
  type,
  pending,
}: {
  type: string;
  pending: Types.SyncUpdate | undefined;
}) => {
  if (!pending) return;

  return (
    <Card>
      <div className="flex items-center gap-4 px-8 py-4">
        <CardTitle>{type} Updates</CardTitle>
        <div className="flex gap-4 items-center m-0">
          {pending.to_create ? (
            <>
              |
              <div className="flex gap-2 items-center">
                To Create: {pending.to_create}
              </div>
            </>
          ) : undefined}
          {pending.to_update ? (
            <>
              |
              <div className="flex gap-2 items-center">
                To Update: {pending.to_update}
              </div>
            </>
          ) : undefined}
          {pending.to_delete ? (
            <>
              |
              <div className="flex gap-2 items-center">
                To Delete: {pending.to_delete}
              </div>
            </>
          ) : undefined}
        </div>
      </div>
      <CardContent>
        <pre
          dangerouslySetInnerHTML={{
            __html: sanitizeOnlySpan(pending.log),
          }}
        />
      </CardContent>
    </Card>
  );
};
