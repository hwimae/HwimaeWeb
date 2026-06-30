import { Input, Textarea } from "@heroui/react";
import clsx, { type ClassValue } from "clsx";
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

type FormFieldSlotClassNames = {
  inputWrapper?: ClassValue;
  input?: ClassValue;
  label?: ClassValue;
  description?: ClassValue;
};

function mergeFormFieldClassNames<T extends FormFieldSlotClassNames>(classNames?: T) {
  return {
    ...classNames,
    inputWrapper: clsx("form-field-input-wrapper", classNames?.inputWrapper),
    input: clsx("form-field-input-element", classNames?.input),
    label: clsx("form-field-label", classNames?.label),
    description: clsx("form-field-description", classNames?.description),
  };
}

export function FormField(props: FormFieldProps) {
  if (props.kind === "textarea") {
    const { id, label, hint, kind: _kind, classNames, ...fieldProps } = props;

    return (
      <Textarea
        {...fieldProps}
        id={id}
        label={label}
        description={hint}
        variant="bordered"
        color="primary"
        className="form-field"
        classNames={mergeFormFieldClassNames(classNames)}
      />
    );
  }

  const { id, label, hint, kind: _kind, classNames, ...fieldProps } = props;

  return (
    <Input
      {...fieldProps}
      id={id}
      label={label}
      description={hint}
      variant="bordered"
      color="primary"
      className="form-field"
      classNames={mergeFormFieldClassNames(classNames)}
    />
  );
}
