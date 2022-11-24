# @consensys/ethers

A package to unify all ethers configuration, providers and http(s) proxy.

Need to call `instance` function before using it.
It receives a `blockchainRpcUrl` to create ethers provider (only HTTP supported), and it will create the `ProviderAuth` from the basic auth parameters from the URL.
