> ## Documentation Index
> Fetch the complete documentation index at: https://www.cashfree.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# End Points

> Review the production and sandbox base URLs and the authentication headers you need to call the 2023-08-01 Cashfree Payments API endpoints.

<Note>
  Use the latest version of our APIs [v2025-01-01](/docs/api-reference/payments/latest/overview) for any new integrations.
</Note>

## Payment Gateway end points

| Environment    | Base URL                                                                            |
| :------------- | :---------------------------------------------------------------------------------- |
| Test           | [https://sandbox.cashfree.com/pg](https://sandbox.cashfree.com/pg)                  |
| Production     | [https://api.cashfree.com/pg](https://api.cashfree.com/pg)                          |
| Latest Version | v4, 2023-08-01 <br /> The previous versions were 2021-05-21, 2022-01-01, 2022-09-01 |

## Authentication

All the APIs require authentication, except the /orders/sessions API, which does not require any authentication and can be safely done from the browser as well.

Click [here](/docs/api-reference/authentication) for detailed information on API Authentication for Merchants and Partners.

***

## Payment Gateway APIs

### Orders

| API                                                                                 | Description                                                                                              |
| :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| [Create Order](/docs/api-reference/payments/previous/v2023-08-01/orders/create-order)    | Use this API to create orders with Cashfree from your backend and get the payment link.                  |
| [Order Pay](/docs/api-reference/payments/previous/v2023-08-01/payments/order-pay)        | Use this API when you have already created the orders and want Cashfree Payments to process the payment. |
| [Preauthorization](/docs/api-reference/payments/previous/v2023-08-01/payments/authorize) | Use this API to capture or void a preauthorized payment.                                                 |
| [Get Order](/docs/api-reference/payments/previous/v2023-08-01/orders/get-order)          | Use this API to view all details of an order.                                                            |

***

### Authentication

| API                                                                                        | Description                                               |
| :----------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| [Submit or Resend OTP](/docs/api-reference/payments/previous/v2023-08-01/payments/authenticate) | Use the submit or resend OTP API to send OTP to Cashfree. |

***

### Payments

| API                                                                                                          | Description                                                        |
| :----------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| [Get Payments for an Order](/docs/api-reference/payments/previous/v2023-08-01/payments/get-payments-for-an-order) | Use this API to view all payment details for an order.             |
| [Get Payment by ID](/docs/api-reference/payments/previous/v2023-08-01/payments/get-payment-by-id)                 | Use this API to view payment details of an order for a payment ID. |

***

### Settlements

| API                                                                                                           | Description                                                                                               |
| :------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------- |
| [Get Settlements by Order ID](/docs/api-reference/payments/previous/v2023-08-01/settlements/settlements-for-order) | Use this API to view all the settlements of a particular order.                                           |
| [Get All Settlements](/docs/api-reference/payments/previous/v2023-08-01/settlements/settlements)                   | Use this API to get all settlement details by specifying the settlement ID, settlement UTR or date range. |

***

### Payment links

| API                                                                                                                    | Description                                                                                                                                     |
| :--------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| [Create Payment Link](/docs/api-reference/payments/previous/v2023-08-01/payment-links/create-payment-link)                  | Use this API to create a new payment link. The created payment link url will be available in the API response parameter link\_url.              |
| [Fetch Payment Link Details](/docs/api-reference/payments/previous/v2023-08-01/payment-links/get-orders-for-a-payment-link) | Use this API to view all details and status of a payment link.                                                                                  |
| [Get Orders for a Payment Link](/docs/api-reference/payments/previous/v2023-08-01/payment-links/fetch-payment-link-details) | Use this API to view all order details for a payment link.                                                                                      |
| [Cancel Payment Link](/docs/api-reference/payments/previous/v2023-08-01/payment-links/cancel-payment-link)                  | Use this API to cancel a payment link. No further payments can be done against a cancelled link. Only a link in ACTIVE status can be cancelled. |

### Token vault

| API                                                                                                                                            | Description                                                                                                         |
| :--------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| [Fetch All Saved Instruments](/docs/api-reference/payments/previous/v2023-08-01/token-vault/fetch-all-saved-card-instrument)                        | Use this API to get all saved instruments for a customer ID.                                                        |
| [Fetch Single Saved Instrument](/docs/api-reference/payments/previous/v2023-08-01/token-vault/fetch-specific-saved-card-instrument)                 | Use this API to get specific saved instrument for a customer id and instrument ID.                                  |
| [Delete Saved Instrument](/docs/api-reference/payments/previous/v2023-08-01/token-vault/delete-saved-card-instrument)                               | Use this API to delete a saved instrument for a customer id and instrument ID.                                      |
| [Fetch Cryptogram for Saved Instrument](/docs/api-reference/payments/previous/v2023-08-01/token-vault/fetch-cryptogram-for-a-saved-card-instrument) | Use this API to get the card network token, token expiry and cryptogram for a saved instrument using instrument ID. |

***

### Reconciliation

| API                                                                                                             | Description                                                                                              |
| :-------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| [Settlement Reconciliation](/docs/api-reference/payments/previous/v2023-08-01/settlements/settlement-reconciliation) | Use this API to get settlement reconciliation details using Settlement ID, settlement UTR or date range. |
| [PG Reconciliation](/docs/api-reference/payments/previous/v2023-08-01/settlements/reconcile)                         | Use this API to get the payment gateway reconciliation details with date range.                          |