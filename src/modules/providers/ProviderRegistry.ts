import type { DataProvider } from '../../core/contracts/provider.js';

export class ProviderRegistry {
  constructor(private readonly providers: DataProvider<any>[]) {}

  getByName(name: string): DataProvider<any> | undefined {
    return this.providers.find(p => p.providerName === name);
  }

  list(): DataProvider<any>[] {
    return this.providers;
  }
}
