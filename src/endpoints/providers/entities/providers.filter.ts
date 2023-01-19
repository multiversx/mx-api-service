export class ProvidersFilter {
  constructor(init?: Partial<ProvidersFilter>) {
    Object.assign(this, init);
  }

  identity: string | undefined = undefined;

  providers: string[] | undefined = undefined;
} 
