# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.40.4](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.40.3...v2.40.4) (2022-07-13)


### Bug Fixes

* generateCode function now use randomBytes ([871be0c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/871be0c2864416efd6dbede10f37be5fa94fdb04))

### [2.40.3](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.40.2...v2.40.3) (2022-07-04)


### Bug Fixes

* **CA-6699:** align all services with observability package apm usage ([87e0f02](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/87e0f0238c26c989415fb85e8193c180843766bd))

### [2.40.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.40.1...v2.40.2) (2022-06-28)


### Bug Fixes

* build script to use tsconfig build file ([327c4ad](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/327c4ad0de317f19dd61443dc6c7bda0dde2d4c4))
* move mock contracts to config ([0ee598c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/0ee598c052a559bd8bcb2349776be175b6e87d86))
* remove unnecessary variables from test env ([affc79c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/affc79c0ed6c87ccadab57ed7cfad8b41a02b699))
* **network:** remove non-functional quara network ([29ecd67](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/29ecd671418fbb758b01fb254849cc0f370d4b31))

### [2.40.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.40.0...v2.40.1) (2022-04-07)

## [2.40.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.39.1...v2.40.0) (2022-03-10)


### Features

* split erc721 mint overloaded method ([b94aa41](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/b94aa41654c0447c5704dc86de4823ae4abba97f))

### [2.39.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.39.0...v2.39.1) (2022-03-02)

## [2.39.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.38.2...v2.39.0) (2022-03-02)


### Features

* (CA-6339) add new erc721 smart contract ([4734505](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/4734505b58f439216f41885c5a3a24f1dd6512ac))

### [2.38.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.38.1...v2.38.2) (2022-02-17)


### Bug Fixes

* new tx properties ([d9888bc](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/d9888bc86144d0a9bf9841004b2feef606e1c1a6))

### [2.38.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.38.0...v2.38.1) (2022-02-16)


### Bug Fixes

* **kaleido:** update rpc endpoint ([74cda97](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/74cda97f75a82afc3c58e04c3b05bce1c5d99ac1))

## [2.38.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.35.1...v2.38.0) (2022-01-24)


### Features

* **network:** add possibility to update network url ([2cd763d](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/2cd763dfe74b52e63ae4fa597ea4cb4a7fd5ecc0))
* **network:** add possibility to update network url ([cb02287](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/cb022872ad6af8620ed76a056744be9c048593a8))
* **store:** add possibility to defiene wallet's store in QKM ([b158643](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/b158643cc586f366f412be21ce2ebd9b5fd8033c))
* add network config for HKEX UAT env ([61738b1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/61738b1f2ac209238335733e6bafdff3ed93d501))


### Bug Fixes

* **networks:** make sure networks are registered with the right tenantID ([5d32fbe](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/5d32fbef370f7ee2743bae55d4215e516f817035))
* **qbs:** support QBS network ([5125efa](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/5125efa21dbf2e0d912c91f36bdc6aec863185f8))
* **try catch:** catch errors in case of invalid chain key ([fbfd20c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/fbfd20cca0e139a4ce30af06d1fa89f85455a7f9))

## [2.37.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.36.0...v2.37.0) (2022-01-13)


### Features

* **store:** add possibility to defiene wallet's store in QKM ([b158643](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/b158643cc586f366f412be21ce2ebd9b5fd8033c))


### Bug Fixes

* **qbs:** support QBS network ([5125efa](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/5125efa21dbf2e0d912c91f36bdc6aec863185f8))
* **try catch:** catch errors in case of invalid chain key ([fbfd20c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/fbfd20cca0e139a4ce30af06d1fa89f85455a7f9))

## [2.36.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.35.2...v2.36.0) (2022-01-13)


### Features

* **network:** add possibility to update network url ([2cd763d](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/2cd763dfe74b52e63ae4fa597ea4cb4a7fd5ecc0))
* **network:** add possibility to update network url ([cb02287](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/cb022872ad6af8620ed76a056744be9c048593a8))
* add network config for HKEX UAT env ([61738b1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/61738b1f2ac209238335733e6bafdff3ed93d501))

### [2.35.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.35.1...v2.35.2) (2022-01-07)


### Bug Fixes

* **networks:** make sure networks are registered with the right tenantID ([5d32fbe](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/5d32fbef370f7ee2743bae55d4215e516f817035))

### [2.35.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.35.0...v2.35.1) (2021-12-21)

## [2.35.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.32.1...v2.35.0) (2021-12-13)


### Features

* add carbon prod network ([979cdaa](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/979cdaaa18ebfc1b376ee4ef77c839be93b4e729))
* added polygon testnet and mainnet ([507289d](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/507289dfb3b772bbe69920ecfc64ef557c731885))
* added two new network fields ([081ae48](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/081ae487ae1bc042d68ff76d4cee61c0b4b91c7a))
* faucet creation modified to retrieve network ([909e924](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/909e924753d0b4258a16615e648acdb5fbe2f1c4))
* **orchestrate:** breaking change for v21.10.1 ([ae88317](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ae88317b5db1129f6778a3cb784f1565f3dc7eb7))


### Bug Fixes

* **gas limit:** support case of undefined gasLimit ([4923bf7](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/4923bf707f567dfe8297aa155f60b306a0738aff))
* tenant ID ([3feb41d](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/3feb41db0b1f623889313affe741684868a83dc4))
* **hardhat:** don't register hardhat when not required ([bf5c54b](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/bf5c54b15c44cddb0f451d8d00f4d3f60ee8cc36))
* unused netwroks deleted ([9a8feed](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/9a8feedc933b2d5e589252248d516d2c4beacf42))

## [2.34.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.33.0...v2.34.0) (2021-12-09)


### Features

* **orchestrate:** breaking change for v21.10.1 ([ae88317](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ae88317b5db1129f6778a3cb784f1565f3dc7eb7))


### Bug Fixes

* **gas limit:** support case of undefined gasLimit ([4923bf7](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/4923bf707f567dfe8297aa155f60b306a0738aff))

## [2.33.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.32.2...v2.33.0) (2021-12-03)


### Features

* add carbon prod network ([979cdaa](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/979cdaaa18ebfc1b376ee4ef77c839be93b4e729))


### Bug Fixes

* tenant ID ([3feb41d](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/3feb41db0b1f623889313affe741684868a83dc4))

### [2.32.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.32.1...v2.32.2) (2021-11-26)


### Bug Fixes

* **hardhat:** don't register hardhat when not required ([bf5c54b](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/bf5c54b15c44cddb0f451d8d00f4d3f60ee8cc36))
* unused netwroks deleted ([9a8feed](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/9a8feedc933b2d5e589252248d516d2c4beacf42))

### [2.32.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.32.0...v2.32.1) (2021-11-18)


### Bug Fixes

* small change in env sample file ([d68ac9a](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/d68ac9a1b2f52ae61c3aea70897c7b12a28d3adc))

## [2.32.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.29.0...v2.32.0) (2021-11-18)


### Features

* add network config for HKEX dev env ([8299530](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/8299530a63f3a88ac0b93391df49c02435602199))
* added hardhat container and env variable for faucet amount ([ee02365](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ee023650f9bee15dc6b4194b2d5f03e6f467f687))
* added support for codefi auth + added faucet functions ([8d90353](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/8d903539f6c8ca119bd43829869cb07b3555394a))
* added support for hardhat and faucet ([ee51670](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ee516704e660324c18520c04504c3bbda8bc7d27))
* changed name for hardhat url ([0b48ae1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/0b48ae11d12948721c077ab2bb15fc096a744726))
* **networks:** return list of orchestrate chain IDs ([fa652c7](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/fa652c7f204541267d43e84880aa5cebd380ef69))


### Bug Fixes

* **comments:** translate wei to eth ([d873f94](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/d873f943548905839824330e25a0bd6f9d585ed6))
* **env:** adapt env variables ([eadaf62](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/eadaf628d6fc75f9598e434d41fbd79d9c083b3a))
* **init:** add missing executions in initialization ([ac521fb](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ac521fb916645f244afb5eee4c2ba3d8519673c9))

## [2.31.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.29.0...v2.31.0) (2021-11-18)


### Features

* add network config for HKEX dev env ([8299530](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/8299530a63f3a88ac0b93391df49c02435602199))
* added hardhat container and env variable for faucet amount ([ee02365](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ee023650f9bee15dc6b4194b2d5f03e6f467f687))
* added support for codefi auth + added faucet functions ([8d90353](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/8d903539f6c8ca119bd43829869cb07b3555394a))
* added support for hardhat and faucet ([ee51670](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ee516704e660324c18520c04504c3bbda8bc7d27))
* changed name for hardhat url ([0b48ae1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/0b48ae11d12948721c077ab2bb15fc096a744726))
* **networks:** return list of orchestrate chain IDs ([fa652c7](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/fa652c7f204541267d43e84880aa5cebd380ef69))


### Bug Fixes

* **comments:** translate wei to eth ([d873f94](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/d873f943548905839824330e25a0bd6f9d585ed6))
* **env:** adapt env variables ([eadaf62](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/eadaf628d6fc75f9598e434d41fbd79d9c083b3a))
* **init:** add missing executions in initialization ([ac521fb](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ac521fb916645f244afb5eee4c2ba3d8519673c9))

## [2.30.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.29.0...v2.30.0) (2021-11-16)


### Features

* add network config for HKEX dev env ([8299530](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/8299530a63f3a88ac0b93391df49c02435602199))
* **networks:** return list of orchestrate chain IDs ([fa652c7](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/fa652c7f204541267d43e84880aa5cebd380ef69))


### Bug Fixes

* **init:** add missing executions in initialization ([ac521fb](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ac521fb916645f244afb5eee4c2ba3d8519673c9))

## [2.29.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.28.2...v2.29.0) (2021-10-29)


### Features

* **network:** add token x network - with gas ([bb92a08](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/bb92a087767f838008775ec1a9b88fc6174a3b52))
* Add quara demo (KSA) chain ([b168d90](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/b168d90430f348ad22ca2ab0c9e7f69199acec24))

### [2.28.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.28.1...v2.28.2) (2021-10-22)


### Bug Fixes

* **init:** add retries and make initialialization functions more robust ([227e0c8](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/227e0c817d2ff320bf68477f94e423f0cf09ea55))

### [2.28.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.28.0...v2.28.1) (2021-10-18)


### Bug Fixes

* **view function:** throw errors properly when an error occurs ([d3fcf7c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/d3fcf7c59a5426b9c2c626afde2fbbde75076ebb))

## [2.28.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.27.0...v2.28.0) (2021-10-12)


### Features

* **tenant id:** add possibility to force tenantId on all endpoints ([bb6235c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/bb6235ce6f8ebc70d2c6edd1f319fbaddb6e4be0))

## [2.27.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.26.0...v2.27.0) (2021-10-06)


### Features

* **network:** add qbs network ([6460945](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/646094518d7ff233609c518dc952fa2dc9c5f5dc))


### Bug Fixes

* **qbs:** manage gasPrice 0 constraint on quorum networks ([5e35eaf](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/5e35eaf395af8ff0b763a3d0a325b6899b40d1f4))

## [2.26.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.25.0...v2.26.0) (2021-09-24)


### Features

* **wallet:** add possibility to force tenantId when creating a wallet ([6d36e69](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/6d36e69f9555ff3c7909a7b82e842848f17b8bf1))

## [2.25.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.24.1...v2.25.0) (2021-09-01)


### Features

* **wallet:** add endpoint to retrieve wallet ([32187d1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/32187d10ee2333048842480ae80686c45fd7e05d))

### [2.24.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.24.0...v2.24.1) (2021-09-01)

## [2.24.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.23.0...v2.24.0) (2021-08-31)


### Features

* Add Carbon Pilot network ([f555d0a](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/f555d0a66836220368a5c276ada9f56109528093))


### Bug Fixes

* **compiler:** make compiler compatible with node 12 ([a71d367](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/a71d3677949762f1b0489a0f5ba200eb7dce2472))

## [2.23.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.22.0...v2.23.0) (2021-08-31)


### Features

* **QUARA-19:** register quara network ([97dfa42](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/97dfa42d52558436a9b6eb514e4f4b095b2668fe))


### Bug Fixes

* **docker-compose:** add missing env variables ([09287d1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/09287d1f1d6e35dbe5f202e918a1673a3e43f0e0))
* **dockerfile:** upgrade node version in dev dockerfil ([5f338dc](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/5f338dc6cf62217c061d00f70c89a08b9fac0671))

## [2.22.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.21.1...v2.22.0) (2021-08-03)


### Features

* **errors:** better manage errors ([2c37814](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/2c378145f85413158e8533721862e74779711bb2))

### [2.21.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.21.0...v2.21.1) (2021-08-02)


### Bug Fixes

* **orchestrate:** setup orchestrate multi-tenancy ([be8a104](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/be8a10423b3c3fd7d275290fc7f4cc8f49a4c00e))

## [2.21.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.20.2...v2.21.0) (2021-07-28)


### Features

* **orchestrate:** multi-tenant chain and contract registration ([d1ae107](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/d1ae107365ddcf2c0a387cf043fc8d3cbff17939))
* **orchestrate:** setup orchestrate multi-tenancy ([a97c3c3](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/a97c3c3c20bbaa8fb15f4f95961e31a80f180536))

### [2.20.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.20.1...v2.20.2) (2021-07-23)


### Bug Fixes

* **gas:** gasLimit can not be 0 ([b6e7def](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/b6e7def4a16c000b883f5206821f8543398039f5))

### [2.20.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.20.0...v2.20.1) (2021-07-20)


### Bug Fixes

* codefi_assets_dev_network update password ([b156555](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/b156555727ddbc4cc6d8113ad2312ea209a10d0e))

## [2.20.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.19.4...v2.20.0) (2021-06-17)


### Features

* **orchestrate:** upgrade orchestrate (wip) ([dcb8979](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/dcb8979432614d4d77b08181ddbf0ca3b173dc3d))
* update Orchestrate environment variables name ([3a0aa21](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/3a0aa21d9192811d716c0562152ad96457ad7570))
* update orchestrate topics environment variables ([1a056ec](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/1a056ec2762037f70f664ac00a38cf109704a33c))


### Bug Fixes

* **host:** do not force protocol to http ([2451336](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/2451336e2d224b98dcb8e67e65ea987b17d76631))
* **host:** do not force protocol to http ([9931f53](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/9931f53f6ab8609ea26dc44ef717895c9fc982e2))
* **prettier:** pretty files ([c04b131](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/c04b131a53729ebb6c7276beb87051e221cdacaf))
* **type:** orchestrate transaction type was wrong ([151b53d](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/151b53d76a9e664b7a02d8c90e64c88e7ea54058))

### [2.19.4](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.19.3...v2.19.4) (2021-04-30)

### [2.19.3](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.19.2...v2.19.3) (2021-04-28)


### Bug Fixes

* **gas:** add retry on estimateGas function ([2834037](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/2834037910bf22c313ace06a7947b271f529c560))
* **hooks:** pass errors in hook callback ([22aaf2a](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/22aaf2a4acfcda49200f0e3e274d0735df44014c))
* **network:** keep one single url ([e63c7d4](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/e63c7d485f0e13519338ca4a1bd4138a1e01e9b3))
* **networks:** add atom network ([e0e2b6a](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/e0e2b6a2218b4a6b0d035ef05c3ee88212473928))
* **prettier:** pretty files ([24133db](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/24133dbe4fe8779a773c8c1796b68fc61d22bff0))
* **tx status:** enum not exported properly ([f8a41db](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/f8a41dbee02971a4f4250e8b36018f00866d5b03))
* **tx status:** manage txStatus with enum ([7261e77](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/7261e77b6b8c06cc95a373daa3fe891846164f4f))

### [2.19.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.19.1...v2.19.2) (2021-03-09)


### Bug Fixes

* **network:** baxe tenantId was not correct ([c16b833](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/c16b833737623b0460e3c7a17dd11a4ac7b6f8f9))

### [2.19.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.19.0...v2.19.1) (2021-03-09)

## [2.19.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.18.0...v2.19.0) (2021-03-08)


### Features

* **network:** add baxe blockchain networks for Development ([62acb5e](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/62acb5e9d619e9b21f4dcf4065c2b9d4155033c4))

## [2.18.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.17.1...v2.18.0) (2021-02-09)


### Features

* **network:** add geth-based network ([932690a](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/932690a1e20a0e87aa11fa4b04a4a083340792cb))

### [2.17.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.17.0...v2.17.1) (2021-01-05)


### Bug Fixes

* **networks:** remove bot network ([17bd2be](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/17bd2bef9e1c57854b5d20fbf98711f8ad377587))
* **networks:** skip contract deployment if invalid network ([e63b815](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/e63b81509da1439718653b1834061f09fafe6424))
* **prettier:** pretty files ([0768c5f](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/0768c5fa17daa412efda8bacfc0dd8340e6ed3ac))

## [2.17.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.16.0...v2.17.0) (2020-12-15)


### Features

* **batchreader:** add batchreader contract ([588d260](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/588d2604a1c85ae1c3795b3ce70054b85342bf43))


### Bug Fixes

* **gitlab-ci:** bump version ([fe81d3b](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/fe81d3b49ef4022822d14be98bc8c82a980e4d17))

## [2.16.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.15.2...v2.16.0) (2020-11-24)


### Features

* add observability ([b02764f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/b02764f5b454e4a1f79b98379877b991e4795754))

### [2.15.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.15.1...v2.15.2) (2020-11-19)


### Bug Fixes

* **ci:** pull images from harbor instead of docker ([e615351](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/e61535156c614bf2dbebb86e8c41ac20765cdb33))
* **gas:** handle cases when estimate gas function fails ([c8a5f30](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/c8a5f30c76211d124017327886b717378f0f4e04))
* **prettier:** pretty files ([4782fae](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/4782fae8eb6dc405441b3376040ce396131070a4))

### [2.15.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.15.0...v2.15.1) (2020-11-17)


### Bug Fixes

* **view:** handle case of empty parameters ([ea238d6](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/ea238d6ff1fad43a48c08c58e48e1e1f727c1ff9))

## [2.15.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.14.0...v2.15.0) (2020-11-16)


### Features

* **contracts:** add new contracts ([e5fa239](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/e5fa23995f12d58ce4e12bcc7ccd8ae14debfbed))
* **contracts:** add new contracts 2 ([490e34b](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/490e34bbf0a034f086acbc06fb8c10602f5df848))


### Bug Fixes

* **prettier:** pretty files ([990b88c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/990b88c7d4f8084bb743e278b4b3774392af4b35))

## [2.14.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.13.0...v2.14.0) (2020-10-29)


### Features

* **contracts:** automate contract deployments ([7083bfa](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/7083bfa074d33ff2b96b089c2d2615af7be672fc))
* **contracts:** upgrade contracts ([345fac8](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/345fac8402776c8df54142faf05285437211ff2a))

## [2.13.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.12.3...v2.13.0) (2020-10-28)


### Features

* **contracts:** add dvp + holdable erc20 contracts ([2053150](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/205315086e5eabd0fc30b4058f96cfde4ef327ec))
* **universal token:** add new token contract (wip) ([f5aa47e](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/f5aa47edfd98e420006e1dec11aaa80117652e0d))


### Bug Fixes

* **contracts:** versions of audited V2 were not correct ([3ea2af6](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/3ea2af6072496e7ad078398d897c1ca5d3bce9a3))
* **erc1400:** erc1400 v2 was not imported properly ([a06d4af](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/a06d4af7beb099a064fe874745ee8204115b27ab))
* **token contracts:** import tokens directly from universal token repo ([84feea7](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/84feea76268861a2184aa2b015a76c14ae6a8221))

### [2.12.3](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.12.2...v2.12.3) (2020-10-26)


### Bug Fixes

* **network:** rename BoT network ([cbab862](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/cbab8626ad496676913154b1e18dae5ca64916fd))

### [2.12.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.12.1...v2.12.2) (2020-10-23)


### Bug Fixes

* **network:** better handle errors in case of network registration ([c9de714](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/c9de714b65eccf96ca6c9c865cd327a2210e5c30))

### [2.12.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.12.0...v2.12.1) (2020-10-20)


### Bug Fixes

* **networks:** network initialization shall not lead to api failure ([38f073f](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/38f073f92a625ec4be8477bc3d3bdbcb180903c3))

## [2.12.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.11.2...v2.12.0) (2020-10-20)


### Features

* **network:** specify networks tenants ([88d6a77](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/88d6a770ec7907d47819d8a9b0accba0859a658a))


### Bug Fixes

* **faucets:** disable faucets on networks with zero gas price ([0b4409c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/0b4409ca5793089344e65cb7e5ac501df09faf27))
* **network:** remove bot network ([b3ddc6d](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/b3ddc6dbfac0f37b28fc33cd34f88e461f292d84))
* **prettier:** pretty files ([e43a449](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/e43a4497d4683334b2fad3cf82c682e429f092cd))

### [2.11.2](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.11.1...v2.11.2) (2020-10-12)


### Bug Fixes

* add build/contracts folder ([61cc19c](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/61cc19cb519e0bdef15470331f3357a8b6db8898))

### [2.11.1](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.11.0...v2.11.1) (2020-10-12)


### Bug Fixes

* bump orchestrate sdk version ([8ffe6d5](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/8ffe6d5d07aea8ef3da206a3764a38b8a71d58e5))

## [2.11.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.10.0...v2.11.0) (2020-10-09)


### Features

* **networks:** Add BoT network ([c219827](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/c219827bed1f77658559aab829b64494df6c0180))

## [2.10.0](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/compare/v2.9.0...v2.10.0) (2020-10-08)


### Features

* **orchestrate:** upgrade orchestrate to new version ([a93b043](https://gitlab.com/ConsenSys/codefi/products/assets/api-smart-contract/commit/a93b0435b946c06690d2052195a1c13f18e12a64))

## [2.9.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.8.1...v2.9.0) (2020-09-04)


### Features

* **multi-tenancy:** support multi-tenancy ([332a629](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/332a6292dc5c97e55912bd8c80517346d6e26c09))

### [2.8.1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.8.0...v2.8.1) (2020-08-12)


### Bug Fixes

* **error_mgt:** commit kafka messages even in case of errors ([d504426](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d504426b59671a71c58373ed72437f37e2e6cc7e))

## [2.8.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.7.0...v2.8.0) (2020-08-11)


### Features

* **hook:** add possibility to define custom callback URL ([6ae86f1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/6ae86f1292d21fc484724adaf2c2e1dfa68f2397))


### Bug Fixes

* **comments:** clean code to resolve comments ([5d48be5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/5d48be5b5a874bf0bd1987aa6f70a584e22fda38))

## [2.7.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.6.2...v2.7.0) (2020-08-10)


### Features

* **gas:** define gas limit and gas price more accurately ([5e1e902](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/5e1e902b6fc265c90da17c0d6d59dfa536a3fbc6))

### [2.6.2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.6.1...v2.6.2) (2020-08-10)

### [2.6.1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.6.0...v2.6.1) (2020-08-07)


### Bug Fixes

* ci image ([a89dcf7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a89dcf7c5f6541c781018dcccbbea5062e4e0d23))

## [2.6.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.5.1...v2.6.0) (2020-07-31)


### Features

* **wallet:** empty wallet + refacto + default network features ([830adb6](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/830adb606879606a857389eb2c7dd8f4c99dbb95))


### Bug Fixes

* **env:** add default network ([6ea3476](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/6ea347633e125476318718edd9c7f1dad9a07518))
* **variables:** remove unused variables ([27a18d5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/27a18d5e3a526dd208e6118655e72dc70b0008b8))

### [2.5.1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.5.0...v2.5.1) (2020-07-29)


### Bug Fixes

* **wallet:** throw error in case wallet format invalid ([9283d80](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9283d806c58b193473a0ceb9bcc6b1679629f08e))

## [2.5.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.4.0...v2.5.0) (2020-07-22)


### Features

* **batch total supply reader:** import improved reader contract ([2613a43](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2613a4316b0c24cc35f06e60fd428c818db7a169))

## [2.4.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.7...v2.4.0) (2020-07-21)


### Features

* **erc1400:** new contract version including totalSupplyByPartition ([293126d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/293126d24d91f0ca2e375b4696016443c11fe6bd))

### [2.3.7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.6...v2.3.7) (2020-07-09)


### Bug Fixes

* **prettier:** align prettier on assets-api ([efd21a5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/efd21a58d2628dcaeb899c2f9043bc47d1096166))
* **raw tx id:** id shall not be deterministic ([ec4a601](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/ec4a601fa65d617bd40507eef8deb6aaf11add14))

### [2.3.6](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.5...v2.3.6) (2020-07-07)


### Bug Fixes

* **retry:** add reties on hook endpoint ([1d2424b](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/1d2424b2972d07e01ed5ef43021db4ba46e58347))

### [2.3.5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.4...v2.3.5) (2020-07-03)


### Bug Fixes

* **env:** remove unused variables from .env file ([45c2eab](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/45c2eaba6c9257a7d5482b811c25c333d47cfd43))

### [2.3.4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.3...v2.3.4) (2020-07-01)


### Bug Fixes

* **husky:** bump version ([d609a22](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d609a224a53b26fd37d8c8df3341f317abde0c49))
* **multisig:** stop importing Multisig contract from remote repo ([12df68e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/12df68e7ce5912e20bbe3ea45c3464cb42c6af06))
* **yarn:** update yarn.lock ([18e51a5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/18e51a5f2404e4c0516744cb443d45f31a90c27d))

### [2.3.3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.2...v2.3.3) (2020-06-24)


### Bug Fixes

* **gas:** gas price shall be undefined in order to be set by Orchestrate ([7c4668e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7c4668e4532410776bea461a88b47c9b7c6562c8))
* **index.ts:** typo ([c7d8cd3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c7d8cd3d15e1016aacf63cdbbf1f3109a5a3e37c))

### [2.3.2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.1...v2.3.2) (2020-06-22)


### Bug Fixes

* don't use 'value' name in logs ([f1589dc](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f1589dc7ec180a4bb1033c02441363c4483284b9))

### [2.3.1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.3.0...v2.3.1) (2020-06-22)


### Bug Fixes

* **consumer:** update logs for debug ([1c85504](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/1c855041a3f1089eab4a942e79145e75fcbdd27f))
* **consumer:** update logs for debug 2 ([85fc256](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/85fc256fc39846e69a121459622f9817fbf8c16f))
* **logs:** remove useless comment ([2e7b85d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2e7b85d149d92263f9cfc3b2af150017d727e8ac))

## [2.3.0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/compare/v2.2.0...v2.3.0) (2020-06-22)


### Features

* added @codefi/observability package to log ([a586085](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a586085d0d71b50af1dcbc5179f647c266079873))
* **hook:** trigger hook only when call is made by Assets-API ([01ff6b3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/01ff6b383b5beb60b45548faadb8e81a626930c7))
* **logs:** log context to display properly in Kibana ([f1d31a5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f1d31a5efa1651155a3cb96dc03e3c611225728d))


### Bug Fixes

* **consumer:** properly manage errors poping in consumer ([c2eb8ad](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c2eb8ad79ee95c8ce4c92e4f6eb6375faf9793f2))

## 2.2.0 (2020-06-11)


### Features

* **53:** Added test for lib/web/hookTrigger ([8b60d43](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8b60d4307c8ef0cd409c5a7e359deb8246e462b4))
* **54:** Added test for lib/utils/validator ([9ab1258](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9ab1258a9b1fa556cd3c2a62f4becf3e2e9dbfb3))
* **args:** Format args ([367852d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/367852d9405f95e9a469c16c6a5ab471c22a1dec))
* **async:** Remove async parameter (replaced by authorization) ([2789a94](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2789a94dc6ef7147eb0467b7ae92f805500aa0d2))
* **async:** Remove async parameter (replaced by authorization) ([3af22f3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3af22f3de6cee40981197c2a6a5e010a428fb1a8))
* **auth:** Add Api-ui-aggegator secret in request headers ([d91010f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d91010f073a7ffa5683eb198045115684d80fb18))
* **authorization:** Add authorization json in parameters ([62b6c80](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/62b6c80b63e14fcf392338e8d919fee8fb1255da))
* **balanceReader:** add balanceReader to the repository ([aec1f6e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/aec1f6ef31a0ab4506a0083a9a6972facc8c206b))
* **behaviours:** Add new behaviours to ERC20 and ERC721 ([3506be9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3506be99903b47dcdd80c80c558ea00ade1372b5))
* **big number:** Make sure big number are handled correctly ([7b8fd81](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7b8fd81a8b4cbeff18dcd850f039ba5771ae133f))
* **big_number:** Format parameters for big numbers ([257b38f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/257b38fc404384de726a24767835313990c1ac4a))
* **bridge:** Add routes to interact with bridge contract ([920fb6e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/920fb6e09185bb4feef55651750e82f4325b0668))
* **build:** update scripts to work with typescript and Dockerfile + nodemon ([45fcb0c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/45fcb0cacc0d875d68967aaccfbe708260c52a43))
* **chainId:** Set chainId as parameter ([497165e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/497165e68434cdb2bcd795c83c7c6020b827fa04))
* **chains:** add rinkeby deployment feature ([183c3dd](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/183c3dd99ef4958d7cd309b7afa3dc8a690eb8e2))
* **ci:** allow sonarqube failure ([f8b8b7f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f8b8b7ffc865cc4973743556e8bd0ff8c8420f62))
* **consumer_group:** filter tx for consumer group + refacto ([d1d98f9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d1d98f9f4fda6ff9ca1215f00b457dd4fde479f6))
* **contract registry:** Automate contract registry ([66329b3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/66329b30adc2fa4081f599e54163680a827258cc))
* **contract registry:** Test of contract registry ([4c40056](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/4c40056bcc0fd64adace3ccbfb0c1d2762328e53))
* **contracts:** Add ERC20 and ERC721 token standards ([3523ea4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3523ea406d9bbf826ffde485e498bd383f84d3db))
* **contracts:** add new route for balanceFetcher ([307e1e3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/307e1e3c0ad2b17f9f205d8a00ab38c7db8ea968))
* **contracts:** add version to contractsConfig ([af3d543](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/af3d54364a1976468b5b4618349b25edad28e888))
* **contracts:** Import new contracts ([8561010](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8561010833ff58bd7630de93a0c00626fd64c349))
* **contracts:** Import new contracts (whitelist) ([fab0b06](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/fab0b06583ff2b95d01694384aa1473064aa6dc2))
* **contracts:** make ERC1820 deployment idempotent ([fd4ee0f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/fd4ee0faf81dc55779882a6a17397d19fc1e4ece))
* **contracts:** upgrade all smart contracts ([ae55a3c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/ae55a3cf75e2fd6aa8a549a4dc8a8a4a8086d4e5))
* **corestack:** Catch error when CoreStack init fails ([b98639f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/b98639f27105b8247b5cd19111368d4ee2d9782e))
* **corestack:** Functional contract deployment ([510d12d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/510d12d34395a10bcb57136f0886cb410c0c7279))
* **corestack:** Transform CoreStack config into a class ([cce3fb9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/cce3fb91f6772614a60ecad6d15fe8928cf5ce89))
* **coverage:** add instanbul to the project ([f516621](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f5166214cec2dee7cb2e483ccf98400c990fca6f))
* **createRawTx:** Add ethService to function ([5df0237](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/5df0237f954aef626d3d83c14ff25d5d29c0b959))
* **deploy:** Add logs for debug ([4281fb7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/4281fb799762c2f0e38be184429c843f46efa231))
* **deploy:** add the possibility to force deploy ([18b139e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/18b139e08b5a3bcc24784200cdffb347ba9c837e))
* **deployer:** add balanceReader deployment and registration ([9009ea1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9009ea1fb8f5b3abe1889f002d188b1d766d73aa))
* **deployer:** add possibility to retrieve deployer address ([c136b9a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c136b9a4d8a6482dc4ded0ca3a60e4b6e8ceb44c))
* **docker:** add vault external network ([e456af6](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/e456af6e3abbad6d4398dc16656f84bbd3943e30))
* **Dockerfile:** Replace yarn with npm ([99e15c8](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/99e15c864ace726dd21881934b335431bdd4be43))
* **Dockerfile:** Replace yarn with Truffle ([f8a7ac8](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f8a7ac8b1a180a2de23ffb62d33a78eb8a1732e5))
* **documentation:** update README ([da63e7f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/da63e7f5d965559a1f69a55d6c2d1118ea408f88))
* **endpoints:** move all web logic to a different directory ([0a2959c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/0a2959c56510b3b2245b3897fd40c82a43d07ab8))
* **env:** clean env variables ([c62325a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c62325a3ef7f0f708d79140ee3b07c816d770313))
* **ERC1400:** New version of the contract ([3eda784](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3eda784f0cca7c56956350c492c499d69f58053c))
* **ERC1400:** Replace contract by new audited contract ([28ae09a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/28ae09aaaf4cef1a0d9f120041d018a719215869))
* **ERC1400BridgeAdapter requests:** Add possibility to import contract with .json file - Instead of .sol file ([929878b](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/929878b58e9ba007bee9e937df5f5c95b8bb8376))
* **ERC1400OOTC:** Add routes to interact with ERC1400OTC ([6fc9bd9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/6fc9bd9f0a47c59038a89ccfecde95e4022010df))
* **ERC1400TokenSalt:** Add the possibility to use the ERC1400 with salted certificate ([a6a15a3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a6a15a37deeedbf7021317a44bfe06759ba58277))
* **ERC1400V2:** Add ERC1400V2 + extension ([7764a37](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7764a3742e320188f17647121abedb83696c4f4a))
* **ERC721Token:** Add view function ([bd36203](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/bd36203df1d3cbb098b8408195e4c104567bd73e))
* **error:** Better handle errors ([87ecdd4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/87ecdd47a68e1e6392a9cd3507b3c5a092eabec8))
* **errors:** clean error handling in routers ([633cc9a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/633cc9a63bed4d2061e34a50a8fd96bd9e9e87f6))
* **ethService:** Rename authorization parameter into ethService ([d435703](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d435703b42bcdd839c1133adcac7b96f6b63a6c4))
* **fuel:** create a route for creating a wallet and fueling it ([982e616](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/982e6168b9290deb00ea32315ce68268bae637a3))
* **ganache:** enable setting a given mnemonic in ganache ([8d503f6](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8d503f69373facc2b77c433ffd5e73de2471be32))
* **gasPrice:** Enhance gasPrice for Mainnet ([7e4390a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7e4390abc4cfac576d1da35f09a2306f0de9682a))
* **gitlab:** add a testing stage ([06b4e7c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/06b4e7c41f20db6523531bd508b9db5355996dd3))
* **gitlab:** add linting stage in gitlab ([3b3b23b](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3b3b23bbdef99f52e213e32abe19627f49cc4647))
* **healthcheck:** add a healthcheck router ([1bbbced](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/1bbbcedb564a67dc75483bfeff93942d91d488f5))
* **hook:** Add logs after hook response ([3a02ea4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3a02ea4257a8632cf7090db86a00a48796e4affa))
* **hook:** Add txHash in hook parameters ([ab430a5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/ab430a5411a7a902dca95db1e95e284a7030c255))
* **hooks:** Add route to trigger hooks in api-ui-aggregator ([efc92d5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/efc92d5c6bbbcc1bce3990b3cd0fac212fc902c5))
* **integration:** On-going integration ([8079fef](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8079fef6804820887d292d414912ecc03acf4ef3))
* **integration:** On-going integration ([aa4bf7e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/aa4bf7e20a83d40073ea5eb64e50495beeb15b15))
* **jaeger:** Add env variable for local opentracing testing ([e98c8e2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/e98c8e28c8e37543651e019f36d7cdd6141ba794))
* **kaleido:** implement funderAddress refueling ([be40e0d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/be40e0d6286c4d09390ca37d58e507f20b65fff7))
* **ledger:** Return raw tx for ledger transactions ([73f890d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/73f890db303a0426c04d1c1e446951b54117a60e))
* **linter:** Add a basic linter to the repo ([90915d7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/90915d7734469ab602fed03a801fd7db4f467d49))
* **logs:** Add logs ([e85710e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/e85710e06ccd57f1279f2266636dd07784e1685b))
* **logs:** add some logs for wallet creations workflow ([85b5167](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/85b5167026e43e52be23376001318965ae3e5a6f))
* **logs:** Reword logs ([f54f6b1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f54f6b184ec9f4fe81d514d378b0c8cacf6a8610))
* **logs:** Update logs ([3042cbd](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3042cbdfcc1a5b00059c5c829e56fcecbfb2fbc7))
* **mainnet:** add mnemonic ([f9a7dd1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f9a7dd14b4026e022d6ef06bd5f94e05c1ffcc5e))
* **mocha:** add mocha to the project ([97a18ce](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/97a18ce09f15475582206ff2e9e8ab51a8d7b0a3))
* **multisig:** Add Gnosis multisig wallet ([686e32f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/686e32fd908cd21727eb1395572fea8bafcf17dc))
* **networks:** create a networks confil file and a route to fetch them ([0f35a3d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/0f35a3d666df60a8d5757c79cee7d1d6470d5295))
* **networks:** replace Kaleido network ([c82d0ca](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c82d0ca1e9eff219de1118ab86b3a485f1e80a95))
* **On-boarding:** Update .env and README to ease on-boarding ([042554b](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/042554b0ef9c79d9b6bd4356b11c224563c5d162))
* **openzeppelin:** Add ERC20 and ERC721 contracts ([5042c7a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/5042c7a5ddd43009baf17b5bb565c786e73980cb))
* **orchestrate:** Add possibility to retry transaction when gasprice was too low ([287d844](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/287d8441cd84d22e18888356c6eb767faac00e2d))
* **orchestrate:** Fix adaptation for orchestrate1.0 ([66a8ffc](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/66a8ffcfe68ae27431d9c4978a4fb1c2cfb5d1c7))
* **orchestrate:** upgrade sdk version ([b8ef688](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/b8ef68886366fc31578eaf078cbcdf0b3657865a))
* **orchestrate consumer:** Handle case of error messages ([d488979](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d4889792ccd223c266d61747cfb3503f8044ea52))
* **orchestrate errors:** Listen to topic recover for error handling ([3076480](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3076480f523ee9aa25636817d874caff3857aa83))
* **OTC routes:** Add routes to transfer tokens through OTC contract ([4ccfa56](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/4ccfa561ea8089c3ead3d15982ce1afd0d3ff92d))
* **raw_tx:** On-going development ([753960d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/753960d24d25650e5c96453ad22831ce1ab19e56))
* **README:** Add logo ([7f7d10a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7f7d10a6e76e37cf7e5e880f144582530d08dbd0))
* **README:** Update README ([0ffec96](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/0ffec965665b580370d91840ed77fcb70b6f6f13))
* **responses:** Update api responses format ([052b3c4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/052b3c4f8fae8c321c159e322907c566f37429ad))
* **rinkeby:** create a new account and fund it via a faucet ([57efe1b](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/57efe1bde035fd7cc78a3ffb51ec3653e137e86a))
* **rpcEndpoint:** Add possibility to set custom rpcEndpoint ([cdc5dec](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/cdc5dec84223be63d24352c1c8dac4233321f4cc))
* **rpcEndpoint:** Add possibility to set custom rpcEndpoint (for contract deployment) ([9c6d70c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9c6d70c7dc530aa1178c9ac2d7e63c25ee8c00f5))
* **sdk:** bump orch sdk version in order to retrieve revert reason ([106b7b1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/106b7b194095e2bc6546bcc3f969ab196df957fe))
* **SDK:** Replace CoreStack with Orchestrate ([2c820ea](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2c820eaf483c01f2eec989e5cf8298115a9221d7))
* **secret:** replace ui-aggregator secret by assets-api ([160856c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/160856cd3ce59923aacc63744fd56991e357b4d0))
* **sendSignedTx:** Add if else condition ([7379dfc](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7379dfc4031af304eed1d830a2843011a3b70f69))
* **sendSignedTx:** Add logs for debug ([c37fd9a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c37fd9adb2284bb9f03eb0ca1094f6686951d173))
* **sendSignedTx:** Do not wait for receipt ([3ea7ce4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3ea7ce47f4c05cd02e1f814d70c63c2c0a6d2da3))
* **sendSignedTx:** Update response messages ([8f92fbc](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8f92fbce8d3d2e15efec8fb9e8048d5c9a1fb29f))
* **shipl:** On-going integration 1 ([7c8a497](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7c8a497c47fa4b7ee0ce286b7ba1f0bb2b774911))
* **Shipl:** Rename Shipl MultiSig contract ([2d08124](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2d08124697845783a3209c472cce939655072cf2))
* **signed_tx:** Add route to send signed tx ([3b1e0c3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3b1e0c304bb5a2261b547f5c242d8143607c41e6))
* **signedTx:** Specify tx-nonce when sending signed tx ([75191f9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/75191f9ddbed06bead27340f99f6d20eaa5ab236))
* **swagger:** Updated documentation ([f4200c7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f4200c7399d678639248235d9724988698f78476))
* **txData:** Add possibility to craft txData ([0dd2394](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/0dd2394a10f85147e6711d4ff578c9e1a48b2076))
* **typescript:** create a types directory and add Orchestrate and web3 types ([84b5db5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/84b5db50e9d6258672a478248a30f1d39149cc11))
* **typescript:** first pass of file switch from js to ts ([3684bb9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3684bb9b5e702a4dc4e3c4beaf70e22ffabb0a9d))
* **v1.5:** Clean some functions ([f36ea7b](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f36ea7ba42100cb4deaf9fdaeb11eb0ae78201d3))
* **vault:** Disable secret store ([8c65af8](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8c65af82538b8667e15cd88e975fab86f265b98b))
* **vault:** implement write method following fueling ([eb1e592](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/eb1e592fff18ac6b52b287809e13db1e61d86ec1))
* **view requests:** Add possibility to make view requests on multiple chain ([7069687](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/706968793a86ae7beac277d177bb86f7f6af082b))
* make contract deployment generic ([d46c86c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d46c86ca7095af37d024c6ee8cade89ee104d2b6))
* **wallet:** make funderAddress param optional in wallet-create endpoint ([d077e7c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d077e7cc9d536b0f983b052ca3833dd552200e26))
* **wallet:** Wallet integration (on-going 2) ([7561d26](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7561d26214a0a88514dbef494e795a4e8178fae8))
* add support for shipl wallet signer and shipl meta-transaction ([593b52a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/593b52a0fbc572c429b94c0d4da1ec8bc981f7b2))
* **wallet:** Wallet integration (on-going 3) ([7526d17](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7526d17bc27ab30e8a23ce13ef1a405943772a91))
* **wallet:** Wallet integration (on-going) ([cef0d6a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/cef0d6a42250541e2ead06e97bbc1a9a8553dd81))
* **web3:** add a current web3 to the project and fix generic routes ([113c5f7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/113c5f7504a78019cad00b649ea26f60eddaea92))
* make the backend capabale to sign a tx with the shipl vault and then send it to shipl Meta ([58f042f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/58f042f9ee41c63235e875c069e525a60d0e19f3))
* move faucet mnemonics to networks.js ([dc01488](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/dc014889ab101654d74de07eae965fed5888da21))


### Bug Fixes

* **.env:** Update private keys ([3b1338a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3b1338ad04c7a5c769079753163055aecd33cd04))
* **auth:** Request headers typo ([4d51ac7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/4d51ac7c3110f133f23d82cd00727b0a69982ccb))
* **big_number:** Adapt number format to big number ([197e7c3](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/197e7c37db07850ba06fa46f9de3dd7eabe48667))
* **bignumber:** Forbid the use of decimal numbers when larger than 10pow20 ([78006a1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/78006a1db9805c0cb68b1a8bc995b03c8408643f))
* **bugs:** shipl integration ([38693d4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/38693d4773e87d3a240941ee90e063dce8f73aef))
* **build:** add build-args ([8f60368](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8f60368ab3e5dda34bdb8abd8f6916fc2409ffb2))
* **chainId:** chainId can be retrieved from ethService ([1bbb5b7](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/1bbb5b7a81de37baad1a5982cb6778adb877c3cc))
* **config:** change kaleido config key ([080209e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/080209e79e64bf5c3e46b2519d9952841f733a7f))
* **config:** typo when fetching config ([950a2f1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/950a2f10c60d5c24e81613ab680b359b965accf7))
* **config:** typo when fetching config 2 ([9c7623a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9c7623a2c9681b18c28657fa879e281f97fe3b0d))
* **consumer_group_id:** specify consumer group ID for wallet as well ([96938ff](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/96938ff175ca26a6d1ac691b455983a4b29d24ea))
* **contract registry:** bytecode was not set correctly in the registry ([4ffdc6d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/4ffdc6d80ff9eda174b38e05fe049b9f347c8585))
* **contract registry:** Remove expect ([f52220c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/f52220c3c6d4f3fdf12e49f84aaa88b9b8415dde))
* **contract registry:** Update function names ([c56bbac](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c56bbac3873ea8f11426d7163009f19beca62e9d))
* **contracts.js:** Slight change to make sure local version and deployed one are similar ([23fc460](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/23fc46086b8c2e1b316d44b739e19274b0e2b594))
* **corestack1.0:** Indicate senderAddress when sending raw tx to CoreStack ([10d45d9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/10d45d9a85afd817a5e4cfcf5ef58db9d062233d))
* **crafting:** rename method to methodSignature for new orchestrate message format ([e86c23e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/e86c23e7f647f4278c3d427a8e7d2d7191f6d882))
* **deployment:** Encode deployment with ledger ([e32cfb9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/e32cfb96643d190b37bc4ae5ad1528be9129061b))
* **docker-compose:** Enable to use docker-compose command ([1de5d6c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/1de5d6c31f2b4a0fc7f1184e976d31a66ec2313f))
* **dockerfile:** create build file in builder container ([51c9608](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/51c9608febebd9713dd763ab775154dadba5ea04))
* **Dockerfile:** Solve problem when compiling contract in nodee_module ([cc98115](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/cc98115b0e0e62e8920acca9a1492b5262560d9f))
* **Dockerfile:** Swotch from npm to yarn ([926ad63](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/926ad6348af54e7113740962df5d31e112678429))
* **e2e:** remove verbose console.logs and fix gasPrice round ([a04fea5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a04fea58ff2b961e426593dd3ad3052d6aa8fa1b))
* **env:** add .env to .dockerignore ([5fd2902](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/5fd2902ecdb0c92930b5ac30e45afac0c73675af))
* **environment:** Replace dauriel environment by staging.cofi ([9ff0d16](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9ff0d166b8e7df731d40f73ae6b85afec5a5f07f))
* **ERC1400:** New versions of ERC1400 ([289d14f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/289d14f56e79f71dca8103d9187f891c8f00b808))
* **esling:** Linting errors ([c63c641](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c63c64174e2413b3988efd516a38ebcee3b8e542))
* **estimateGas:** Add from value as parameter ([a2ccac1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a2ccac196c16caa016913e80881200b3b45c7e9b))
* **ethService:** ethService json was not parsed when passed through query ([85b6683](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/85b6683f7caf776feb43ffb3b9b5db0a8b8c75f1))
* **fitlab:** add USER and PASSWORD to the testing container ([e18ce71](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/e18ce7105640a03db1da9e6d6fb8b0c1eead8e26))
* **gasprice:** compute gasPrice dynamically based on ethRequired ([540ffac](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/540ffacc7de25ec07e77ecc5377b676dee6ffcf0))
* **get-tx-receipt:** Handle case where txHash doesn't exist ([9836f6c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9836f6cd3392c9b090bde7da3c09c41588be6da6))
* **getGasLimit:** was not working for ledger contract deployment ([010a4c0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/010a4c097b448d09cf3d172167a0da2f0f6e3871))
* **gitlab token:** Change env variable names ([9fff5b0](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9fff5b05d565dcdbc6070dc1108a1e0b5e4399ed))
* **gitlab token:** Change env variable names ([d7b88c2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d7b88c2263f0858ca16d8686d31125bb732e64ae))
* **gitlab-ci:**  fix build on master and tags ([7eae2f2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7eae2f20b960b121913fa5cd039be9f4f86b191d))
* **gitlab-ci:** update env variables name for build ([2d92b64](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2d92b64ce2138082ab9066d30a340a30fcf33dd8))
* **hook:** Better log response ([953eed5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/953eed56bf264cfb001a50155d9243660110c55f))
* **hook:** Case of reverted transactions was not handled properly ([a57c0c9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a57c0c93712fe6a25688a9bf78fd5a6477736f04))
* **hook:** replace true-false to 1-0 in hook status payload ([bacad91](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/bacad9133895d7685eb5a53e7c2611c1254004f8))
* **hook trigger:** Receipt is not defined ([783c1db](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/783c1db1df993e3cd745d4b5146447f1e4ff86b4))
* **hooks:** Fix ledger transactions ([dc5d2b4](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/dc5d2b4f74bb291de220d063d71bb69b54cdb710))
* **kaleido:** disable create-wallet-funder-funding if chain is not kaleido ([c617b6d](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c617b6dc115522f925e2863214b611bef637094b))
* **ledger:** Correctly handle errors ([5a7a8cb](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/5a7a8cbc25a5c14eefdf7cadab04cd96cdfbc37e))
* **ledger:** Return raw tx for ledger transactions ([a186f33](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a186f33df9e678af4e8132bea949872f2a0c2a7a))
* **ledger:** sanitize raw tx broadcasting flow ([85e7bd2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/85e7bd294bcc2464702729ba9e088e8d76ad4d7f))
* **lint:** add missing semicolon ([914583f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/914583f77de2301a6c3089b77c8cef7b9b06c650))
* **lint:** Disable line ([6dbe336](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/6dbe3363f17912f751e8d1be4658243788a7da4e))
* **lint:** fix linting errors ([d7a48e1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d7a48e1289ea9d6da54e6d43051d27a14fb3aa27))
* **lint:** lint the repo ([367e90a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/367e90aa81696f0d303392c4f5f63cf71d45a1e9))
* **lint:** linting error ([9bbf29c](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9bbf29cb0da0669b8709d89d0dc7ba08da86e2f3))
* **lint:** linting errors ([710b6ff](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/710b6ffb22759f1659b6086e817c89689281e7e8))
* **lint:** linting errors ([82a05af](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/82a05af86d34b69cc0cde11bb393fe36d97c042f))
* **lint:** Linting errors ([a8ed689](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a8ed68994c04d6caed424a9323752e09046cb1ec))
* **lint:** Remove doublequotes ([92afd3e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/92afd3eb01a7d7ee920e15a2a5e970661274db84))
* **linting:** Fix linting errors ([a45b075](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/a45b075f05b665f842bd4fb0cc4d7c3b370f3d98))
* **local:** fix local .env files ([cd1dc39](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/cd1dc397f12b63e71618461c8e8805418c9ad18e))
* **logs:** Add logs for debug ([988ee45](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/988ee45bed76bf3ce952823aab798dccd42fa09d))
* **merge bugs:** fix linting and var assignements ([69f864e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/69f864e6168cdb5f895974d663be55ed4e55f43c))
* **naming:** Rename retryRequested into retryActivated ([61437c5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/61437c5d3e40e9fb76e7e20d6d762f16aa37aa62))
* **networks:** filter the mnemonics we send to assets-api ([6309c00](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/6309c008bd056a9a9d2693b8b87242a4aceb7bf3))
* **no-var:** add the no var rule to eslint and implement it on the 2 cleaned files ([0dcf2f9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/0dcf2f9d7e1149766e8614c7471009aa1f1aa09e))
* **nonce:** Handle case of zero nonce ([fd021c1](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/fd021c1d98ff3c9ed3f7384101180a017a92eeaf))
* **orchestrate:** Do not specify the gas price ([b4628ac](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/b4628ac0a744ae03e6cce528990ccfb46225fd39))
* **package.json:** remove rm-rf commands as those cannot be run inside the container ([df6cead](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/df6cead59c731caa09827fc5d81f8697845874b8))
* **registry:** Add contract in registry properly ([9d879f9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9d879f9f68f1b2142582a884327e64c2d3efaa1f))
* **retrieveAccount:** Missing function import ([6881f91](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/6881f91c680db86ee962905f5b27a928d10d5116))
* **retry:** await was missing ([34e3bfe](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/34e3bfe0004a49d19b5a8614ef595389230962a4))
* **retry:** return after resolving ([594f03f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/594f03fa87a825b12480507922b63c80b235b704))
* **route:** move healthcheck route from index ([8fcff1b](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/8fcff1b02b199629bf2282640bcdafac41aed684))
* **routes:** remove unnecessary balanceReader route ([421e9bd](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/421e9bdd1dc53673b374964fccecc466ba1c1ebe))
* **routes.generic:** fix generic router ([72bac87](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/72bac87ad820e08016847fedc74b5a3cffd3dd87))
* **rpcEndpoint:** Handle case of empty rpcEndpoint ([33216b9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/33216b92c8905151a59d5e6853e62ead0e2a284c))
* **sendSignedTx:** Add logs ([b495de6](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/b495de6a9cb8918d41d0ac82e2850af404c56e42))
* **sendSignedTx:** Add logs for debug ([d2443c2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d2443c24441a5765f8195d01b3cfa0b490d42038))
* **stages:** remove test stages as not yet implemented ([3db124a](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3db124ad9ccd269a06f3d209b9dd601f9122bcf8))
* **tests:** Add ERC1400OTCMock in the test file ([7d952ff](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/7d952ffdc904c6a0665fae34372c94a61e600881))
* **tests:** make config loading modular and testable ([ef51b02](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/ef51b02a27ce2a5e85ba960d014182f8c94a9918))
* arguments are now passed to contract deployment with Ledger ([2f658dc](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2f658dcdcb3490f208519d7c7b10e6ea9c7a15f6))
* **transaction:** integer parameter shall not be converted into hex ([1ed9fc5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/1ed9fc5002d3300dd8bf1ec8df12546ab8ba9af5))
* add corestack again ([6a9ddb2](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/6a9ddb26aff4b98ea636e7d6ff4526eb886721e6))
* add groupId on consumer ([1643599](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/16435997e54fc8e3f22798fb4dcec077249ebbcf))
* avoid removing the build directory prior to truffle compile as it cannot happen inside the container ([ce9f6a5](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/ce9f6a5b2f57ef373f63fccdad943ace9c9f1204))
* bug in shipl deploy contract ([023c60f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/023c60ff8a390b64073da1e574b4117d9a9144df))
* code in deployWithShipl ([441cf31](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/441cf319f2d0de0f32c34922b9dfe8e26cd46e8d))
* delete lib/web/ethers.js ([d020430](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/d0204300708a45f2833473dfce7b97b5a6570670))
* linting ([3ef6418](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/3ef641892b42419ece14fb3cfe97acd432b89c2e))
* **transactionRouter:** fix shipl feature ([2b99b8e](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/2b99b8e0da6079512c7e3f3b669829b4920bbe95))
* remove test ([b283859](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/b283859bb2523e6a2362018681d469301332d7fe))
* **tsc:** set tsc version in package.json ([c86b157](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c86b15753719d4c7f41de0fddf29761406e0c43a))
* **tx-sender:** Update the way transactions are sent to Orchestrate ([b96fffb](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/b96fffb1834e0d8a105a125d59eaaf708dd97268))
* **type:** type needs to be a boolean ([207ff98](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/207ff986666ce13267754e66d06f335d03087342))
* **typo:** rcpEndpoint --> rpcEndpoint ([39838ab](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/39838ab06aa0d9a22345e8a4dc52f325dadaf6d9))
* **url:** switch assets-api-url to /v2 ([c7ca5c9](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/c7ca5c938094d611f3b40322d924916c0d491581))
* **viewRouter:** identifierWalletID ([50e4165](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/50e41655d7d483817eae197e3d87ff6831f30d9f))
* **viewRouter:** turn calls into GET requests ([9ce3969](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/9ce3969833becabc2f21f3b9b624475d23492920))
* **wallet:** Check if ethService exists before using it ([4b04025](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/4b04025ae8f9d8157a10688b94f2386c804a20fe))
* Push a fixed limit for the gas estimation ([aad1b86](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/aad1b8697d82c514e7283a26fd94b213b31143c8))
* Remove extra debug logging ([352eb2f](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/352eb2fdcba62751123f204b55394083236d2b05))
* **web3:** Pass ethService to initialize web3 ([92b50e6](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/92b50e6da7aa89d48aed4eee8dda7ada0abebcd8))
* **web3createTransactionRequest:** bug in request ([fc10e36](https://gitlab.com/ConsenSys/client/fr/dauriel/api-smart-contract/commit/fc10e368c5b0bcea8208f0f6b96f7f23fb12ea7e))
