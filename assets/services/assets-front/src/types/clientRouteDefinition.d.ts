type TClientRouteDefinition =
  | string
  | {
      path: '';
      pathBuilder: (params: { [paramKey: string]: string }) => string;
    };
