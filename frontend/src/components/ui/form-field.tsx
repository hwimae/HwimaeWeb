import { Input, Textarea } from "@heroui/react";
import React, { type ComponentProps } from "react";

type BaseFormFieldProps = {
  id: string;
  label: string;
  hint?: string;
};

type HeroInputProps = ComponentProps<typeof Input>;
type HeroTextareaProps = ComponentProps<typeof Textarea>;

type InputFormFieldProps = BaseFormFieldProps &
  Omit<HeroInputProps, "id" | "label" | "description"> & {
    kind?: "input";
  };

type TextareaFormFieldProps = BaseFormFieldProps &
  Omit<HeroTextareaProps, "id" | "label" | "description"> & {
    kind: "textarea";
  };

type FormFieldProps = InputFormFieldProps | TextareaFormFieldProps;

export function FormField(props: FormFieldProps) {
  if (props.kind === "textarea") {
    const { id, label, hint, kind: _kind, ...fieldProps } = props;

    return (
      <Textarea
        {...fieldProps}
        id={id}
        label={label}
        description={hint}
        variant="bordered"
        color="primary"
        className="form-field"
      />
    );
  }

  const { id, label, hint, kind: _kind, ...fieldProps } = props;

  return (
    <Input
      {...fieldProps}
      id={id}
      label={label}
      description={hint}
      variant="bordered"
      color="primary"
      className="form-field"
    />
  );
}
