import { defineMessages } from 'react-intl';

export const SubscriptionTexts = defineMessages({
  paymentInfo: {
    id: 'assets.SubscriptionTexts.paymentInfo',
    description:
      'Payment for this transaction needs to be made on the CBDC platform. Once payment has been completed the CBDC platform will redirect you back to this page.',
    defaultMessage:
      'Payment for this transaction needs to be made on the CBDC platform. Once payment has been completed the CBDC platform will redirect you back to this page.',
  },
  payInCDBC: {
    id: 'assets.SubscriptionTexts.payInCDBC',
    description: 'Pay in CDBC',
    defaultMessage: 'Pay in CDBC',
  },
  redirectToCBDCPayment: {
    id: 'assets.SubscriptionTexts.redirectToCBDCPayment',
    description:
      'You will be redirected the CBDC platform to complete payment.',
    defaultMessage:
      'You will be redirected the CBDC platform to complete payment.',
  },
  confirmCBDCPaymentInfo: {
    id: 'assets.SubscriptionTexts.',
    description:
      'Confirm the payment by entering the related payment ID for this order. The payment ID can be found on the related CBDC transfer details page.',
    defaultMessage:
      'Confirm the payment by entering the related payment ID for this order. The payment ID can be found on the related CBDC transfer details page.',
  },
  confirmCBDCPaymentInfoLeadArranger: {
    id: 'assets.SubscriptionTexts.confirmCBDCPaymentInfoLeadArranger',
    description:
      'Confirm the payment by entering the related payment ID for this order. The payment ID can be found on the related CBDC transfer details page.',
    defaultMessage:
      'Confirm the payment by entering the related payment ID for this order. The payment ID can be found on the related CBDC transfer details page.',
  },
  confirmCBDCPaymentInfoBorrower: {
    id: 'assets.SubscriptionTexts.confirmCBDCPaymentInfoBorrower',
    description:
      'Confirm the payment by entering the related payment ID for this order. The payment ID can be found on the related CBDC transfer details page.',
    defaultMessage: 'Please confirm the payment to notify the Facility Agent.',
  },
  whatHappensNextInfo: {
    id: 'assets.SubscriptionTexts.whatHappensNextInfo',
    description:
      'The Facility Agent will review the proof that Conditions Precedent have been met. Upon approval you will be notified and will be able to drawdown from the loan.',
    defaultMessage:
      'The Facility Agent will review the proof that Conditions Precedent have been met. Upon approval you will be notified and will be able to drawdown from the loan.',
  },
  whatHappensNextDVP: {
    id: 'assets.SubscriptionTexts.whatHappensNextDVP',
    description:
      'The Facility Agent will execute the DvP and settle the transaction.',
    defaultMessage:
      'The Facility Agent will execute the DvP and settle the transaction.',
  },
  whatHappensNextDVPRepayment: {
    id: 'assets.SubscriptionTexts.whatHappensNextDVPRepayment',
    defaultMessage:
      'The Facility Agent will settle the repayment and reduce the outstanding loan amount. ',
  },
  paymentConfirmationMessage: {
    id: 'assets.SubscriptionTexts.paymentConfirmationMessage',
    description:
      'Are you sure you want to confirm the payment has been completed. This will notify the seller who will confirm payment and instruct the issuer to settle the order.',
    defaultMessage:
      'Are you sure you want to confirm the payment has been completed. This will notify the seller who will confirm payment and instruct the issuer to settle the order.',
  },
  repaymentConfirmationMessage: {
    id: 'assets.SubscriptionTexts.paymentConfirmationMessage',
    message: 'Please confirm the payment to notify the Facility Agent.',
  },
  wireTransferConfirmation: {
    id: 'assets.SellRequestTexts.wireTransferConfirmation',
    description: 'Wire transfer confirmation',
    defaultMessage: 'Wire transfer confirmation',
  },
  uploadWireTransferConfirmation: {
    id: 'assets.SubscriptionTexts.uploadWireTransferConfirmation',
    description: 'Upload transfer confirmation',
    defaultMessage: 'Upload transfer confirmation',
  },
  wireTransferConfirmationDocuments: {
    id: 'assets.SubscriptionTexts.wireTransferConfirmationDocuments',
    description: 'Wire transfer confirmation documents',
    defaultMessage: 'Wire transfer confirmation documents',
  },
  seeAcceptedDocumentTypes: {
    id: 'assets.SubscriptionTexts.seeAcceptedDocumentTypes',
    description: 'See accepted document types',
    defaultMessage: 'See accepted document types',
  },
  screenCaptureWireTransferConfirmation: {
    id: 'assets.SubscriptionTexts.screenCaptureWireTransferConfirmation',
    description:
      "A screen capture of your financial institution's wire transfer confirmation page",
    defaultMessage:
      "A screen capture of your financial institution's wire transfer confirmation page",
  },
  emailWireTransferConfirmation: {
    id: 'assets.SubscriptionTexts.emailWireTransferConfirmation',
    description:
      'An email confirmation or other correspondence from your financial institution confirming that the wire transfer was initiated',
    defaultMessage:
      'An email confirmation or other correspondence from your financial institution confirming that the wire transfer was initiated',
  },
  conditionsPrecedentConfirmation: {
    id: 'assets.SubscriptionTexts.conditionsPrecedentConfirmation',
    description: 'Conditions Precedent confirmation',
    defaultMessage: 'Conditions Precedent confirmation',
  },
  conditionsPrecedentConfirmationProof: {
    id: 'assets.SubscriptionTexts.conditionsPrecedentConfirmationProof',
    description:
      'Proof that Conditions Precedent have been met, have been sent to the Facility Agent for review.',
    defaultMessage:
      'Proof that Conditions Precedent have been met, have been sent to the Facility Agent for review.',
  },
  whatHappensNextConditionsPrecedent: {
    id: 'assets.SubscriptionTexts.whatHappensNextConditionsPrecedent',
    description:
      'The Facility Agent will review the proof that Conditions Precedent have been met. Upon approval you will be notified and will be able to drawdown from the loan.',
    defaultMessage:
      'The Facility Agent will review the proof that Conditions Precedent have been met. Upon approval you will be notified and will be able to drawdown from the loan.',
  },
  yourOrderHasBeenPlaced: {
    id: 'assets.SubscriptionTexts.yourOrderHasBeenPlaced',
    description: 'Your order has been placed',
    defaultMessage: 'Your order has been placed',
  },
  viewInPortfolio: {
    id: 'assets.SubscriptionTexts.viewInPortfolio',
    description: 'View in Portfolio',
    defaultMessage: 'View in Portfolio',
  },
  orderCreated: {
    id: 'assets.SubscriptionTexts.orderCreated',
    description: 'Your order has been created and can be viewed in',
    defaultMessage: 'Your order has been created and can be viewed in',
  },
  onceIssuerConfirmReceiptOfPayment: {
    id: 'assets.SubscriptionTexts.onceIssuerConfirmReceiptOfPayment',
    description:
      'Once the issuer has confirmed receipt of payment the shares will be transferred to your account.',
    defaultMessage:
      'Once the issuer has confirmed receipt of payment the shares will be transferred to your account.',
  },
  feeMessage: {
    id: 'assets.SubscriptionTexts.feeMessage',
    description:
      'The digitalisation fee will be deducted in the form of AUR token(s) from your account.',
    defaultMessage:
      'The digitalisation fee will be deducted in the form of AUR token(s) from your account.',
  },
  orderCreatedMessage: {
    id: 'assets.SubscriptionTexts.orderCreatedMessage',
    description:
      'Your order has been created and payment must be made by {cutOffDate}. The order can be viewed in',
    defaultMessage:
      'Your order has been created and payment must be made by {cutOffDate}. The order can be viewed in',
  },
  onceIssuerConfirmReceiptOfPaymentSettlement: {
    id: 'assets.SubscriptionTexts.onceIssuerConfirmReceiptOfPaymentSettlement',
    description:
      'Once the issuer has confirmed receipt of payment, on the settlement date the shares will be transferred to your account.',
    defaultMessage:
      'Once the issuer has confirmed receipt of payment, on the settlement date the shares will be transferred to your account.',
  },
  subscriptionOrderError: {
    id: 'assets.SubscriptionTexts.subscriptionOrderError',
    description: 'Subscription Order Error',
    defaultMessage: 'Subscription Order Error',
  },
  confirmConditionsPrecedent: {
    id: 'assets.SubscriptionTexts.confirmConditionsPrecedent',
    description: 'Confirm Conditions Precedent',
    defaultMessage: 'Confirm Conditions Precedent',
  },
  uploadDocsRequiredForConditions: {
    id: 'assets.SubscriptionTexts.',
    description:
      'Please upload here any documentation required to satisfy the Conditions Precedent to the first drawdown.',
    defaultMessage:
      'Please upload here any documentation required to satisfy the Conditions Precedent to the first drawdown.',
  },
  referenceConditionsPrecedent: {
    id: 'assets.SubscriptionTexts.referenceConditionsPrecedent',
    description:
      'You can reference the Conditions Precedent to the first drawdown on the',
    defaultMessage:
      'You can reference the Conditions Precedent to the first drawdown on the',
  },
  loanAgreement: {
    id: 'assets.SubscriptionTexts.loanAgreement',
    description: 'Loan Agreement.',
    defaultMessage: 'Loan Agreement.',
  },
  iConfirmThat: {
    id: 'assets.SubscriptionTexts.iConfirmThat',
    description: 'I confirm that:',
    defaultMessage: 'I confirm that:',
  },
  borrowerConfirmThat: {
    id: 'assets.SubscriptionTexts.borrowerConfirmThat',
    description: 'The Borrower confirms that:',
    defaultMessage: 'The Borrower confirms that:',
  },
  loanAgreementExecutedCheck: {
    id: 'assets.SubscriptionTexts.loanAgreementExecutedCheck',
    description: 'The Loan Agreement has been executed.',
    defaultMessage: 'The Loan Agreement has been executed.',
  },
  noEventCheck: {
    id: 'assets.SubscriptionTexts.noEventCheck',
    description:
      'No Event of Default is continuing or might reasonably be expected to result from the making of any Utilisation.',
    defaultMessage:
      'No Event of Default is continuing or might reasonably be expected to result from the making of any Utilisation.',
  },
  noMaterialAdverseCheck: {
    id: 'assets.SubscriptionTexts.noMaterialAdverseCheck',
    description:
      'There has been no material adverse change in its business or financial condition since the most recent financial statements were delivered.',
    defaultMessage:
      'There has been no material adverse change in its business or financial condition since the most recent financial statements were delivered.',
  },
  allDocumentationRequiredCheck: {
    id: 'assets.SubscriptionTexts.allDocumentationRequired',
    description:
      'All the documentation required as part of Schedule II - Conditions Precedent To Initial Utilisation of the Loan Agreement is hereby submitted to the Facility Agent.',
    defaultMessage:
      'All the documentation required as part of Schedule II - Conditions Precedent To Initial Utilisation of the Loan Agreement is hereby submitted to the Facility Agent.',
  },
  uploadProofConditionsPrecedent: {
    id: 'assets.SubscriptionTexts.uploadProofConditionsPrecedent',
    description: 'Upload proof Conditions Precedent have been met',
    defaultMessage: 'Upload proof Conditions Precedent have been met',
  },
  digitalisationOrder: {
    id: 'assets.SubscriptionTexts.digitalisationOrder',
    description: 'Digitalisation order',
    defaultMessage: 'Digitalisation order',
  },
  grams: {
    id: 'assets.SubscriptionTexts.grams',
    description: 'Grams',
    defaultMessage: 'Grams',
  },
  uploadProofOfGoldTransfer: {
    id: 'assets.SubscriptionTexts.uploadProofOfGoldTransfer',
    description:
      'Upload the proof of gold transfer to the Aurelium token holder deposit.',
    defaultMessage:
      'Upload the proof of gold transfer to the Aurelium token holder deposit.',
  },
  iConfirmThatInformationIsReviewed: {
    id: 'assets.SubscriptionTexts.iConfirmThatInformationIsReviewed',
    description:
      'I confirm that I have reviewed the order information and that the information is correct.',
    defaultMessage:
      'I confirm that I have reviewed the order information and that the information is correct.',
  },
  signSubscriptionAgreement: {
    id: 'assets.SubscriptionTexts.signSubscriptionAgreement',
    description: 'Sign Subscription Agreement',
    defaultMessage: 'Sign Subscription Agreement',
  },
  continueToPayment: {
    id: 'assets.SubscriptionTexts.continueToPayment',
    description: 'Continue to payment',
    defaultMessage: 'Continue to payment',
  },
  confirm: {
    id: 'assets.SubscriptionTexts.confirm',
    description: 'Confirm',
    defaultMessage: 'Confirm',
  },
  continueToDocSignSubscriptionDesc: {
    id: 'assets.SubscriptionTexts.continueToDocSignSubscriptionDesc',
    description:
      'To sign the Subscription Agreement you will be redirected to DocuSign where you can electronically sign the agreement. Once you have signed the Subscription Agreement please return to this page where you will be asked to confirm you have signed, complete payment and submit your order.',
    defaultMessage:
      'To sign the Subscription Agreement you will be redirected to DocuSign where you can electronically sign the agreement. Once you have signed the Subscription Agreement please return to this page where you will be asked to confirm you have signed, complete payment and submit your order.',
  },
  subscriptionOrder: {
    id: 'assets.SubscriptionTexts.subscriptionOrder',
    description: 'Subscription order',
    defaultMessage: 'Subscription order',
  },
  iConfirmToSubscriptionAgreement: {
    id: 'assets.SubscriptionTexts.iConfirmToSubscriptionAgreement',
    description:
      'I confirm that I have reviewed and signed the Subscription Agreement.',
    defaultMessage:
      'I confirm that I have reviewed and signed the Subscription Agreement.',
  },
  toPayInitiateWireTransfer: {
    id: 'assets.SubscriptionTexts.toPayInitiateWireTransfer',
    description:
      'To pay for this order, please initiate a wire transfer from your financial institution using the details below. Once you have completed the wire transfer, please upload a confirmation.',
    defaultMessage:
      'To pay for this order, please initiate a wire transfer from your financial institution using the details below. Once you have completed the wire transfer, please upload a confirmation.',
  },
  conditionsPrecedent: {
    id: 'assets.SubscriptionTexts.conditionsPrecedent',
    description: 'Conditions Precedent',
    defaultMessage: 'Conditions Precedent',
  },
  subscriptionAgreement: {
    id: 'assets.SubscriptionTexts.subscriptionAgreement',
    description: 'Subscription Agreement',
    defaultMessage: 'Subscription Agreement',
  },
  areYouSureYouWantToApproveOrder: {
    id: 'assets.SubscriptionTexts.areYouSureYouWantToApproveOrder',
    description:
      'Are you sure you want to approve this order. By approving this order the order will be sent to the buyer for review.',
    defaultMessage:
      'Are you sure you want to approve this order. By approving this order the order will be sent to the buyer for review.',
  },
  actionWillGrantBuyerAccessTo: {
    id: 'assets.SubscriptionTexts.actionWillGrantBuyerAccessTo',
    description: 'This action will grant the buyer access to {token}',
    defaultMessage: 'This action will grant the buyer access to {token}',
  },
  doYouApproveOrder: {
    id: 'assets.SubscriptionTexts.doYouApproveOrder',
    description:
      'Are you sure you want to approve this order? By approving this order the Buyer will be granted access to {token} and will be able to purchase on the primary market.',
    defaultMessage:
      'Are you sure you want to approve this order? By approving this order the Buyer will be granted access to {token} and will be able to purchase on the primary market.',
  },
  viewBuyerInformation: {
    id: 'assets.SubscriptionTexts.viewBuyerInformation',
    description: 'View buyer information',
    defaultMessage: 'View buyer information',
  },
  byApproving: {
    id: 'assets.SubscriptionTexts.byApproving',
    description:
      'By approving, buyer will be notified and asked to review and accept the order.',
    defaultMessage:
      'By approving, buyer will be notified and asked to review and accept the order.',
  },
  inviteBuyerToPlatform: {
    id: 'assets.SubscriptionTexts.inviteBuyerToPlatform',
    description: 'This action will invite the buyer to join the platform',
    defaultMessage: 'This action will invite the buyer to join the platform',
  },
  doYOuApproveOrderKYC: {
    id: 'assets.SubscriptionTexts.doYOuApproveOrderKYC',
    description:
      'Are you sure you want to approve this order? By approving this order the buyer will be invited onto the platform and will be prompted to submitted their KYC information.',
    defaultMessage:
      'Are you sure you want to approve this order? By approving this order the buyer will be invited onto the platform and will be prompted to submitted their KYC information.',
  },
  buyerMustCompleteKYC: {
    id: 'assets.SubscriptionTexts.buyerMustCompleteKYC',
    description:
      'The buyer must complete their KYC before they can view details of the order.',
    defaultMessage:
      'The buyer must complete their KYC before they can view details of the order.',
  },
  rejectOrderError: {
    id: 'assets.SubscriptionTexts.rejectOrderError',
    description: 'REJECT ORDER ERROR',
    defaultMessage: 'REJECT ORDER ERROR',
  },
  areYouSureIssueTokens: {
    id: 'assets.SubscriptionTexts.areYouSureIssueTokens',
    description:
      'Are you sure that you want to issue tokens the tokens? By issuing the tokens, the order is approved and will issue the AUR tokens to the gold owners account.',
    defaultMessage:
      'Are you sure that you want to issue tokens the tokens? By issuing the tokens, the order is approved and will issue the AUR tokens to the gold owners account.',
  },
  confirmPaymentOrder: {
    id: 'assets.SubscriptionTexts.confirmPaymentOrder',
    description:
      'Are you sure that you want to confirm receipt of payment for this order?',
    defaultMessage:
      'Are you sure that you want to confirm receipt of payment for this order?',
  },
  confirmReceiptOfPayment: {
    id: 'assets.SubscriptionTexts.confirmReceiptOfPayment',
    description: 'Confirm receipt of payment',
    defaultMessage: 'Confirm receipt of payment',
  },
  confirmConditionsPrecedentMet: {
    id: 'assets.SubscriptionTexts.',
    description:
      'Are you sure that you want to confirm the Conditions Precedent have been met? By doing so, the Borrower will be notified and will be able to drawdown from the loan.',
    defaultMessage:
      'Are you sure that you want to confirm the Conditions Precedent have been met? By doing so, the Borrower will be notified and will be able to drawdown from the loan.',
  },
  canTakeUpTo5Minutes: {
    id: 'assets.SubscriptionTexts.canTakeUpTo5Minutes',
    description: 'It can take up to 5 minutes to complete.',
    defaultMessage: 'It can take up to 5 minutes to complete.',
  },
  areSureRejectConditionsPrecedent: {
    id: 'assets.SubscriptionTexts.areSureRejectConditionsPrecedent',
    description:
      'Are you sure that you want to reject the proof Conditions Precedent?',
    defaultMessage:
      'Are you sure that you want to reject the proof Conditions Precedent?',
  },
  areSureRejectOrder: {
    id: 'assets.SubscriptionTexts.areSureRejectOrder',
    description: 'Are you sure that you want to reject this order?',
    defaultMessage: 'Are you sure that you want to reject this order?',
  },
  areSureRejectOrderRequest: {
    id: 'assets.SubscriptionTexts.areSureRejectOrder',
    description: 'Are you sure that you want to reject this order request?',
    defaultMessage: 'Are you sure that you want to reject this order request?',
  },
  reasonForRejecting: {
    id: 'assets.SubscriptionTexts.reasonForRejecting',
    description: 'Reason for rejection',
    defaultMessage: 'Reason for rejection',
  },
  areYouSureIssueShares: {
    id: 'assets.SubscriptionTexts.areYouSureIssueShares',
    description: 'Are you sure that you want to issue shares?',
    defaultMessage: 'Are you sure that you want to issue shares?',
  },
  areYouSureSettleOrder: {
    id: 'assets.SubscriptionTexts.areYouSureSettleOrder',
    description:
      'Are you sure that you want to settle this order? It can take up to 5 minutes to settle.',
    defaultMessage:
      'Are you sure that you want to settle this order? It can take up to 5 minutes to settle.',
  },
  approveDrawdown: {
    id: 'assets.SubscriptionTexts.approveDrawdown',
    description: 'Approve drawdown',
    defaultMessage: 'Approve drawdown',
  },
  approveOrder: {
    id: 'assets.SubscriptionTexts.approveOrder',
    description: 'Approve order',
    defaultMessage: 'Approve order',
  },
  sureApproveDrawdown: {
    id: 'assets.SubscriptionTexts.sureApproveDrawdown',
    description:
      'Are you sure you want to approve this drawdown? By approving you the Borrower and Lead Arranger will be notified.',
    defaultMessage:
      'Are you sure you want to approve this drawdown? By approving you the Borrower and Lead Arranger will be notified.',
  },
  sureRejectDrawdown: {
    id: 'assets.SubscriptionTexts.sureRejectDrawdown',
    description: 'Are you sure that you want to reject this drawdown request?',
    defaultMessage:
      'Are you sure that you want to reject this drawdown request?',
  },
  sureToAcceptDrawdown: {
    id: 'assets.SubscriptionTexts.sureToAcceptDrawdown',
    description:
      'By accepting this drawdown request, as the underwriter you shall fund the loan by the utilisation date.',
    defaultMessage:
      'By accepting this drawdown request, as the underwriter you shall fund the loan by the utilisation date.',
  },
  approveNovation: {
    id: 'assets.SubscriptionTexts.approveNovation',
    description: 'Approve novation',
    defaultMessage: 'Approve novation',
  },
  sureApproveNovation: {
    id: 'assets.SubscriptionTexts.sureApproveNovation',
    description:
      'Are you sure you want to approve this novation? By approving the Borrower and Incoming Lender will be notified.',
    defaultMessage:
      'Are you sure you want to approve this novation? By approving the Borrower and Incoming Lender will be notified.',
  },
  acceptNovation: {
    id: 'assets.SubscriptionTexts.acceptNovation',
    description: 'Accept novation',
    defaultMessage: 'Accept novation',
  },
  completeNovation: {
    id: 'assets.SubscriptionTexts.completeNovation',
    description: 'Complete novation',
    defaultMessage: 'Complete novation',
  },
  completeRepayment: {
    id: 'assets.SubscriptionTexts.completeRepayment',
    description: 'Complete repayment',
    defaultMessage: 'Complete repayment',
  },
  settleConfirmRepaymentDesc: {
    id: 'assets.SubscriptionTexts.settleConfirmRepaymentDesc',
    description: 'By proceeding the platform will settle the loan repayment.',
    defaultMessage:
      'By proceeding the platform will settle the loan repayment.',
  },
  sureRejectNovation: {
    id: 'assets.SubscriptionTexts.sureRejectNovation',
    description: 'Are you sure that you want to reject this novation request?',
    defaultMessage:
      'Are you sure that you want to reject this novation request?',
  },
  sureToAcceptNovation: {
    id: 'assets.SubscriptionTexts.sureToAcceptNovation',
    description:
      'By accepting this novation request, as the Lender you shall fund the loan.',
    defaultMessage:
      'By accepting this novation request, as the Lender you shall fund the loan.',
  },
  settleConfirmNovationDesc: {
    id: 'assets.SubscriptionTexts.settleConfirmNovationDesc',
    description:
      'By proceeding the platform will settle the loan novation and the Lead Arranger will receive CBDC in its wallet.',
    defaultMessage:
      'By proceeding the platform will settle the loan novation and the Lead Arranger will receive CBDC in its wallet.',
  },
  sureToAcceptOrder: {
    id: 'assets.SubscriptionTexts.sureToAcceptOrder',
    description:
      'Are you sure you want to accept this order? By accepting this order you are agreeing that the order information is correct.',
    defaultMessage:
      'Are you sure you want to accept this order? By accepting this order you are agreeing that the order information is correct.',
  },
  areYouSureToRequestPayment: {
    id: 'assets.SubscriptionTexts.areYouSureToRequestPayment',
    description:
      'Are you sure you want to request payment? By continuing the Lead Arranger will be notified and requested to pay.',
    defaultMessage:
      'Are you sure you want to request payment? By continuing the Lead Arranger will be notified and requested to pay.',
  },
  areYouSureToRequestPaymentFromLender: {
    id: 'assets.SubscriptionTexts.areYouSureToRequestPaymentFromLender',
    description:
      'Are you sure you want to request payment? By continuing the Lender will be notified and requested to pay.',
    defaultMessage:
      'Are you sure you want to request payment? By continuing the Lender will be notified and requested to pay.',
  },
  areYouSureToRequestPaymentFromBorrower: {
    id: 'assets.SubscriptionTexts.areYouSureToRequestPaymentFromBorrower',
    description:
      'Are you sure you want to request payment? By continuing the Borrower will be notified and requested to pay.',
    defaultMessage:
      'Are you sure you want to request payment? By continuing the Borrower will be notified and instructed to pay.',
  },
  sureToCancelOrder: {
    id: 'assets.SubscriptionTexts.sureToCancelOrder',
    description:
      'Are you sure that you want to cancel this order? By doing this the issuer will receive a notification and refund any payment.',
    defaultMessage:
      'Are you sure that you want to cancel this order? By doing this the issuer will receive a notification and refund any payment.',
  },
  requestPaymentMsg1: {
    id: 'assets.SubscriptionTexts.requestPaymentMsg1',
    description:
      'Creating a hold reserves the shares for this specific transaction to ensure there will always be sufficient funds so the transaction can be settled.',
    defaultMessage:
      'Creating a hold reserves the shares for this specific transaction to ensure there will always be sufficient funds so the transaction can be settled.',
  },
  holdExpiry: {
    id: 'assets.SubscriptionTexts.holdExpiry',
    description: 'Hold expiry',
    defaultMessage: 'Hold expiry',
  },
  requestPaymentMsg2: {
    id: 'assets.SubscriptionTexts.requestPaymentMsg2',
    description:
      'Set how long the shares will be placed on hold. If the transaction has not been completed within this timeframe the order will be cancelled.',
    defaultMessage:
      'Set how long the shares will be placed on hold. If the transaction has not been completed within this timeframe the order will be cancelled.',
  },
  oncePaymentConfirmedMsg: {
    id: 'assets.SubscriptionTexts.oncePaymentConfirmedMsg',
    description:
      'Once the payment has been confirmed the issuer will be notified, review the order and initiate the transfer of shares.',
    defaultMessage:
      'Once the payment has been confirmed the issuer will be notified, review the order and initiate the transfer of shares.',
  },
  settleConfirmDrawdown: {
    id: 'assets.SubscriptionTexts.settleConfirmDrawdown',
    description:
      'By proceeding the platform will settle the loan drawdown and the Borrower will receive CBDC in its wallet.',
    defaultMessage:
      'By proceeding the platform will settle the loan drawdown and the Borrower will receive CBDC in its wallet.',
  },
  settleConfirmOrder: {
    id: 'assets.SubscriptionTexts.settleConfirmOrder',
    description:
      'Are you sure that you want to settle this order? It can take up to 5 minutes to settle.',
    defaultMessage:
      'Are you sure that you want to settle this order? It can take up to 5 minutes to settle.',
  },
  placeOrderConfirmation: {
    id: 'assets.SubscriptionTexts.placeOrderConfirmation',
    description: 'Are you sure you want to place this order?',
    defaultMessage: 'Are you sure you want to place this order?',
  },
  placeOrderInformation: {
    id: 'assets.SubscriptionTexts.placeOrderInformation',
    description:
      'For more information about how orders are handled, view the Order Handling Policy document',
    defaultMessage:
      'For more information about how orders are handled, view the Order Handling Policy document',
  },
  approveRepayment: {
    id: 'assets.SubscriptionTexts.approveRepayment',
    description: 'Approve Repayment',
    defaultMessage: 'Approve Repayment',
  },
  sureApproveRepayment: {
    id: 'assets.SubscriptionTexts.sureApproveRepayment',
    description: 'Are you sure you want to approve this repayment?',
    defaultMessage: 'Are you sure you want to approve this repayment?',
  },
  sureRejectRepayment: {
    id: 'assets.SubscriptionTexts.sureRejectRepayment',
    description: 'Are you sure that you want to reject this repayment request?',
    defaultMessage:
      'Are you sure that you want to reject this repayment request?',
  },
  acceptRepayment: {
    id: 'assets.SubscriptionTexts.acceptRepayment',
    description: 'Accept Repayment',
    defaultMessage: 'Accept Repayment',
  },
  sureToAcceptRepayment: {
    id: 'assets.SubscriptionTexts.sureToAcceptRepayment',
    description: 'Are you sure to accept this repayment request?',
    defaultMessage: 'Are you sure to accept this repayment request?',
  },
});

/*
: {
    id: "assets.SubscriptionTexts.",
    description: "",
    defaultMessage: "",
  },
*/
