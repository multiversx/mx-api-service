export class ProviderFilter {
  constructor(init?: Partial<ProviderFilter>) {
    Object.assign(this, init);
  }

  identity: string | undefined = undefined;

  providers: string[] | undefined = undefined;
} 
