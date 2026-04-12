import { useState } from 'react';

export function useFormFields<T extends Record<string, string>>(initialValues: T) {
  const [fields, setFields] = useState<T>(initialValues);

  // Centraliza atualizacoes de campos para evitar repeticao nas telas.
  const updateField = (field: keyof T, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
  };

  const resetFields = () => setFields(initialValues);

  return {
    fields,
    updateField,
    resetFields,
  };
}
