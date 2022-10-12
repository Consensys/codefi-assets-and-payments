import { ReactElement } from 'react';

interface CanProps<T> {
  permissions: string[];
  action: string;
  data?: T;
  resolver?: (data: T) => boolean;
  allowed?: () => ReactElement | null;
  disallowed?: () => ReactElement | null;
  children?: ReactElement;
}

export const hasPermissions = (
  permissions: string[] = [],
  action: string,
): boolean => permissions.includes(action);

export function Can<T>({
  permissions = [],
  action,
  data,
  resolver,
  children,
  allowed = () => null,
  disallowed = () => null,
}: CanProps<T>): ReactElement | null {
  if (hasPermissions(permissions, action)) {
    // resolver path
    if (data && resolver) {
      return resolver(data)
        ? allowed() || children || null
        : disallowed() || null;
    }

    return allowed() || children || null;
  }

  return disallowed() || null;
}

export default Can;
