import * as authTypes from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/auth-types';
import * as crypto from '@shell/utils/crypto';

jest.mock('@shell/utils/crypto');
jest.mock('vuex', () => ({ useStore: jest.fn() }));

describe('composables: SecretDataTab/auth-types', () => {
  const resource = { _type: 'RESOURCE', data: { type: 'data' } };
  const base64 = '64 decoded string';
  const base64DecodeSpy = jest.spyOn(crypto, 'base64Decode');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSecretInfo', () => {
    it('should return the secret type and data set in resource', () => {
      const info = authTypes.useSecretInfo(resource);

      expect(info.value.secretType).toStrictEqual(resource._type);
      expect(info.value.secretData).toStrictEqual(resource.data);
    });

    it('should return the an empty object for secretData if not set on resource', () => {
      const info = authTypes.useSecretInfo({ _type: 'RESOURCE' });

      expect(info.value.secretType).toStrictEqual(resource._type);
      expect(info.value.secretData).toStrictEqual({});
    });
  });

  describe('useSecretRows', () => {
    it('should return empty array if data is not set', () => {
      const rows = authTypes.useSecretRows({});

      expect(rows.value).toStrictEqual([]);
    });

    it('should return a base64Decoded key/value if data is set', () => {
      base64DecodeSpy.mockReturnValue(base64);
      const row = { mockKey: 'value' };
      const rows = authTypes.useSecretRows({ data: row });

      expect(rows.value[0].key).toStrictEqual('mockKey');
      expect(rows.value[0].value).toStrictEqual(base64);
      expect(base64DecodeSpy).toHaveBeenCalledWith(row.mockKey);
    });
  });

  describe('useDockerAuths', () => {
    it('should return the auths field from a base64decoded json object in the `.dockerconfigjson` data field', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const json = { auths: 'AUTHS' };

      base64DecodeSpy.mockReturnValue(JSON.stringify(json));
      const dockerAuths = authTypes.useDockerAuths({ data });

      expect(dockerAuths.value).toStrictEqual(json.auths);
      expect(base64DecodeSpy).toHaveBeenCalledWith(data['.dockerconfigjson']);
    });
  });

  describe('useDockerRegistry', () => {
    it('should return the first value from the docker auths', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const json = { auths: { [registryUrl]: { something: 'test' } } };

      base64DecodeSpy.mockReturnValue(JSON.stringify(json));
      const registry = authTypes.useDockerRegistry({ data });

      expect(registry.value.registryUrl).toStrictEqual(registryUrl);
      expect(base64DecodeSpy).toHaveBeenCalledWith(data['.dockerconfigjson']);
    });
  });

  describe('useDockerBasic', () => {
    it('should return the username and password from the docker auths', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const username = 'USERNAME';
      const password = 'PASSWORD';
      const json = { auths: { [registryUrl]: { username, password } } };

      base64DecodeSpy.mockReturnValue(JSON.stringify(json));
      const dockerBasic = authTypes.useDockerBasic({ data });

      expect(dockerBasic.value.username).toStrictEqual(username);
      expect(dockerBasic.value.password).toStrictEqual(password);
      expect(base64DecodeSpy).toHaveBeenCalledWith(data['.dockerconfigjson']);
    });

    it('should decode username and password from auth field when username/password are not present', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const username = 'tiger';
      const password = 'pass1234';
      const auth = 'dGlnZXI6cGFzczEyMzQ='; // base64 of "tiger:pass1234"
      const json = { auths: { [registryUrl]: { auth } } };

      // Mock base64Decode to return different values based on input
      const decodeLookup: Record<string, string> = {
        [data['.dockerconfigjson']]: JSON.stringify(json),
        [auth]:                      `${ username }:${ password }`
      };

      base64DecodeSpy.mockImplementation((input: string) => decodeLookup[input] || '');
      const dockerBasic = authTypes.useDockerBasic({ data });

      expect(dockerBasic.value.username).toStrictEqual(username);
      expect(dockerBasic.value.password).toStrictEqual(password);
      expect(base64DecodeSpy).toHaveBeenCalledWith(data['.dockerconfigjson']);
      expect(base64DecodeSpy).toHaveBeenCalledWith(auth);
    });

    it('should handle password containing colons', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const username = 'user';
      const password = 'pass:with:colons';
      const auth = 'someBase64Auth';
      const json = { auths: { [registryUrl]: { auth } } };

      const decodeLookup: Record<string, string> = {
        [data['.dockerconfigjson']]: JSON.stringify(json),
        [auth]:                      `${ username }:${ password }`
      };

      base64DecodeSpy.mockImplementation((input: string) => decodeLookup[input] || '');
      const dockerBasic = authTypes.useDockerBasic({ data });

      expect(dockerBasic.value.username).toStrictEqual(username);
      expect(dockerBasic.value.password).toStrictEqual(password);
    });

    it('should return empty values when neither username/password nor auth field are present', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const json = { auths: { [registryUrl]: {} } };

      base64DecodeSpy.mockReturnValue(JSON.stringify(json));
      const dockerBasic = authTypes.useDockerBasic({ data });

      expect(dockerBasic.value.username).toStrictEqual('');
      expect(dockerBasic.value.password).toStrictEqual('');
    });
  });

  describe('useBasic', () => {
    it('should return the username, password, rows from the docker auths', () => {
      const username = 'USERNAME';
      const password = 'PASSWORD';
      const data = { username, password };

      base64DecodeSpy
        .mockReturnValueOnce(username)
        .mockReturnValueOnce(password)
        .mockReturnValueOnce(username)
        .mockReturnValueOnce(password);

      const basic = authTypes.useBasic({ data });

      expect(basic.value.username).toStrictEqual(username);
      expect(basic.value.password).toStrictEqual(password);
      expect(basic.value.rows).toStrictEqual([{ key: 'username', value: username }, { key: 'password', value: password }]);
      expect(base64DecodeSpy).toHaveBeenCalledWith(username);
      expect(base64DecodeSpy).toHaveBeenCalledWith(password);
      expect(base64DecodeSpy).toHaveBeenCalledWith(username);
      expect(base64DecodeSpy).toHaveBeenCalledWith(password);
    });
  });

  describe('useSsh', () => {
    it('should return the username, password from data fields ssh-publickey/privatekey', () => {
      const username = 'USERNAME';
      const password = 'PASSWORD';
      const data = {
        'ssh-publickey':  username,
        'ssh-privatekey': password
      };

      base64DecodeSpy
        .mockReturnValueOnce(username)
        .mockReturnValueOnce(password);

      const ssh = authTypes.useSsh({ data });

      expect(ssh.value.username).toStrictEqual(username);
      expect(ssh.value.password).toStrictEqual(password);

      expect(base64DecodeSpy).toHaveBeenCalledWith(username);
      expect(base64DecodeSpy).toHaveBeenCalledWith(password);
    });
  });

  describe('useServiceAccount', () => {
    it('should return the token, crt from data fields token, ca.crt', () => {
      const token = 'TOKEN';
      const crt = 'CRT';
      const data = {
        token,
        'ca.crt': crt
      };

      base64DecodeSpy
        .mockReturnValueOnce(token)
        .mockReturnValueOnce(crt);

      const serviceAccount = authTypes.useServiceAccount({ data });

      expect(serviceAccount.value.token).toStrictEqual(token);
      expect(serviceAccount.value.crt).toStrictEqual(crt);

      expect(base64DecodeSpy).toHaveBeenCalledWith(token);
      expect(base64DecodeSpy).toHaveBeenCalledWith(crt);
    });
  });

  describe('useTls', () => {
    it('should return the token, crt from data fields token, ca.crt', () => {
      const token = 'TOKEN';
      const crt = 'CRT';
      const data = {
        'tls.key': token,
        'tls.crt': crt
      };

      base64DecodeSpy
        .mockReturnValueOnce(token)
        .mockReturnValueOnce(crt);

      const serviceAccount = authTypes.useTls({ data });

      expect(serviceAccount.value.token).toStrictEqual(token);
      expect(serviceAccount.value.crt).toStrictEqual(crt);

      expect(base64DecodeSpy).toHaveBeenCalledWith(token);
      expect(base64DecodeSpy).toHaveBeenCalledWith(crt);
    });
  });
});
