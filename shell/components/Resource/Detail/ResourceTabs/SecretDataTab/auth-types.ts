import { computed, toValue } from 'vue';
import { base64Decode } from '@shell/utils/crypto';

export const useSecretInfo = (resource: any) => {
  return computed(() => {
    const resourceValue = toValue(resource);

    return {
      secretType: resourceValue._type,
      secretData: resourceValue.data || {}
    };
  });
};

export const useSecretRows = (resource: any) => {
  return computed(() => {
    const resourceValue = toValue(resource);

    const rows: any[] = [];
    const { data = {} } = resourceValue;

    Object.keys(data).forEach((key) => {
      const value = base64Decode(data[key]);

      rows.push({
        key,
        value
      });
    });

    return rows;
  });
};

export const useDockerAuths = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    const json = base64Decode(secretInfo.value.secretData['.dockerconfigjson']);

    return JSON.parse(json).auths;
  });
};

export const useDockerRegistry = (resource: any) => {
  const dockerAuths = useDockerAuths(resource);

  return computed(() => {
    return { registryUrl: Object.keys(dockerAuths.value)[0] };
  });
};

export const useDockerBasic = (resource: any) => {
  const dockerAuths = useDockerAuths(resource);
  const dockerRegistry = useDockerRegistry(resource);

  return computed(() => {
    const authData = dockerAuths.value[dockerRegistry.value.registryUrl] || {};

    // If username and password are directly available, use them
    if (authData.username !== undefined && authData.password !== undefined) {
      return {
        username: authData.username,
        password: authData.password,
      };
    }

    // Otherwise, try to decode from the auth field (base64 encoded "username:password")
    if (authData.auth) {
      try {
        const decoded = base64Decode(authData.auth);
        const colonIndex = decoded.indexOf(':');

        if (colonIndex !== -1) {
          return {
            username: decoded.substring(0, colonIndex),
            password: decoded.substring(colonIndex + 1),
          };
        }
      } catch (e) {
        // If decoding fails, fall through to return empty values
      }
    }

    // Return empty values if neither format is available
    return {
      username: '',
      password: '',
    };
  });
};

export const useBasic = (resource: any) => {
  const rows = useSecretRows(resource);
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      username: base64Decode(secretInfo.value.secretData.username || ''),
      password: base64Decode(secretInfo.value.secretData.password || ''),
      rows:     rows.value
    };
  });
};

export const useSsh = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      username: base64Decode(secretInfo.value.secretData['ssh-publickey'] || ''),
      password: base64Decode(secretInfo.value.secretData['ssh-privatekey'] || ''),
    };
  });
};

export const useServiceAccount = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      token: base64Decode(secretInfo.value.secretData['token']),
      crt:   base64Decode(secretInfo.value.secretData['ca.crt']),
    };
  });
};

export const useTls = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      token: base64Decode(secretInfo.value.secretData['tls.key']),
      crt:   base64Decode(secretInfo.value.secretData['tls.crt']),
    };
  });
};
