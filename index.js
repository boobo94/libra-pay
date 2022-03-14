import axios from 'axios';
import * as CryptoJS from 'crypto-js'
import { DateTime } from 'luxon'
import { random } from './utils'
/**
 * LibraPay library
 * 
 * How to test
 * 
 * Card number 4111111111111111
 * Type VISA
 * Expiry date: any
 * Name: any
 * CVV: any
 */
export class LibraPay {
  constructor(config) {
    this.config = config;
  }

  config = {
    merchantName: '',
    merchantUrl: '',
    email: '',
    key: '',
    merchant: '',
    terminal: '',
    callbackUrl: '',
    baseUrl: '',
  }

  /**
 * Suma totala a comenzii in RON
 * FORMAT OBLIGATORIU: exact doua zecimale separate prin punct (.) si fara separator de mii
 * EXEMPLE CORECTE: "23.50", "1200.00"
 */
  amount = '0.00'

  /**
  * Valuta comenzii
  * FORMAT OBLIGATORIU: "RON"
  */
  currency = 'RON'

  /**
  * Order_id unic,
  * FORMAT OBLIGATORIU: minim 6, maxim 18 caractere exclusiv numerice, prima cifra diferita de "0"
  * EXEMPLE CONCRETE: "100500", "815023361232167984"
  */
  order = ''

  /**
  * Descrierea comenzii; valoare trebuie sa fie dinamica, unica per tranzactie; valoarea apare in dreptul comenzii din internetbanking -> LibraPay pentru identificare
  * FORMAT OBLIGATORIU: String (1-50)
  * EXEMPLU CORECT: "Comanda online #100500"
  */
  desc = ''

  country = '-' // don't change this value
  merch_gmt = '-' // don't change this value

  trtype = 0 //  The value will be updated
  psign = '' // The value will be updated
  string = '' // The value will be updated
  nonce = '' // The value will be updated
  timestamp = '' // The value will be updated

  recurringFrequency = 28
  recurringExpiry = DateTime.now().plus({ years: 2 }).toFormat('yyyyLLdd')

  /**
  * Products that will be bought
  * Format:
  * [
  *  ProductsData: [
  *    {
  *        "ItemName": "Bread", // varchar(255) REQUIRED (This value goes in the confirmation email)
  *        "ItemDesc": "Homemade bread", // varchar(255)
  *        "Categ": "Bakery", // varchar(255)
  *        "Subcateg": "For home", // varchar(255)
  *        "Quantity": "1", // int REQUIRED
  *        "Price": "1.25", // string REQUIRED
  *        "ProductId": "id10001" // varchar(19)
  *    }
  *  ],
  *  UserData: {
  *
  *    // Data of client
  *
  *    "LoginName": "usertest", // varchar(50)
  *    "Email": "testuser@exemplu.com", // varchar(50) REQUIRED
  *    "Name": "Nume Prenume", // varchar(255) REQUIRED
  *    "Cnp": "1234567890123", // varchar(13)
  *    "Phone": "07537282989", // varchar(50) REQUIRED
  *
  *    // Date de Livrare
  *
  *    "ShippingName": "Nume Prenume", // varchar(100) (The name of company or the client's name)
  *    "ShippingID": "VN", // varchar(15) CUI pentru PJ, Serie buletin pentru PF
  *    "ShippingIDNumber": "884869", // varchar(10)
  *    "ShippingIssuedBy": "Mun Focsani", // varchar(100)
  *    "ShippingEmail": "testuser@tests126.com", // varchar(100)
  *    "ShippingPhone": "07537282989", // varchar(50)
  *    "ShippingAddress": "Bdul Unirii, bl. 39, etc", // varchar(255)
  *    "ShippingCity": "Focsani", // varchar(50)
  *    "ShippingPostalCode": "60001", // varchar(50)
  *    "ShippingDistrict": "Vrancea", // varchar(50)
  *    "ShippingCountry": "Romania", // varchar(50)
  *
  *    // Date de Facturare
  *
  *    "BillingName": "Nume Prenume", // varchar(100) REQUIRED (The name of company or the client's name)
  *    "BillingID": "VN", // varchar(15) CUI pentru PJ, Serie buletin pentru PF
  *    "BillingIDNumber": "884869", // varchar(10)
  *    "BillingIssuedBy": "Mun Focsani", // varchar(100)
  *    "BillingEmail": "testuser@tests126.com", // varchar(100) REQUIRED
  *    "BillingPhone": "07537282989", // varchar(50) REQUIRED
  *    "BillingAddress": "Bdul Unirii, bl. 39, etc", // varchar(255)
  *    "BillingCity": "Focsani", // varchar(50) REQUIRED
  *    "BillingPostalCode": "60001", // varchar(50)
  *    "BillingDistrict": "Vrancea", // varchar(50)
  *    "BillingCountry": "Romania" // varchar(50) REQUIRED
  *  }
  * ]
  */
  dataProducts = {}

  /**
   * 
   * @param {String} transactionType The transaction type
   * @param {Object} payload 
   */
  getString(transactionType, payload = {}) {
    // set timestamp
    this.timestamp = DateTime.now().toFormat('yyyyLLddHHmmss')

    // set nonce
    this.nonce = CryptoJS
      .MD5(`shopperkey_${random(99999, 9999999)}`)
      .toString()

    switch (transactionType) {
      case 'authorizeResponse': {
        let txtApproval = payload.APPROVAL.length + payload.APPROVAL
        if (payload.APPROVAL.trim() === '') {
          txtApproval = '-'
        }
        let txtRrn = payload.RRN.length + payload.RRN
        if (payload.RRN.trim() === '') {
          txtRrn = '-'
        }

        let txtIntRef = payload.INT_REF.length + payload.INT_REF
        if (payload.INT_REF.trim() === '') {
          txtIntRef = '-'
        }

        this.string = payload.TERMINAL.length + payload.TERMINAL +
          payload.TRTYPE.toString().length + payload.TRTYPE +
          payload.ORDER.toString().length + payload.ORDER +
          payload.AMOUNT.length + payload.AMOUNT +
          payload.CURRENCY.length + payload.CURRENCY +
          payload.DESC.length + payload.DESC +
          payload.ACTION.length + payload.ACTION +
          payload.RC.length + payload.RC +
          payload.MESSAGE.length + payload.MESSAGE +
          txtRrn +
          txtIntRef +
          txtApproval +
          payload.TIMESTAMP.length + payload.TIMESTAMP +
          payload.NONCE.length + payload.NONCE
        break;
      }


      case 'capture':
      case 'refundTransaction': {
        this.string = this.amount.length + this.amount +
          this.order.length + this.order +
          this.config.terminal.length + this.config.terminal +
          this.trtype.toString().length + this.trtype +
          this.timestamp.length + this.timestamp +
          this.nonce.length + this.nonce +
          this.config.callbackUrl.length + this.config.callbackUrl

        break;
      }

      case 'captureRecurring':
      case 'cancelRecurring': {
        this.string = this.amount.length + this.amount +
          this.order.length + this.order +
          this.config.terminal.length + this.config.terminal +
          this.trtype.toString().length + this.trtype +
          this.desc.length + this.desc +
          this.timestamp.length + this.timestamp +
          this.nonce.length + this.nonce +
          this.config.callbackUrl.length + this.config.callbackUrl

        break;
      }

      case "authorize":
      default: {
        this.string = this.amount.length + this.amount +
          this.currency.length + this.currency +
          this.order.length + this.order +
          this.desc.length + this.desc +
          this.config.merchantName.length + this.config.merchantName +
          this.config.merchantUrl.length + this.config.merchantUrl +
          this.config.merchant.length + this.config.merchant +
          this.config.terminal.length + this.config.terminal +
          this.config.email.length + this.config.email +
          this.trtype.toString().length + this.trtype +
          this.country +
          this.merch_gmt +
          this.timestamp.length + this.timestamp +
          this.nonce.length + this.nonce +
          this.config.callbackUrl.length + this.config.callbackUrl +

          // for recurring payments
          this.recurringFrequency.toString().length + this.recurringFrequency +
          this.recurringExpiry.length + this.recurringExpiry
        break;
      }
    }

    // set psign
    const hexKey = CryptoJS.enc.Hex.parse(this.config.key)
    this.psign = CryptoJS
      .HmacSHA1(this.string, hexKey)
      .toString()
      .toUpperCase()
  }

  generateForm(amount, orderId, description, products) {
    this.amount = amount
    this.order = orderId
    this.desc = description
    this.dataProducts = Buffer.from(JSON.stringify(products)).toString('base64')
    this.trtype = 0

    this.getString('authorize')

    return `
        <form id="PaymentForm" name="PaymentForm" method="post" action="${this.config.baseUrl + 'pay_auth.php'}">
            <input type="hidden" name="AMOUNT" value="${this.amount}" />
            <input type="hidden" name="CURRENCY" value="${this.currency}" />
            <input type="hidden" name="ORDER" value="${this.order}" />
            <input type="hidden" name="DESC" value="${this.desc}" />
            <input type="hidden" name="TERMINAL" value="${this.config.terminal}" />
            <input type="hidden" name="TIMESTAMP" value="${this.timestamp}" />
            <input type="hidden" name="NONCE" value="${this.nonce}" />
            <input type="hidden" name="BACKREF" value="${this.config.callbackUrl}" />
            <input type="hidden" name="DATA_CUSTOM" value="${this.dataProducts}" />
            <input type="hidden" name="STRING" value="${this.string}" />
            <input type="hidden" name="RECUR_FREQ" value="${this.recurringFrequency}" />
            <input type="hidden" name="RECUR_EXP" value="${this.recurringExpiry}" />
            <input type="hidden" name="P_SIGN" value="${this.psign}" />
            <script type="text/javascript">document.getElementById("PaymentForm").submit();</script>
        </form>
    `
  }

  /**
   * Handle IPN response from LibraPay
   * @param {Object} response The response object from LibraPay
   * Properties of response object:
   *      - terminal
   *      - trtype
   *      - order
   *      - amount
   *      - currency
   *      - desc
   *      - action
   *      - rc = the response code. "00" = succesfull transaction, anything different than "00" represents the specific error code with the description inside message field
   *      - message = the description of transaction, if succeeded or not
   *      - rrn
   *      - int_ref
   *      - approval
   *      - timestamp
   *      - nonce
   *
   * @returns {String}
   */
  handleIPN(response) {
    if (!Object.keys(response).length) return "0"

    this.getString("authorizeResponse", response)

    if (response.P_SIGN !== this.psign) {
      return "0"
    }

    // to confirm the succes of request to LibraPay send 1 as response
    return "1"
  }

  /**
   * Capture the amount for a previously authorized recurring transaction
   * This is used only for recurring transactions based on orderId.
   * @param {String} amount 
   * @param {String} orderId 
   * @param {String} description 
   * @returns {String} String which is identified as RequestId on IPN
   * One of the following error messages on failure: 
   *    - Numarul de incercari de incasare recurenta pentru aceasta OrderId a fost depasit!
   *    - OrderId inexistent/nevalidat/expirat!
   */
  async captureRecurringTransaction(amount, orderId, description) {
    this.amount = amount
    this.order = orderId
    this.desc = description
    this.trtype = 171
    this.getString("captureRecurring")

    const body = new URLSearchParams({
      AMOUNT: this.amount,
      CURRENCY: this.currency,
      ORDER: this.order,
      DESC: this.desc,
      TERMINAL: this.config.terminal,
      TRTYPE: this.trtype,
      TIMESTAMP: this.timestamp,
      NONCE: this.nonce,
      BACKREF: this.config.callbackUrl,
      P_SIGN: this.psign
    });

    const { data } = await axios.post(
      this.config.baseUrl + 'pay_req.php',
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    )

    return data
  }

  /**
   * Refund the money for a previosy transaction
   * 
   * This is used only for clasic transaction.
   * @param {String} amount 
   * @param {String} orderId 
   * @param {Boolean} isTotalRefund 
   * @returns 
   */
  async refundTransaction(amount, orderId, isTotalRefund = true) {
    this.amount = amount
    this.order = orderId
    this.trtype = isTotalRefund ? 24 : 25

    this.getString("refundTransaction")

    const body = new URLSearchParams({
      ORDER: this.order,
      TERMINAL: this.config.terminal,
      AMOUNT: this.amount,
      TRTYPE: this.trtype,
      TIMESTAMP: this.timestamp,
      NONCE: this.nonce,
      BACKREF: this.config.callbackUrl,
      P_SIGN: this.psign
    });

    const { data } = await axios.post(
      this.config.baseUrl + 'pay_sales.php',
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: this.config.callbackUrl
        }
      }
    )
    return data
  }

  /**
   * Cancel recurring transaction
   * @param {String} amount 
   * @param {String} orderId 
   * @returns "1" in case of success, otherise return the error message
   */
  async cancelRecurringTransaction(amount, orderId) {
    this.trtype = 172
    this.amount = amount
    this.order = orderId
    this.desc = 'cancel recurring transaction'
    this.getString("cancelRecurring")

    const body = new URLSearchParams({
      AMOUNT: this.amount,
      CURRENCY: this.currency,
      ORDER: this.order,
      DESC: this.desc,
      TERMINAL: this.config.terminal,
      TIMESTAMP: this.timestamp,
      NONCE: this.nonce,
      BACKREF: this.config.callbackUrl,
      P_SIGN: this.psign
    });

    const { data } = await axios.post(
      this.config.baseUrl + 'pay_req.php',
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    )
    return data
  }

  async refundRecurringTransaction(amount, orderId) {
    this.trtype = 172
    this.getString("cancelRecurring")

    const body = new URLSearchParams({
      AMOUNT: this.amount,
      CURRENCY: this.currency,
      ORDER: this.order,
      DESC: this.desc,
      TERMINAL: this.config.terminal,
      TIMESTAMP: this.timestamp,
      NONCE: this.nonce,
      BACKREF: this.config.callbackUrl,
      P_SIGN: this.psign
    });

    const { data } = await axios.post(
      this.config.baseUrl + 'pay_req.php',
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    )
    return data
  }

  /**
   * Capture the amount for a previously authorized transaction
   * @param {String} amount 
   * @param {String} orderId 
   * @returns "1" in case of success, otherise return the error message
   */
  async captureTransaction(amount, orderId) {
    this.amount = amount
    this.order = orderId
    this.trtype = 21

    this.getString("capture")

    const body = new URLSearchParams({
      ORDER: this.order,
      TERMINAL: this.config.terminal,
      AMOUNT: this.amount,
      TRTYPE: this.trtype,
      TIMESTAMP: this.timestamp,
      NONCE: this.nonce,
      BACKREF: this.config.callbackUrl,
      P_SIGN: this.psign
    });

    const res = await axios.post(
      this.config.baseUrl + 'pay_sales.php',
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Referer: this.config.callbackUrl
        }
      }
    )
    return res.data
  }
}


export const BASE_URL_PRODUCTION = 'https://secure.librapay.ro/'
export const BASE_URL_SANDBOX = 'https://merchant.librapay.ro/'