import { defineMessages } from 'react-intl';

export const assetIssuanceMessages = defineMessages({
  title: {
    id: 'assets.assetIssuanceMessages.title',
    description: 'Title of assetIssuance page',
    defaultMessage: 'Asset issuance',
  },
  backlink: {
    id: 'assets.assetIssuanceMessages.backlink',
    description: 'Backlink button title',
    defaultMessage: 'Cancel',
  },
  pendingAsset: {
    id: 'assets.assetIssuanceMessages.pendingAsset',
    description: 'Pending asset issuance message',
    defaultMessage:
      'The Asset is currently being deployed on the blockchain, this can take up to 10 minutes. Time for a break ☕️',
  },
  deprecatedAsset: {
    id: 'assets.assetIssuanceMessages.deprecatedAsset',
    description: 'Deprecated asset tooltip',
    defaultMessage: 'Network with chain id {chainId} has been deprecated',
  },
  deployedAsset: {
    id: 'assets.assetIssuanceMessages.deployedAsset',
    description: 'Deployed asset message',
    defaultMessage:
      'The Asset has been successfully deployed on the blockchain.',
  },
  revertedAsset: {
    id: 'assets.assetIssuanceMessages.revertedAsset',
    description: 'Reverted asset message',
    defaultMessage:
      'The Asset could not be deployed to the blockchain. Please contact support.',
  },
  assetNoName: {
    id: 'assets.assetIssuanceMessages.assetNoName',
    description: 'Name for asset with no name',
    defaultMessage: 'Untitled',
  },
  assetSelectionTitle: {
    id: 'assets.assetIssuanceMessages.assetSelection.title',
    description: 'Asset creation type selection title',
    defaultMessage: 'Select asset type',
  },
  assetSelectionDescription: {
    id: 'assets.assetIssuanceMessages.assetSelection.description',
    description: 'Asset creation type selection description',
    defaultMessage: 'Select the type of asset to create',
  },
  assetSelectionCreateButton: {
    id: 'assets.assetIssuanceMessages.assetSelection.create.button',
    description: 'Asset creation button for template type',
    defaultMessage: 'Create {type}',
  },
  assetSelectionNoTemplates: {
    id: 'assets.assetIssuanceMessages.assetSelection.noTemplates',
    description: 'Asset creation no templates error',
    defaultMessage: 'No asset templates found',
  },
  exampleBannerImage: {
    id: 'assets.assetIssuanceMessages.exampleBannerImage',
    description: 'Example banner image',
    defaultMessage: 'Example banner image',
  },
  seeExample: {
    id: 'assets.assetIssuanceMessages.seeExample',
    description: 'See an example',
    defaultMessage: 'See an example',
  },
  exampleCardBackgroundImage: {
    id: 'assets.assetIssuanceMessages.exampleCardBackgroundImage',
    description: 'Example card background image',
    defaultMessage: 'Example card background image',
  },
  addManagementTeamMembersName: {
    id: 'assets.assetIssuanceMessages.addManagementTeamMembers.name',
    description: 'Add management team member name',
    defaultMessage: 'Name',
  },
  addManagementTeamMembersRole: {
    id: 'assets.assetIssuanceMessages.addManagementTeamMembers.role',
    description: 'Add management team member role',
    defaultMessage: 'Role',
  },
  addManagementTeamMembersLinkedIn: {
    id: 'assets.assetIssuanceMessages.addManagementTeamMembers.linkedIn',
    description: 'Add management team member linkedIn URL',
    defaultMessage: 'LinkedIn profile URL',
  },
  addManagementTeamMembersUrl: {
    id: 'assets.assetIssuanceMessages.addManagementTeamMembers.url',
    description: 'Add management team member URL',
    defaultMessage: 'URL',
  },
  addManagementTeamMembersBio: {
    id: 'assets.assetIssuanceMessages.addManagementTeamMembers.bio',
    description: 'Add management team member bio',
    defaultMessage: 'Bio',
  },
  addManagementTeamMembersImage: {
    id: 'assets.assetIssuanceMessages.addManagementTeamMembers.image',
    description: 'Add management team member image',
    defaultMessage: 'Image',
  },
  addManagementTeamMembersButton: {
    id: 'assets.assetIssuanceMessages.addManagementTeamMembers.button',
    description: 'Add management team member button label',
    defaultMessage: 'Add team member',
  },
  removeManagementTeamMember: {
    id: 'assets.assetIssuanceMessages.removeManagementTeamMember',
    description: 'Remove management team member ',
    defaultMessage: 'Remove team member',
  },
  document: {
    id: 'assets.assetIssuanceMessages.document',
    description: 'Document',
    defaultMessage: 'Document',
  },
  docSignURL: {
    id: 'assets.assetIssuanceMessages.docSignURL',
    description: 'DocuSign URL',
    defaultMessage: 'DocuSign URL',
  },
  feeName: {
    id: 'assets.assetIssuanceMessages.feeName',
    description: 'Fee name',
    defaultMessage: 'Fee name',
  },
  feeType: {
    id: 'assets.assetIssuanceMessages.feeType',
    description: 'Fee type',
    defaultMessage: 'Fee type',
  },
  addAnotherFee: {
    id: 'assets.assetIssuanceMessages.addAnotherFee',
    description: 'Add another fee',
    defaultMessage: 'Add another fee',
  },
  invalidElement: {
    id: 'assets.assetIssuanceMessages.invalidElement',
    description: 'Message for invalid element',
    defaultMessage: 'INVALID ELEMENT with key {key}',
  },
  at: {
    id: 'assets.assetIssuanceMessages.at',
    description: 'at',
    defaultMessage: 'at',
  },
  addTarget: {
    id: 'assets.assetIssuanceMessages.addTarget',
    description: 'Add target',
    defaultMessage: 'Add target',
  },
  removeTarget: {
    id: 'assets.assetIssuanceMessages.removeTarget',
    description: 'Remove target',
    defaultMessage: 'Remove target',
  },
  targetNum: {
    id: 'assets.assetIssuanceMessages.targetNum',
    description: 'Target {nun}',
    defaultMessage: 'Target {num}',
  },
  target: {
    id: 'assets.assetIssuanceMessages.target',
    description: 'Target',
    defaultMessage: 'Target',
  },
  targetPreviewText: {
    id: 'assets.assetIssuanceMessages.targetPreviewText',
    description: 'How the target will appear to investors',
    defaultMessage: 'How the target will appear to investors',
  },
  targetPlaceholder: {
    id: 'assets.assetsIssuanceMessages.targetPlaceholder',
    description: 'e.g of clean electricity generated',
    defaultMessage: 'e.g of clean electricity generated',
  },
  category: {
    id: 'assets.assetIssuanceMessages.category',
    description: 'Category',
    defaultMessage: 'Category',
  },
  per: {
    id: 'assets.assetIssuanceMessages.per',
    description: 'per',
    defaultMessage: 'per',
  },
  tPlus: {
    id: 'assets.assetIssuanceMessages.tPlus',
    description: 'T+',
    defaultMessage: 'T+',
  },
  days: {
    id: 'assets.assetIssuanceMessages.days',
    description: 'days',
    defaultMessage: 'days',
  },
  weeks: {
    id: 'assets.assetIssuanceMessages.weeks',
    description: 'weeks',
    defaultMessage: 'weeks',
  },
  months: {
    id: 'assets.assetIssuanceMessages.months',
    description: 'months',
    defaultMessage: 'months',
  },
  years: {
    id: 'assets.assetIssuanceMessages.years',
    description: 'years',
    defaultMessage: 'years',
  },
  day: {
    id: 'assets.assetIssuanceMessages.day',
    description: 'day',
    defaultMessage: 'day',
  },
  week: {
    id: 'assets.assetIssuanceMessages.week',
    description: 'week',
    defaultMessage: 'week',
  },
  month: {
    id: 'assets.assetIssuanceMessages.month',
    description: 'month',
    defaultMessage: 'month',
  },
  year: {
    id: 'assets.assetIssuanceMessages.year',
    description: 'year',
    defaultMessage: 'year',
  },
  metric: {
    id: 'assets.assetCreationFormMessages.metric',
    description: 'Metric',
    defaultMessage: 'Metric',
  },
  type: {
    id: 'assets.assetCreationFormMessages.type',
    description: 'Type',
    defaultMessage: 'Type',
  },
  unit: {
    id: 'assets.assetCreationFormMessages.unit',
    description: 'Unit',
    defaultMessage: 'Unit',
  },
  description: {
    id: 'assets.assetCreationFormMessages.description',
    description: 'Description',
    defaultMessage: 'Description',
  },
  targetDescription: {
    id: 'assets.assetCreationFormMessages.targetDescription',
    description:
      'Below is how the target will be rendered on the Impact bond overview page where the investor purchases the bond.',
    defaultMessage:
      'Below is how the target will be rendered on the Impact bond overview page where the investor purchases the bond.',
  },
  impactGoals: {
    id: 'assets.assetCreationFormMessages.impactGoals',
    description: 'Sustainable Development Goals',
    defaultMessage: 'Sustainable Development Goals',
  },
  impactGoalsDescription: {
    id: 'assets.assetCreationFormMessages.impactGoalsDescription',
    description: 'Select the SDG that the target relates to',
    defaultMessage: 'Select the SDG that the target relates to',
  },
  couponPaymentDate: {
    id: 'assets.assetCreationFormMessages.couponPaymentDate',
    description: 'Label of first coupon payment date',
    defaultMessage: 'First coupon payment date',
  },
  couponPaymentHour: {
    id: 'assets.assetCreationFormMessages.couponPaymentHour',
    description: 'Label of first coupon payment hour',
    defaultMessage: 'First coupon payment hour',
  },
  selectHour: {
    id: 'assets.assetIssuanceMessages.selectHour',
    description: 'Placeholder of Select Hour',
    defaultMessage: 'Select hour',
  },
  emailValidationError: {
    id: 'assets.assetIssuanceMessages.emailValidationError',
    description: 'This email address does not follow the right format',
    defaultMessage: 'This email address does not follow the right format',
  },
  websiteValidationError: {
    id: 'assets.assetIssuanceMessages.websiteValidationError',
    description: 'This website url does not follow the right format',
    defaultMessage: 'This website url does not follow the right format',
  },
});

export const assetShareClassReviewFormMessages = defineMessages({
  shareClasses: {
    id: 'assets.assetShareClassReviewFormMessages.shareClasses.title',
    description: 'Share Classes header title',
    defaultMessage: 'Share Classes',
  },
  shareClass: {
    id: 'assets.assetShareClassReviewFormMessages.shareClass',
    description: 'Share Class',
    defaultMessage: 'Share Class',
  },
  isinCode: {
    id: 'assets.assetShareClassReviewFormMessages.isinCode',
    description: 'ISIN Code',
    defaultMessage: 'ISIN Code',
  },
  subscriptionCutOffDate: {
    id: 'assets.assetShareClassReviewFormMessages.subscriptionCutOffDate',
    description: 'Subscription cut off date',
    defaultMessage: 'Subscription cut off date',
  },
  action: {
    id: 'assets.assetShareClassReviewFormMessages.action',
    description: 'Action',
    defaultMessage: 'Action',
  },
  notSet: {
    id: 'assets.assetShareClassReviewFormMessages.notSet',
    description: 'Not set',
    defaultMessage: 'Not set',
  },
  edit: {
    id: 'assets.assetShareClassReviewFormMessages.edit',
    description: 'Edit',
    defaultMessage: 'Edit',
  },
  addAShareClass: {
    id: 'assets.assetShareClassReviewFormMessages.addAShareClass',
    description: 'Add a Share Class',
    defaultMessage: 'Add a Share Class',
  },
  newShareClass: {
    id: 'assets.assetShareClassReviewFormMessages.newShareClass',
    description: 'New Share Class',
    defaultMessage: 'New Share Class',
  },
  comingSoon: {
    id: 'assets.assetShareClassReviewFormMessages.comingSoon',
    description: 'Coming soon',
    defaultMessage: 'Coming soon',
  },
  comingSoonMessage: {
    id: 'assets.assetShareClassReviewFormMessages.comingSoonMessage',
    description:
      'We are currently developing this feature. It will be released soon.',
    defaultMessage:
      'We are currently developing this feature. It will be released soon.',
  },
  nextReview: {
    id: 'assets.assetShareClassReviewFormMessages.nextReview',
    description: 'Next: Review',
    defaultMessage: 'Next: Review',
  },
});

export const assetCreationFormMessages = defineMessages({
  assetCreated: {
    id: 'assets.assetCreationFormMessages.assetCreated',
    description: 'Asset created',
    defaultMessage: 'Asset created',
  },
  assetSubmittedUnderwriter: {
    id: 'assets.assetCreationFormMessages.assetSubmittedUnderwriter',
    description: 'Asset submitted underwriter',
    defaultMessage: 'Asset information submitted to issuer',
  },
  assetSubmittedInvestor: {
    id: 'assets.assetCreationFormMessages.assetSubmittedInvestor',
    description: 'Asset submitted investor',
    defaultMessage:
      'Asset information submitted to Transfer Agent for creation',
  },
  assetCreatedContext: {
    id: 'assets.assetCreationFormMessages.assetCreatedContext',
    description: 'Asset created context',
    defaultMessage:
      'It may take up to 10 minutes for the asset to deploy on the blockchain',
  },
  assetSubmittedContextUnderwriter: {
    id: 'assets.assetCreationFormMessages.assetSubmittedContextUnderwriter',
    description: 'Asset submitted context underwriter',
    defaultMessage:
      'The issuer has been notified and asset information is pending their approval. ',
  },
  assetSubmittedContextInvestor: {
    id: 'assets.assetCreationFormMessages.assetSubmittedContextInvestor',
    description: 'Asset submitted investor context',
    defaultMessage:
      'The Transfer agent has been notified and is pending their approval. ',
  },
  assetCreationError: {
    id: 'assets.assetCreationFormMessages.assetCreationError',
    description: 'Asset creation Error',
    defaultMessage: 'Asset creation Error',
  },
  assetUpdated: {
    id: 'assets.assetCreationFormMessages.assetUpdated',
    description: 'Asset updated',
    defaultMessage: 'Asset updated',
  },
  assetRejected: {
    id: 'assets.assetCreationFormMessages.assetRejected',
    description: 'Asset information rejected',
    defaultMessage: 'Asset information rejected',
  },
  assetDeleted: {
    id: 'assets.assetCreationFormMessages.assetDeleted',
    description: 'Asset deleted',
    defaultMessage: 'Asset deleted',
  },
  assetRejectedContext: {
    id: 'assets.assetCreationFormMessages.assetRejectedContext',
    description: 'The Underwriter has been notified ',
    defaultMessage: 'The Underwriter has been notified ',
  },
  assetUpdatedError: {
    id: 'assets.assetCreationFormMessages.assetUpdatedError',
    description: 'Asset update error',
    defaultMessage: 'Asset update error',
  },
  assetRejectedError: {
    id: 'assets.assetCreationFormMessages.assetRejectedError',
    description: 'Asset reject error',
    defaultMessage: 'Asset reject error',
  },
  assetDeletedError: {
    id: 'assets.assetCreationFormMessages.assetDeletedError',
    description: 'Asset delete error',
    defaultMessage: 'Asset delete error',
  },
  editButton: {
    id: 'assets.assetCreationFormMessages.editButton',
    description: 'Edit button',
    defaultMessage: 'Edit',
  },
  deleteButton: {
    id: 'assets.assetCreationFormMessages.deleteButton',
    description: 'Delete button',
    defaultMessage: 'Delete',
  },
  deleteLabel: {
    id: 'assets.assetCreationFormMessages.deleteLabel',
    description: 'Delete item',
    defaultMessage: 'Delete {item}',
  },
  deleteDescription: {
    id: 'assets.assetCreationFormMessages.deleteDescription',
    description: 'Click the button below to delete the item',
    defaultMessage: 'Click the button below to delete the {item}',
  },
  nextReview: {
    id: 'assets.assetCreationFormMessages.nextReview',
    description: 'Next: Review',
    defaultMessage: 'Next: Review',
  },
  nextUpdateAItem: {
    id: 'assets.assetCreationFormMessages.nextUpdateAItem',
    description: 'Next: Update a item',
    defaultMessage: 'Next: Update a {item}',
  },
  nextUpdateItem: {
    id: 'assets.assetCreationFormMessages.nextUpdateItem',
    description: 'Next: Update item',
    defaultMessage: 'Next: Update {item}',
  },
  nextAddItem: {
    id: 'assets.assetCreationFormMessages.nextAddItem',
    description: 'Next: Add item',
    defaultMessage: 'Next: Add {item}',
  },
  approveAndCreateBondDescription: {
    id: 'assets.assetCreationFormMessages.approveAndCreateDescription',
    description: 'Approve and create asset context',
    defaultMessage:
      'You will now deploy this bond. Are you sure you want to continue?',
  },
  seeItem: {
    id: 'assets.assetCreationFormMessages.seeItem',
    description: 'See item',
    defaultMessage: 'See {item}',
  },
  updateAssetLabel: {
    id: 'assets.assetCreationFormMessages.updateAssetLabel',
    description: 'Update asset label',
    defaultMessage: 'Update asset',
  },
  updateAssetDescription: {
    id: 'assets.assetCreationFormMessages.updateAssetDescription',
    description: 'Are you sure you want to update this asset?',
    defaultMessage: 'Are you sure you want to update this asset?',
  },
  updateAssetConfirmLabel: {
    id: 'assets.assetCreationFormMessages.updateAssetConfirmLabel',
    description: 'Update asset',
    defaultMessage: 'Update asset',
  },
  submitAssetLabel: {
    id: 'assets.assetCreationFormMessages.submitAssetLabel',
    description: 'Submit to issuer for approval',
    defaultMessage: 'Submit to issuer for approval',
  },
  investorSubmitAsset: {
    id: 'assets.assetCreationFormMessages.investorSubmitAsset',
    description: 'Submit to transfer agent for approval',
    defaultMessage: 'Submit to Transfer agent for approval',
  },
  createAssetLabel: {
    id: 'assets.assetCreationFormMessages.createAssetLabel',
    description: 'Create asset label',
    defaultMessage: 'Create asset',
  },
  createAssetDescription: {
    id: 'assets.assetCreationFormMessages.createAssetDescription',
    description: 'Are you sure you want to create this asset?',
    defaultMessage: 'Are you sure you want to create this asset?',
  },
  createAssetConfirmLabel: {
    id: 'assets.assetCreationFormMessages.createAssetConfirmLabel',
    description: 'Create asset',
    defaultMessage: 'Create asset',
  },
  nextReviewItem: {
    id: 'assets.assetCreationFormMessages.nextReviewItem',
    description: 'Next: Review item',
    defaultMessage: 'Next: Review {item}',
  },
  nextSaveItem: {
    id: 'assets.assetCreationFormMessages.nextSaveItem',
    description: 'Next: Save item',
    defaultMessage: 'Next: Save {item}',
  },
  reviewDesc: {
    id: 'assets.assetCreationFormMessages.reviewDesc',
    description:
      'Review information provided to ensure it is correct prior to creation the asset',
    defaultMessage:
      'Review information provided to ensure it is correct prior to creation the asset',
  },
  approveAndSubmitAsset: {
    id: 'assets.assetCreationFormMessages.approveAsset',
    description: 'Approve and submit to Transfer Agent',
    defaultMessage: 'Approve and submit to Transfer Agent',
  },
  rejectInformationAsset: {
    id: 'assets.assetCreationFormMessages.rejectAsset',
    description: 'Reject information',
    defaultMessage: 'Reject information',
  },
  editAssetInformation: {
    id: 'assets.assetCreationFormMessages.editAssetInformation',
    description: 'Edit asset information',
    defaultMessage: 'Edit asset information',
  },
  deleteAsset: {
    id: 'assets.assetCreationFormMessages.deleteAsset',
    description: 'Delete asset',
    defaultMessage: 'Delete asset',
  },
  approveAndSubmitDescription: {
    id: 'assets.assetCreationFormMessages.approveAndSubmitDescription',
    description: 'Approve and submit to Transfer Agent Description',
    defaultMessage:
      'Are you sure you want to approve the asset information? By approving you are confirming this information is correct and that the transfer agent can create the asset.',
  },
  approveConfirmLabel: {
    id: 'assets.assetCreationFormMessages.approveConfirmLabel',
    description: 'Approve',
    defaultMessage: 'Approve',
  },
  approveAndCreateDescription: {
    id: 'assets.assetCreationFormMessages.approveAndCreateDescription',
    description: 'Approve and create asset context',
    defaultMessage:
      'By creating this asset you will issue a bond to {issuerName}. Are you sure you want to continue?',
  },
  approveAndCreateAsset: {
    id: 'assets.assetCreationFormMessages.approveAndCreateAsset',
    description: 'Approve and create asset',
    defaultMessage: 'Approve and create asset',
  },
  rejectInformationTitle: {
    id: 'assets.assetCreationFormMessages.rejectInformationTitle',
    description: 'Reject asset information',
    defaultMessage: 'Reject asset information',
  },
  rejectInformationDescription: {
    id: 'assets.assetCreationFormMessages.rejectInformationDescription',
    description: 'Reject information description',
    defaultMessage:
      'Are you sure that you want to reject this information. By continuing the Underwriter will be notified.',
  },
  deleteAssetDescription: {
    id: 'assets.assetCreationFormMessages.deleteAssetDescription',
    description: 'Delete asset Description',
    defaultMessage:
      'Are you sure you want to delete this asset? By deleting the asset all the associated information will be removed from the platform.',
  },
  reason: {
    id: 'assets.assetCreationFormMessages.reason',
    description: 'Reason',
    defaultMessage: 'Reason',
  },
});
