import { Configuration } from "@components/config";
import { useRead, useWrite } from "@hooks";
import { Section } from "@layouts/page";
import { Types } from "@monitor/client";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { Settings, Save, History, Trash, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

const ExtraArgs = ({
  args,
  set,
}: {
  args: string[] | undefined;
  set: (input: Partial<Types.BuildConfig>) => void;
}) => (
  <div className="flex flex-col gap-4">
    {args?.map((arg, i) => (
      <div className="flex gap-4" key={i}>
        <Input
          value={arg}
          onChange={(e) => {
            if (!args) return;
            args[i] = e.target.value;
            set({ extra_args: [...args] });
          }}
        />
        <Button
          variant="outline"
          intent="danger"
          onClick={() => {
            if (!args) return;
            args = args?.filter((_, ix) => ix !== i);
            set({ extra_args: [...args] });
          }}
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    ))}
    <Button
      variant="outline"
      intent="success"
      onClick={() => set({ extra_args: [...(args ?? []), ""] })}
      className="flex items-center gap-2"
    >
      Add Arg <PlusCircle className="w-4 h-4" />
    </Button>
  </div>
);

const EnvVars = ({
  vars,
  set,
}: {
  vars: Types.EnvironmentVar[] | undefined;
  set: (input: Partial<Types.BuildConfig>) => void;
}) => (
  <div className="flex flex-col gap-4 border-b pb-4">
    {vars?.map((variable, i) => (
      <div className="flex justify-between gap-4">
        <Input
          value={variable.variable}
          placeholder="Variable Name"
          onChange={(e) => {
            vars[i].variable = e.target.value;
            set({ build_args: [...vars] });
          }}
        />
        =
        <Input
          value={variable.value}
          placeholder="Variable Value"
          onChange={(e) => {
            vars[i].value = e.target.value;
            set({ build_args: [...vars] });
          }}
        />
      </div>
    ))}
    <Button
      variant="outline"
      intent="success"
      className="flex items-center gap-2"
      onClick={() =>
        set({
          build_args: [...(vars ?? []), { variable: "", value: "" }],
        })
      }
    >
      <PlusCircle className="w-4 h-4" />
      Add
    </Button>
  </div>
);

const BuilderTypeSelector = ({
  selected,
  onSelect,
}: {
  selected: Types.BuildBuilderConfig["type"] | undefined;
  onSelect: (type: Types.BuildBuilderConfig["type"]) => void;
}) => (
  <Select value={selected || undefined} onValueChange={onSelect}>
    <SelectTrigger className="max-w-[150px]">
      <SelectValue placeholder="Select Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={"Builder"}>Image</SelectItem>
      <SelectItem value={"Server"}>Build</SelectItem>
    </SelectContent>
  </Select>
);

const BuilderConfig = ({
  builder,
  set,
}: {
  builder: Types.BuildBuilderConfig | undefined;
  set: (input: Partial<Types.BuildConfig>) => void;
}) => (
  <div className="flex justify-between items-center border-b pb-4 min-h-[40px]">
    <div>Builder</div>
    <div className="flex gap-4 w-full justify-end">
      <BuilderTypeSelector
        selected={builder?.type}
        onSelect={(type) =>
          set({
            builder: {
              type: type as any,
              params:
                type === "Server"
                  ? ({ server_id: "" } as any)
                  : { builder_id: "" },
            },
          })
        }
      />
      <Input
        value={
          builder?.type === "Server"
            ? builder.params.server_id
            : builder?.params.builder_id
        }
        onChange={(e) =>
          set({
            builder: {
              ...builder,
              params: {
                ...(builder?.type === "Server"
                  ? { server_id: e.target.value }
                  : { builder_id: e.target.value }),
              } as any,
            } as any,
          })
        }
      />
    </div>
  </div>
);

export const BuildConfig = () => {
  const id = useParams().buildId;
  const build = useRead("GetBuild", { id }).data;
  const [update, set] = useState<Partial<Types.BuildConfig>>({});
  const { mutate, isLoading } = useWrite("UpdateBuild");

  if (!id || !build) return null;

  return (
    <Section
      title="Config"
      icon={<Settings className="w-4 h-4" />}
      actions={
        <div className="flex gap-4">
          <Button variant="outline" intent="warning" onClick={() => set({})}>
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            intent="success"
            onClick={() => mutate({ config: update, id })}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <Configuration
        config={build.config}
        loading={isLoading}
        update={update}
        set={(input) => set((update) => ({ ...update, ...input }))}
        layout={{
          general: ["builder"],
          repo: ["repo", "branch", "github_account"],
          docker: [
            "build_path",
            "dockerfile_path",
            "docker_account",
            "docker_organization",
            "use_buildx",
          ],
          pre_build: ["pre_build"],
          build_args: ["build_args"],
          extra_args: ["extra_args"],
        }}
        overrides={{
          build_args: (args, set) => <EnvVars vars={args} set={set} />,
          extra_args: (args, set) => <ExtraArgs args={args} set={set} />,
          builder: (builder, set) => (
            <BuilderConfig builder={builder} set={set} />
          ),
        }}
      />
    </Section>
  );
};
