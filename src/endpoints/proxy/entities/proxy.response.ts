export class ProxyResponse {
  data: any;
  error: string = '';
  code: string = '';

  public static withSuccess(data: any): ProxyResponse {
    return { data, error: '', code: 'successful' };
  }

  public static withError(error: string, code: string): ProxyResponse {
    return { data: null, error, code };
  }
}
