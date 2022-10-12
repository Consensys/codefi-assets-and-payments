# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.97](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.96...v0.1.97) (2022-08-02)

### [0.1.96](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.95...v0.1.96) (2022-07-14)

### [0.1.95](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.94...v0.1.95) (2022-07-14)


### Bug Fixes

* remove useless deployment folder (gitleaks) ([4974ba6](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4974ba6c1b52a6a7fd34b1540c914349a011d5db))

### [0.1.94](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.93...v0.1.94) (2022-07-07)

### [0.1.93](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.92...v0.1.93) (2022-07-05)


### Features

* **CA-6699:** align all services with observability package apm usage ([c9ac014](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/c9ac01491448b6adbe65f6aaf01f02cfd0801458))

### [0.1.92](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.91...v0.1.92) (2022-06-22)


### Features

* **asset classes:** add state transition for the add class workflow ([6f6bb0b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/6f6bb0b9750043f5a9239ef11b7cdaf670d51f2f))

### [0.1.91](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.90...v0.1.91) (2022-05-30)


### Bug Fixes

* add workflowInstance validation for undefined workflowTemplates ([361ebaf](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/361ebafbf75b53b028fba9f72916758f9c269c0a))
* ci cache key for node_modules ([2b150bc](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/2b150bc6c8562e9c3db53a0fb5b125f5c3a99b95))
* docker-compose vars and align pg versions ([73d0281](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/73d0281f3a2178f4e2800150ef00cc37cf636da7))
* fix bug that allow create bulk transactions with existing orchestrateIds ([a040f01](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a040f01965e861349369c315614f4329a6b059c3))
* remove unreacheable code ([102ab67](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/102ab67f0f42f5ca458e4da1a59d8270aa623a07))
* sonar coverage exclusions ([fd34ec7](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/fd34ec727f926d7a7b2ed3badc5f102ab4c153a2))
* typo on postgres version for CI ([a525e4d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a525e4d4d2871fa5cb21beb058d9990e39f68991))

### [0.1.90](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.89...v0.1.90) (2022-04-14)


### Bug Fixes

* ci/cd pipeline ([9ed13db](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/9ed13db7798ea1b197f193ae52b8b81be6adb498))
* tripartite and bipartite after rejection ([4c44771](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4c447714e0890d9d5f0a77ce7534b6d83ddd5fcf))

### [0.1.89](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.88...v0.1.89) (2022-03-10)


### Features

* add mint and set token uri state transition ([749c5fe](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/749c5fe10cb02571c5a7d1a57e3480bd5aae8ba2))

### [0.1.88](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.71...v0.1.88) (2022-03-08)


### Features

* handle null user query, and tradeOrder, add tests ([a3a4d28](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a3a4d2860ebba2808efd3dfdc3461da2299fff61))
* **hold:** support holds for fungible tokens ([0ed517a](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0ed517a4f56a2af947113dda749377d65649e0de))
* allow undefined userId for orders ([a6efb0b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a6efb0b6bf838471ff507ff0d172a18c445ba150))
* **trade:** add possibility to force creation of paid trade ([5a683f8](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5a683f8649d92fb680a56ffc21c4f24a9fa05ee8))
* **trade:** add possibility to force trade creation ([18c30ac](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/18c30ac047445e11749efea0763e1efc72fe4bb1))
* add new state transition for secondary trade, approved --> cancelled ([158236f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/158236f09872b05e1275d43fbe8d57cfffe19785))
* add postgres ssl option ([f5baf1c](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f5baf1c8cd3cec460915ecfd898f01015eaeccc7))
* test ([4abcf6b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4abcf6b8e821f0b0ce02e79e5387e0bcc7218164))
* tryFlow ([305efa9](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/305efa9e36245215efca2f56b53f6cd0b2241987))
* update ([0ebce7e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0ebce7e53922516ca8f5362e6e82b8de899fc42b))
* update ([51c4b09](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/51c4b0973dc92a72d1419ba85e36b0dcffb99fa9))


### Bug Fixes

* **offers:** add missing state transitions for the offer workflow ([5228fb3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5228fb3465245b235e6b2076269dc06ccb0ec1e1))
* **tri party:** update state transition for rejected state ([d137bf2](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d137bf245e4e0b334113602ec9c3e985210fa2b1))
* db ssl option configuration ([d635aca](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d635acaad85c6cdacc1c0a79393054712dfd68df))
* downgraded typeorm back to ^0.2.24 ([15f8b3e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/15f8b3e97f7bc6890558f8723562792a4f1bfebb))
* enable underwriter to edit asset after rejection ([19a1d30](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/19a1d30621f291b5fe2313c937e688a2bd6965c1))
* multivalue in findall ([a610376](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a6103761ad94b0a46d2012902a90f910301bd526))
* prettier ([d34b85f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d34b85f91b38697af55ee2a7586c17b6139b1d98))
* **asset creation:** wrong role in tri-partite asset creation ([5b84ea3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5b84ea35b5fde01b474723a4f08c6bb82ae74daf))
* **kyc:** add missing state transitions ([cdbf5c7](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/cdbf5c7ed06a1d7869cf3e77c80e93b55494e5cb))
* **trade:** allow issuer to settle outstanding trades ([08ce3f1](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/08ce3f177662925961de0afd3bcac13b63dbfa4c))
* prettier ([9a17d58](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/9a17d5807f2a5f7a1c121d32f4a266ac2ff09582))

### [0.1.87](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.85...v0.1.87) (2022-02-28)


### Bug Fixes

* **offers:** add missing state transitions for the offer workflow ([5228fb3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5228fb3465245b235e6b2076269dc06ccb0ec1e1))

### [0.1.86](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.85...v0.1.86) (2022-02-28)


### Bug Fixes

* **offers:** add missing state transitions for the offer workflow ([5228fb3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5228fb3465245b235e6b2076269dc06ccb0ec1e1))

### [0.1.85](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.84...v0.1.85) (2022-02-23)


### Bug Fixes

* multivalue in findall ([a610376](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a6103761ad94b0a46d2012902a90f910301bd526))
* prettier ([d34b85f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d34b85f91b38697af55ee2a7586c17b6139b1d98))

### [0.1.84](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.83...v0.1.84) (2022-02-18)


### Features

* **hold:** support holds for fungible tokens ([0ed517a](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0ed517a4f56a2af947113dda749377d65649e0de))

### [0.1.83](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.82...v0.1.83) (2022-02-15)


### Bug Fixes

* **trade:** allow issuer to settle outstanding trades ([08ce3f1](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/08ce3f177662925961de0afd3bcac13b63dbfa4c))

### [0.1.82](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.81...v0.1.82) (2022-02-14)


### Features

* allow undefined userId for orders ([a6efb0b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a6efb0b6bf838471ff507ff0d172a18c445ba150))

### [0.1.81](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.80...v0.1.81) (2022-02-11)


### Bug Fixes

* enable underwriter to edit asset after rejection ([19a1d30](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/19a1d30621f291b5fe2313c937e688a2bd6965c1))

### [0.1.80](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.79...v0.1.80) (2022-02-08)


### Features

* **trade:** add possibility to force creation of paid trade ([5a683f8](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5a683f8649d92fb680a56ffc21c4f24a9fa05ee8))

### [0.1.79](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.78...v0.1.79) (2022-02-07)


### Features

* **trade:** add possibility to force trade creation ([18c30ac](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/18c30ac047445e11749efea0763e1efc72fe4bb1))

### [0.1.78](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.77...v0.1.78) (2022-02-04)


### Bug Fixes

* **kyc:** add missing state transitions ([cdbf5c7](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/cdbf5c7ed06a1d7869cf3e77c80e93b55494e5cb))

### [0.1.77](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.76...v0.1.77) (2022-01-21)


### Bug Fixes

* downgraded typeorm back to ^0.2.24 ([15f8b3e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/15f8b3e97f7bc6890558f8723562792a4f1bfebb))

### [0.1.76](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.75...v0.1.76) (2022-01-21)


### Features

* add new state transition for secondary trade, approved --> cancelled ([158236f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/158236f09872b05e1275d43fbe8d57cfffe19785))

### [0.1.75](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.74...v0.1.75) (2021-12-01)


### Features

* add postgres ssl option ([f5baf1c](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f5baf1c8cd3cec460915ecfd898f01015eaeccc7))


### Bug Fixes

* db ssl option configuration ([d635aca](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d635acaad85c6cdacc1c0a79393054712dfd68df))
* prettier ([9a17d58](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/9a17d5807f2a5f7a1c121d32f4a266ac2ff09582))

### [0.1.74](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.73...v0.1.74) (2021-11-26)

### [0.1.73](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.72...v0.1.73) (2021-11-18)


### Bug Fixes

* **asset creation:** wrong role in tri-partite asset creation ([5b84ea3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5b84ea35b5fde01b474723a4f08c6bb82ae74daf))

### [0.1.72](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.71...v0.1.72) (2021-11-18)


### Features

* test ([4abcf6b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4abcf6b8e821f0b0ce02e79e5387e0bcc7218164))
* tryFlow ([305efa9](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/305efa9e36245215efca2f56b53f6cd0b2241987))
* update ([0ebce7e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0ebce7e53922516ca8f5362e6e82b8de899fc42b))
* update ([51c4b09](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/51c4b0973dc92a72d1419ba85e36b0dcffb99fa9))

### [0.1.71](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.70...v0.1.71) (2021-11-04)


### Features

* **asset creation:** tri-partite asset creation workflow ([855930e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/855930e94f4788a54de06d4afc5b66006fc48f7b))

### [0.1.70](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.69...v0.1.70) (2021-09-27)


### Features

* lifecycle events workflow ([aa3974f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/aa3974fd9739fd2b70b232596538df04d2e958df))

### [0.1.69](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.68...v0.1.69) (2021-09-01)


### Features

* use default kyc state flow for verifier & nav manager ([fa3efd3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/fa3efd33c2e60b94d40a0a25f31318e4eaaa1e2c))

### [0.1.68](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.67...v0.1.68) (2021-08-16)

### [0.1.67](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.66...v0.1.67) (2021-08-15)

### [0.1.66](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.65...v0.1.66) (2021-08-10)


### Features

* new transition for non binding enquiry(carbon) ([429b4ec](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/429b4ec00655c5ea935b5c88ceb4c6f8dcfb3086))

### [0.1.65](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.64...v0.1.65) (2021-07-23)


### Bug Fixes

* **primary trade:** add missing settlement functions ([6156a2c](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/6156a2c76969b1b15eaba65145e92ffb14c157ac))

### [0.1.64](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.63...v0.1.64) (2021-07-15)

### [0.1.63](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.62...v0.1.63) (2021-07-06)

### [0.1.62](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.61...v0.1.62) (2021-07-05)


### Features

* new transition for investor reject-transition ([dd2db13](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/dd2db136e8b445d935ed686e00766651e2f7264b))

### [0.1.61](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.60...v0.1.61) (2021-07-01)


### Bug Fixes

* **comparator:** add possibility to fetch null objects ([e7ed353](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e7ed3539b9971edeecd4dffbda6f1805208b67ac))

### [0.1.60](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.59...v0.1.60) (2021-06-29)


### Features

* add an optional field orderSide in WorkflowInstance ([83382c0](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/83382c02acae9de403b0d06e3ebe16aad79d5ef7))

### [0.1.59](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.58...v0.1.59) (2021-06-29)


### Features

* add column orderType to workflowInstance ([5a53ceb](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5a53ceb52f63eb6d783576bd5d0934ebf406268d))

### [0.1.58](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.57...v0.1.58) (2021-06-18)


### Features

* add bind-offer transition for assetSecondaryTrade workflow ([ad47c5d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ad47c5d3e27f92500c57d9076335c4f7b0224415))


### Bug Fixes

* allow to update workflow instance quantity to zero ([2011c5b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/2011c5b0110278f381e5cf166896fef3347552db))

### [0.1.57](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.56...v0.1.57) (2021-06-17)


### Features

* add new workflow state for purchaseOffer ([b522790](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/b5227909681722f6435500a2b1604f203a9b3f13))

### [0.1.56](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.55...v0.1.56) (2021-06-15)

### [0.1.55](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.54...v0.1.55) (2021-06-15)

### [0.1.54](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.53...v0.1.54) (2021-06-08)


### Features

* create offer workflow-template for carbon ([4aec438](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4aec43876fc907ff055680334265c8a0c6aa9434))


### Bug Fixes

* **underwriter:** add missing state transitions ([8af6d21](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/8af6d21f815ff21bf99cd694f7915b289a82f657))

### [0.1.53](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.52...v0.1.53) (2021-06-04)

### [0.1.52](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.51...v0.1.52) (2021-05-26)


### Features

* update investor flow for carbon ([41c62a8](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/41c62a8d0dff697213d60f409ae51e20b4b40796))

### [0.1.51](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.50...v0.1.51) (2021-05-23)

### [0.1.50](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.49...v0.1.50) (2021-05-21)

### [0.1.49](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.48...v0.1.49) (2021-05-21)


### Features

* new asset flow for carbon ([317b671](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/317b67118b6c71d7e836567776f4997c24bde265))

### [0.1.48](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.47...v0.1.48) (2021-05-19)

### [0.1.47](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.46...v0.1.47) (2021-05-17)


### Bug Fixes

* hold trade delivery ([d578bf1](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d578bf12a50607b07fcf8d7a01be899631a1d4ee))

### [0.1.46](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.45...v0.1.46) (2021-05-17)

### [0.1.45](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.44...v0.1.45) (2021-05-17)


### Features

* redemption flow init ([ae93d51](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ae93d514c98ba7101c562867920184743e92b2fe))

### [0.1.44](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.43...v0.1.44) (2021-05-10)


### Features

* **batching:** add batching possibility to next state endpoint ([70848d5](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/70848d5b5cab39299b5f99b3a63b2b0eb4d3b10f))
* **instances:** batch instances updates ([9f4b150](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/9f4b150a278d7a5de1b664e633b87407ec37feac))
* **instances:** batch transaction creations ([db64497](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/db644977c4be01a885631a07f32411b9e0974579))


### Bug Fixes

* **tests:** fix unit tests ([75c8d75](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/75c8d75ee88c5b7cb99194033867e4a05ec42f7c))
* **tests:** issue in integration tests ([974e211](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/974e2119794cc36e779efbdf71f8d009cc04e297))

### [0.1.43](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.42...v0.1.43) (2021-04-13)


### Features

* **tenant:** added support for tenant deletion ([1ef2ac6](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/1ef2ac6c807ca5d60aed0117532ae09a5c36a816))

### [0.1.42](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.41...v0.1.42) (2021-03-28)


### Features

* **instances:** add pagination ([f7d3631](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f7d3631078348c4b1da8859f78607be569ecffc4))
* **instances:** add request pagination ([65ba882](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/65ba882441a82a4d7a9312cbb33c967374c2882b))
* **instances:** fetch instances in batch ([cecd047](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/cecd0476a239bdefd5b8198cf3fbdacf0dabe6bb))


### Bug Fixes

* **instances:** missing description ([0840251](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0840251b93e43f5010e1f67bf7132cff907dd69c))

### [0.1.41](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.40...v0.1.41) (2021-03-02)


### Bug Fixes

* prettier ([a88b916](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a88b916614440dbf3e8c78a1a04172f6840c47e6))
* workflow instance recipient id update ([0e00f91](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0e00f9122d085dc74c1c7a4a64ab92b6d280ddc9))

### [0.1.40](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.39...v0.1.40) (2021-02-03)


### Features

* add new paying state for none ato ([e90cf67](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e90cf67f941ed038a91944bb48058e193859a292))

### [0.1.39](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.38...v0.1.39) (2021-01-26)


### Features

* add new underwriter/investor template transitions ([73aa174](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/73aa174e18da7f913c396d4a464d87782e8976a0))
* improve secondary market flow ([ca82f50](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ca82f50a3d189f73ab22ebc134577c237d60ec8a))


### Bug Fixes

* **function:** typo in function name ([50c83ac](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/50c83ac40132a616eba3f7be6b0d7d6d24c7b2b1))
* **prettier:** pretty files ([ad9f108](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ad9f108282b8ca7afb58a1f17d1ddef682660f8b))
* receive trade order payment fromState ([c121a09](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/c121a094fddaee7be7576596e8dd981ba336414a))

### [0.1.38](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.37...v0.1.38) (2021-01-08)


### Features

* **idempotency:** add possibility to defined idempotency key for workflow instances ([c29cf74](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/c29cf74619ab3b2af849a56f8a45ef26faae8759))

### [0.1.37](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.36...v0.1.37) (2020-12-09)

### [0.1.36](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.35...v0.1.36) (2020-12-09)


### Bug Fixes

* **next state:** error message shall be more detailed ([cac0ac1](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/cac0ac11e90f1f6dc511fd58165ef234bce79a09))

### [0.1.35](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.33...v0.1.35) (2020-12-08)

### [0.1.34](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.33...v0.1.34) (2020-12-08)

### [0.1.33](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.32...v0.1.33) (2020-12-04)


### Features

* **hold:** add missig state transitions for holds ([7141373](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/71413739ab29b3aa567333f41f7b734ef3037b2d))
* **trade:** add missing transition in trade workflow ([6190e55](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/6190e550745c435156c9823670df21ac46470608))
* **workflow:** add trade workflow ([d83d49c](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d83d49c37b64088d08517b8536546cfa5c3fce6e))


### Bug Fixes

* **gitlab:** upagrade version of gitlab-ci ([8eb95cf](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/8eb95cfca606d720b539866e40a3de9ad55fd999))
* **gitlab-ci:** syntax error ([8e1a376](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/8e1a376e32b6f1d6d9a9874046f18b06d9519242))
* **prettier:** pretty files ([92ce520](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/92ce5209cc3a68b4bcf0593dde55c17a7affb7dc))
* **trade:** distinguish atomic and non-atomic dvp in trade workflow ([f16c552](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f16c552918a35e1b58a98384621e071e3627dca6))
* **trade:** missing state transitions ([d1aae98](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d1aae980be80839435fc47276d04b5465bf7edba))

### [0.1.32](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.31...v0.1.32) (2020-11-17)


### Bug Fixes

* **extension:** add transitions for extension ([bbe2090](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/bbe2090925afc60f9080f780a8d256ed29a34500))
* **typo:** function nams ([f7c5a20](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f7c5a20800570f7a5010c291e3cd3ebf8c75787a))

### [0.1.31](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.30...v0.1.31) (2020-11-02)


### Features

* **kyc:** add rejectKyc function ([c05c691](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/c05c6916a21afd416638c00f9683b56763c887f2))

### [0.1.30](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.29...v0.1.30) (2020-10-20)


### Features

* **underwriter:** add underwriter role ([b3697e8](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/b3697e814c0af32955cb0ee0607894d98f959958))


### Bug Fixes

* **underwriter:** allow an underwriter to submit its KYC ([e19bc20](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e19bc2064c5d440b8e2fed902e9720f36728faaa))

### [0.1.29](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.28...v0.1.29) (2020-10-05)


### Features

* **state transitions:** allow a kyc verifier to allowlist ([af7053a](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/af7053a9f7e6af49610251920aa3988c9ce5db21))

### [0.1.28](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.27...v0.1.28) (2020-09-25)


### Features

* **workflow instance:** add possibility to retrieve with multiple values ([4e16805](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4e168053d0f74e9c00f5875b2c59b6ac9e8b8e46))

### [0.1.27](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.26...v0.1.27) (2020-09-23)


### Features

* **order:** retrieve objects in descending order instead of ascending ([698c384](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/698c384a603b6d25b52d90d828e18e0e2f66740e))


### Bug Fixes

* update APM variables names ([e1d13e0](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e1d13e00a501b7137a7a7ae7be2b946980a2f8a7))

### [0.1.26](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.25...v0.1.26) (2020-09-09)


### Features

* **admin:** add kyc template transitions for admin role ([445ceb7](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/445ceb7412738e12b8e93c6cf2846382db88259e))
* **entity type:** add platform to entity types ([6df08bb](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/6df08bba2a1b4af9aff01f0e697f6df7b256aecf))

### [0.1.25](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.24...v0.1.25) (2020-09-07)


### Bug Fixes

* **amount:** replace amount by quantity ([fff2589](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/fff25893516df4f7d5400cf332055916d2afa874))
* **tests:** integration tests were broken ([07a4282](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/07a42822af348e54ef68adeaf721343319a49248))

### [0.1.24](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.23...v0.1.24) (2020-09-04)


### Features

* **multi_tenancy:** setup multi_tenancy ([40d4491](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/40d44914e4a9fed0270caf2cb3962a814d2c2c95))
* **tests:** write unit tests ([4cfa144](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4cfa14406d1debce4a3edb56259cc745a7fdbca9))


### Bug Fixes

* **docker-compose:** change port ([232ad51](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/232ad51d9dda9545ea4acdec9d12ce5d178faf82))
* **tests:** fix integration tests ([847bfef](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/847bfef063953cc65c87d0a1753d3854ad761781))
* **tests:** remove unused variables ([e4aa48b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e4aa48bb515429a05222dfda92745c9ca4bb8193))

### [0.1.23](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.22...v0.1.23) (2020-08-18)


### Features

* **entity type:** add project to entity type enum ([5a14077](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5a14077a11bbdc6d683b12a1832f67c3b82ed8e0))

### [0.1.22](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.21...v0.1.22) (2020-08-11)


### Bug Fixes

* **workflow instances:** update was not done properly ([fae03d9](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/fae03d9e0502abc1ce663cb34c3285cd4eaddf44))

### [0.1.21](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.20...v0.1.21) (2020-08-07)


### Bug Fixes

* bump observability version ([8482b43](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/8482b43ffb45fa029f3ffcbc6ad0486153f7fa7b))

### [0.1.20](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.19...v0.1.20) (2020-07-28)


### Bug Fixes

* pr comments ([481a408](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/481a408c819cbb595e13316cbc0a3d31a7330762))

### [0.1.19](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.18...v0.1.19) (2020-07-27)


### Features

* **workflow template:** update asset creation workflow template ([afe5f2c](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/afe5f2c8ff28c9d3f2aeb115af4452c549bdf7d7))

### [0.1.18](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.17...v0.1.18) (2020-07-21)


### Bug Fixes

* **tests:** integration tests ([8ce0b3e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/8ce0b3ee9cc9fa7ecd7e68afd4a50d4fd887094d))

### [0.1.17](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.16...v0.1.17) (2020-07-21)


### Features

* **entity:** replace tokenId with entityId (wip) ([bbd6089](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/bbd60897f37944194d7281ea1e46c9b6da122a3b))
* **entitytype:** add TOKEN_CLASS in entityType enum ([0ee44ab](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0ee44ab1ac14afa8dc7621f0efadd055a3de6ecc))
* **workflow instance:** add wallet field ([35b0728](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/35b07284eef383f3f0d33db7355b339645f74381))
* **workflow instances:** adapt for links ([42a382f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/42a382f1c2321a9c181a9862c98188c831baa4ad))
* **workflow instances:** adapt for links ([3b12a14](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/3b12a140693bdece931556f9173597cb20410bfa))
* **workflow instances:** adapt for links (wip2) --no-verify ([c59fdbf](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/c59fdbfe90f2d1e634d348de43710432a6809909))
* **workflow instances:** fix include references and mock cleanup ([5379a18](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5379a185aa1a44979d0289fccbe09aa01961af1a))
* **workflow instances:** update getAll endpoint ([cda7ca7](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/cda7ca7202703133189c9db1cb68aa4407eb9701))


### Bug Fixes

* **entitytype:** rename TOKEN_CLASS into ASSET_CLASS ([b31ff65](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/b31ff65c2dc10fe07d864c7bde62590d279e64fb))
* **prettier:** pretty files ([c3b2a71](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/c3b2a71938c81dc00272fc9374dbaa4214842771))
* **tests:** small updates to fix tests ([1f6cb04](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/1f6cb040d2f9a2a15a0f67cdce6b2fe1def175b2))
* **tests:** tests were broken ([5407413](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/540741363245a4a92ec3d1569972f53b46d7c4ac))
* **tests:** tests were broken again ([28a80b5](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/28a80b5aeb610eb5433126e9cc2649696102e8f9))

### [0.1.16](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.15...v0.1.16) (2020-07-07)


### Features

* **db:** edited workflow_instance table ([5d619bc](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5d619bcacf23d52813515009e99ce283f85fb4b6))
* **workflow:** added controllers to fetch WorkflowInstances ([8ad23f1](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/8ad23f172334c18506d8e61946d31d170e26282c))
* **workflowInstance:** add possibility to update workflow instance ([0c8c744](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0c8c744cf4b1758ea098a3b7c1fbd0243e4f0e49))


### Bug Fixes

* **prettier:** prettier check ([e25c015](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e25c015baae0166fffbacde67e0870334b39119f))
* **yarn.lock:** delete yarn.lock ([ee06aec](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ee06aec490f99351d2c300c77cec5e2fb9193771))
* increase body parser limit to 50mb ([23bb452](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/23bb452c4695d85a12f862b338e10f21780bcabd))

### [0.1.15](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.7...v0.1.15) (2020-07-03)


### Features

* **workflow types:** add additional workflow types ([800ec3e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/800ec3eefe119201923647a344eab56b3802ecb7))
* **workflows:** update workflow, add nav, etc ([3304aa1](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/3304aa13a0c0ff9ea6cb103f48e4ff4bfd2fb01d))
* add nav and startDate fields to WorkflowInstance ([e3fe834](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e3fe83420abbcd96e4fa725fcbf127eab8dd6560))
* **nav:** add nav workflow ([a4db38d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a4db38d390e02bbd9b58a7618fbfac1ab5773445))
* **workflowtype:** added workflowType field ([ac6ecba](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ac6ecbab8d3644d97221dd5c55469260873b8eb7))


### Bug Fixes

* add fundRedemption to mapping ([68edb16](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/68edb167ccfe8eec3811a21ffc429ce660a37f92))
* **compose:** properly pass env variables ([714aeae](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/714aeaea8646a6065470a30ee558b84967e22612))
* **requests:** all requests with large body ([0d2d220](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0d2d220f9f4ace61b2186d59ac6c26d6ec6f7644))
* **workflow:** add transition for token creation ([669c839](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/669c8395d957e0a5f6d2c7bed8327dc3d672832f))
* added error when function name is missing in workflow instance ([db90f9d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/db90f9ddda61276f3345186276f32271261c0fed))

### [0.1.14](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.13...v0.1.14) (2020-07-03)


### Bug Fixes

* **requests:** all requests with large body ([0d2d220](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/0d2d220f9f4ace61b2186d59ac6c26d6ec6f7644))

### [0.1.13](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.12...v0.1.13) (2020-07-02)


### Features

* **workflow types:** add additional workflow types ([800ec3e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/800ec3eefe119201923647a344eab56b3802ecb7))

### [0.1.12](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.11...v0.1.12) (2020-07-02)

### [0.1.11](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.10...v0.1.11) (2020-07-02)


### Features

* **workflows:** update workflow, add nav, etc ([3304aa1](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/3304aa13a0c0ff9ea6cb103f48e4ff4bfd2fb01d))


### Bug Fixes

* **compose:** properly pass env variables ([714aeae](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/714aeaea8646a6065470a30ee558b84967e22612))
* **workflow:** add transition for token creation ([669c839](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/669c8395d957e0a5f6d2c7bed8327dc3d672832f))

### [0.1.10](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.8...v0.1.10) (2020-06-28)


### Features

* add nav and startDate fields to WorkflowInstance ([e3fe834](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e3fe83420abbcd96e4fa725fcbf127eab8dd6560))
* **workflowtype:** added workflowType field ([ac6ecba](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ac6ecbab8d3644d97221dd5c55469260873b8eb7))

### [0.1.9](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.8...v0.1.9) (2020-06-28)


### Features

* **workflowtype:** added workflowType field ([ac6ecba](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ac6ecbab8d3644d97221dd5c55469260873b8eb7))
* add nav and startDate fields to WorkflowInstance ([e3fe834](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e3fe83420abbcd96e4fa725fcbf127eab8dd6560))

### [0.1.8](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.7...v0.1.8) (2020-06-26)


### Features

* **nav:** add nav workflow ([a4db38d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a4db38d390e02bbd9b58a7618fbfac1ab5773445))


### Bug Fixes

* added error when function name is missing in workflow instance ([db90f9d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/db90f9ddda61276f3345186276f32271261c0fed))

### [0.1.7](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.6...v0.1.7) (2020-06-17)


### Bug Fixes

* lowered jest thresholds ([87c9e74](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/87c9e74c148494de06ba6b036069e56d73c1c870))

### [0.1.6](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.4...v0.1.6) (2020-06-17)


### Bug Fixes

* add objectId to WorkflowInstance ([e556d7f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e556d7f20d5c3055c3cb2781e590aee611eb09c4))
* **logging:** disable ORM logging when not debugging ([f12d7c0](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f12d7c0635de45472dd57cb013268d87e6284b98))
* **name:** use lower case service name ([7e32535](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/7e3253560be42a648ff7047aceb3e3b8a58903f1))

### [0.1.5](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.4...v0.1.5) (2020-06-12)


### Bug Fixes

* **logging:** disable ORM logging when not debugging ([f12d7c0](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f12d7c0635de45472dd57cb013268d87e6284b98))
* **name:** use lower case service name ([7e32535](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/7e3253560be42a648ff7047aceb3e3b8a58903f1))

### [0.1.4](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.3...v0.1.4) (2020-06-09)


### Features

* **ci:** use ephemeral env for integration tests ([bb368db](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/bb368dbafa0e97820f6672fd3519ad94a3a469c7))
* **create:** create transition at workflow instance creation ([2fd27a0](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/2fd27a00f94d48d2e3447b93eee3dd261d269343))
* **history:** added controller to get history of transitions ([4da3349](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4da334910bbad47cba7304676727ea000bf9f5a7))
* **transition:** enriched integration test ([4f3de9d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/4f3de9d3071cf2e125754af0316e2850585a4efa))

### [0.1.3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/compare/v0.1.2...v0.1.3) (2020-06-05)

### 0.1.2 (2020-06-05)


### Features

* **check:** added check endpoint to workflow instance service ([611af7f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/611af7f945baedc2ca86d1a17ff6ccc5865e13da))
* **entities:** workflow instance contains info about current transition ([474865e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/474865e7f62789f1b0a31aca06e900897d74e3a7))
* **logging:** add Docker build args ([360291e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/360291e5955835d9e3d82bbd7ea39aaf85352660))
* **logging:** add docker-compose build args ([006ea01](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/006ea018afc2dc2ce8130cef219f7e78254254a7))
* **logging:** add observability package ([ce4f8bb](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ce4f8bb0be31fd8d96b92dc25ea2eed9ad3723fd))
* **migration:** set migration scripts to create tables ([72b3818](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/72b3818b2128b20c990f7412ca802ceb400435d8))
* **nextstate:** added nextstate controller (and transac tests) ([29826eb](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/29826eb3359687bc0427db2f6b74090f78d08164))
* **nextstate:** added nextstate controller (and transac tests) ([be00bea](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/be00bea388c2f18c0900840a2a9e5e5f085ec28b))
* **templates:** workflow templates populated at init ([e4ca075](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e4ca075df99fc47dee7390fde3431bbc60f199bd))
* **test:** integration test for transactions ([f738025](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f73802513038e50ce888c71f5ee4e8e5eb228521))
* **transaction:** added endpoint to find by value ([1574301](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/1574301e1b61c20d77de2354755aefb2b20df0f2))
* **workflow:** transition instance creation and check refactored ([acd5a8f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/acd5a8fbcf92a84c8478f93a92befa8947dd5f43))
* add Elastic APM ([b587043](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/b58704338a20ad5e4700435503d2899debc6515f))


### Bug Fixes

* **api-url:** removed admin suffix ([05e14c0](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/05e14c04eec698f9de01972a514e2820080200f8))
* **ci:** add missing file for secrets ([02f2420](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/02f2420971522be02950ff5a8033b47594a4109c))
* **ci:** add namespace.yaml to enable deployment on master ([ec6d52f](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/ec6d52f488682b0cdafa524a9471deb78977acb3))
* **ci:** add serviceName to chart values to match ingress serviceName ([76e0487](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/76e0487d54edb9fcf8e2f4bcc47978f31ca79b40))
* **ci:** changed namespace to assets-paris-dev ([d709033](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/d7090330bfd722d56c7aad34414ceebed5f29a76))
* **ci:** fix gitlab-ci script ([bfd6b88](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/bfd6b889b184c643bec32830051d7539a4cdd776))
* **ci:** fixed namespace ([12468b3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/12468b38f908438d4ab7887b3d97e9a2b62712bc))
* **ci:** stupid commit to rebuild ([64ea7ee](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/64ea7eecdc72d5cbf9912263cad1fd4ba5b99002))
* **deploy:** adapted yaml from assets-paris-dev one ([a642b63](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/a642b63a29845140c83f96eb184ec9a83a56e20a))
* **deploy:** added fullname to chart values ([5e6509e](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/5e6509eb3cc24582dac23ee326646c90286f9498))
* **deploy:** added kubeconfig ([fbd43b8](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/fbd43b8c15db9a885d1aee705a86bfe3c18d7687))
* **deploy:** environment replaced with env ([f55afd2](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/f55afd228eabd1b1c86530e6cd115f4604127ce3))
* **docker-compose:** no need to wait-for script ([583b0cc](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/583b0cc9de820e049c5c0e42d3a1452f1b19212e))
* **git:** added untracked files ([cc35aef](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/cc35aefebb3923dad1ee514625b90e42e795893d))
* **healthcheck:** rename healthcheck endpoint ([9805ab3](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/9805ab3ccde1e949c00d0bf7298aefe9fd69b72e))
* **jest:** coverage thresholds ([80f7f16](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/80f7f1678b8384fe0f42dbc067d187ca55417eee))
* **logs:** json logging ([619eb93](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/619eb9346922dc2b3314f8f8101525081e309725))
* **logs:** single object in logs ([1710b3b](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/1710b3b6b425e181a6ef9d2179dec2470ace9f8d))
* **migration:** replaced postgres user with env variable ([44de324](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/44de324cddf623357e17c914899ea0d736cb84f3))
* **pretiier:** fixed prettier issues ([6440170](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/64401700739e0eaaf04c6e4c6651dab5adeede8c))
* **readiness:** healthReturnsUnauth should not always return false ([fea75bd](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/fea75bdac9232b51024532d850d3a4d7da2225de))
* **test:** added test for transaction service ([fa66997](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/fa669978529d13d2d9b8121a2439574f002a7435))
* **tests:** adapted tests to last changes ([e48339d](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/e48339d46eff4a9e679bcf0b9feb19c7d3633dc4))
* **unit-tests:** added tests for services ([b420bd0](https://gitlab.com/ConsenSys/codefi/products/assets/workflow-api/commit/b420bd02bfd6566b15e2d4d24aca8fa93dd8bf65))
