import React, {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type BaseFormFieldProps = {
  id: string;
  label: string;
  hint?: string;
  kind?: "input" | "textarea";
};

type InputFormFieldProps = BaseFormFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
    kind?: "input";
  };

type TextareaFormFieldProps = BaseFormFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
    kind: "textarea";
  };

type FormFieldProps = InputFormFieldProps | TextareaFormFieldProps;

export function FormField(props: FormFieldProps) {
  const { id, label, hint, kind = "input", ...fieldProps } = props;
  const hintId = hint ? `${id}-hint` : undefined;
  const ariaDescribedBy = [fieldProps["aria-describedby"], hintId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {kind === "textarea" ? (
        <textarea
          {...(fieldProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          id={id}
          aria-describedby={ariaDescribedBy || undefined}
        />
      ) : (
        <input
          {...(fieldProps as InputHTMLAttributes<HTMLInputElement>)}
          id={id}
          aria-describedby={ariaDescribedBy || undefined}
        />
      )}
      {hint ? (
        <small className="form-field-hint" id={hintId}>
          {hint}
        </small>
      ) : null}
    </div>
  );
}
