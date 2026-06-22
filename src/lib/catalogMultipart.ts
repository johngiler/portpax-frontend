type AppendableValue = string | number | boolean | null | undefined;

export function appendCatalogFormValue(form: FormData, key: string, value: AppendableValue) {
  if (value === null || value === undefined) {
    form.append(key, "");
    return;
  }
  if (typeof value === "boolean") {
    form.append(key, value ? "true" : "false");
    return;
  }
  form.append(key, String(value));
}

export type CatalogLogoSaveOptions = {
  logoFile?: File | null;
  removeLogo?: boolean;
};

export function usesCatalogLogoMultipart(options?: CatalogLogoSaveOptions): boolean {
  return Boolean(options?.logoFile || options?.removeLogo);
}

export function appendCatalogLogoFields(form: FormData, options?: CatalogLogoSaveOptions) {
  if (options?.logoFile) {
    form.append("logo", options.logoFile);
  } else if (options?.removeLogo) {
    form.append("logo", "");
  }
}
