import type { TrainingSample } from "@/types";

// ── Personal ──
export { TRAINING_SAMPLES_NAME } from "./personal/nameData";
export { TRAINING_SAMPLES_FIRST_NAME } from "./personal/firstNameData";
export { TRAINING_SAMPLES_LAST_NAME } from "./personal/lastNameData";
export { TRAINING_SAMPLES_FULL_NAME } from "./personal/fullNameData";
export { TRAINING_SAMPLES_BIRTH_DATE } from "./personal/birthDateData";
export { TRAINING_SAMPLES_CPF } from "./personal/cpfData";
export { TRAINING_SAMPLES_CNPJ } from "./personal/cnpjData";
export { TRAINING_SAMPLES_CPF_CNPJ } from "./personal/cpfCnpjData";
export { TRAINING_SAMPLES_RG } from "./personal/rgData";
export { TRAINING_SAMPLES_PASSPORT } from "./personal/passportData";
export { TRAINING_SAMPLES_CNH } from "./personal/cnhData";
export { TRAINING_SAMPLES_PIS } from "./personal/pisData";
export { TRAINING_SAMPLES_NATIONAL_ID } from "./personal/nationalIdData";
export { TRAINING_SAMPLES_TAX_ID } from "./personal/taxIdData";
export { TRAINING_SAMPLES_DOCUMENT_ISSUER } from "./personal/documentIssuerData";

// ── Contact ──
export { TRAINING_SAMPLES_EMAIL } from "./contact/emailData";
export { TRAINING_SAMPLES_PHONE } from "./contact/phoneData";
export { TRAINING_SAMPLES_MOBILE } from "./contact/mobileData";
export { TRAINING_SAMPLES_WHATSAPP } from "./contact/whatsappData";
export { TRAINING_SAMPLES_WEBSITE } from "./contact/websiteData";
export { TRAINING_SAMPLES_URL } from "./contact/urlData";

// ── Address ──
export { TRAINING_SAMPLES_ADDRESS } from "./address/addressData";
export { TRAINING_SAMPLES_STREET } from "./address/streetData";
export { TRAINING_SAMPLES_HOUSE_NUMBER } from "./address/houseNumberData";
export { TRAINING_SAMPLES_COMPLEMENT } from "./address/complementData";
export { TRAINING_SAMPLES_NEIGHBORHOOD } from "./address/neighborhoodData";
export { TRAINING_SAMPLES_CITY } from "./address/cityData";
export { TRAINING_SAMPLES_STATE } from "./address/stateData";
export { TRAINING_SAMPLES_COUNTRY } from "./address/countryData";
export { TRAINING_SAMPLES_CEP } from "./address/cepData";
export { TRAINING_SAMPLES_ZIP_CODE } from "./address/zipCodeData";

// ── Financial ──
export { TRAINING_SAMPLES_MONEY } from "./financial/moneyData";
export { TRAINING_SAMPLES_PRICE } from "./financial/priceData";
export { TRAINING_SAMPLES_AMOUNT } from "./financial/amountData";
export { TRAINING_SAMPLES_DISCOUNT } from "./financial/discountData";
export { TRAINING_SAMPLES_TAX } from "./financial/taxData";
export { TRAINING_SAMPLES_CREDIT_CARD_NUMBER } from "./financial/creditCardNumberData";
export { TRAINING_SAMPLES_CREDIT_CARD_EXPIRATION } from "./financial/creditCardExpirationData";
export { TRAINING_SAMPLES_CREDIT_CARD_CVV } from "./financial/creditCardCvvData";
export { TRAINING_SAMPLES_PIX_KEY } from "./financial/pixKeyData";
export { TRAINING_SAMPLES_NUMBER } from "./financial/numberData";

// ── Authentication ──
export { TRAINING_SAMPLES_USERNAME } from "./authentication/usernameData";
export { TRAINING_SAMPLES_PASSWORD } from "./authentication/passwordData";
export { TRAINING_SAMPLES_CONFIRM_PASSWORD } from "./authentication/confirmPasswordData";
export { TRAINING_SAMPLES_OTP } from "./authentication/otpData";
export { TRAINING_SAMPLES_VERIFICATION_CODE } from "./authentication/verificationCodeData";

// ── Professional ──
export { TRAINING_SAMPLES_JOB_TITLE } from "./professional/jobTitleData";
export { TRAINING_SAMPLES_DEPARTMENT } from "./professional/departmentData";
export { TRAINING_SAMPLES_EMPLOYEE_COUNT } from "./professional/employeeCountData";

// ── Ecommerce ──
export { TRAINING_SAMPLES_PRODUCT } from "./company/productData";
export { TRAINING_SAMPLES_PRODUCT_NAME } from "./ecommerce/productNameData";
export { TRAINING_SAMPLES_SKU } from "./ecommerce/skuData";
export { TRAINING_SAMPLES_QUANTITY } from "./ecommerce/quantityData";
export { TRAINING_SAMPLES_COUPON } from "./ecommerce/couponData";
export { TRAINING_SAMPLES_SUPPLIER } from "./ecommerce/supplierData";
export { TRAINING_SAMPLES_COMPANY } from "./ecommerce/companyData";

// ── Generic ──
export { TRAINING_SAMPLES_TEXT } from "./generic/textData";
export { TRAINING_SAMPLES_DESCRIPTION } from "./generic/descriptionData";
export { TRAINING_SAMPLES_NOTES } from "./generic/notesData";
export { TRAINING_SAMPLES_DATE } from "./generic/dateData";
export { TRAINING_SAMPLES_START_DATE } from "./generic/startDateData";
export { TRAINING_SAMPLES_END_DATE } from "./generic/endDateData";
export { TRAINING_SAMPLES_DUE_DATE } from "./generic/dueDateData";

// ── System ──
export { TRAINING_SAMPLES_SEARCH } from "./system/searchData";
export { TRAINING_SAMPLES_SELECT } from "./system/selectData";
export { TRAINING_SAMPLES_CHECKBOX } from "./system/checkboxData";
export { TRAINING_SAMPLES_RADIO } from "./system/radioData";
export { TRAINING_SAMPLES_FILE } from "./system/fileData";
export { TRAINING_SAMPLES_UNKNOWN } from "./system/unknownData";

// ── Imports for consolidated array ──
import { TRAINING_SAMPLES_NAME } from "./personal/nameData";
import { TRAINING_SAMPLES_FIRST_NAME } from "./personal/firstNameData";
import { TRAINING_SAMPLES_LAST_NAME } from "./personal/lastNameData";
import { TRAINING_SAMPLES_FULL_NAME } from "./personal/fullNameData";
import { TRAINING_SAMPLES_BIRTH_DATE } from "./personal/birthDateData";
import { TRAINING_SAMPLES_CPF } from "./personal/cpfData";
import { TRAINING_SAMPLES_CNPJ } from "./personal/cnpjData";
import { TRAINING_SAMPLES_CPF_CNPJ } from "./personal/cpfCnpjData";
import { TRAINING_SAMPLES_RG } from "./personal/rgData";
import { TRAINING_SAMPLES_PASSPORT } from "./personal/passportData";
import { TRAINING_SAMPLES_CNH } from "./personal/cnhData";
import { TRAINING_SAMPLES_PIS } from "./personal/pisData";
import { TRAINING_SAMPLES_NATIONAL_ID } from "./personal/nationalIdData";
import { TRAINING_SAMPLES_TAX_ID } from "./personal/taxIdData";
import { TRAINING_SAMPLES_DOCUMENT_ISSUER } from "./personal/documentIssuerData";
import { TRAINING_SAMPLES_EMAIL } from "./contact/emailData";
import { TRAINING_SAMPLES_PHONE } from "./contact/phoneData";
import { TRAINING_SAMPLES_MOBILE } from "./contact/mobileData";
import { TRAINING_SAMPLES_WHATSAPP } from "./contact/whatsappData";
import { TRAINING_SAMPLES_WEBSITE } from "./contact/websiteData";
import { TRAINING_SAMPLES_URL } from "./contact/urlData";
import { TRAINING_SAMPLES_ADDRESS } from "./address/addressData";
import { TRAINING_SAMPLES_STREET } from "./address/streetData";
import { TRAINING_SAMPLES_HOUSE_NUMBER } from "./address/houseNumberData";
import { TRAINING_SAMPLES_COMPLEMENT } from "./address/complementData";
import { TRAINING_SAMPLES_NEIGHBORHOOD } from "./address/neighborhoodData";
import { TRAINING_SAMPLES_CITY } from "./address/cityData";
import { TRAINING_SAMPLES_STATE } from "./address/stateData";
import { TRAINING_SAMPLES_COUNTRY } from "./address/countryData";
import { TRAINING_SAMPLES_CEP } from "./address/cepData";
import { TRAINING_SAMPLES_ZIP_CODE } from "./address/zipCodeData";
import { TRAINING_SAMPLES_MONEY } from "./financial/moneyData";
import { TRAINING_SAMPLES_PRICE } from "./financial/priceData";
import { TRAINING_SAMPLES_AMOUNT } from "./financial/amountData";
import { TRAINING_SAMPLES_DISCOUNT } from "./financial/discountData";
import { TRAINING_SAMPLES_TAX } from "./financial/taxData";
import { TRAINING_SAMPLES_CREDIT_CARD_NUMBER } from "./financial/creditCardNumberData";
import { TRAINING_SAMPLES_CREDIT_CARD_EXPIRATION } from "./financial/creditCardExpirationData";
import { TRAINING_SAMPLES_CREDIT_CARD_CVV } from "./financial/creditCardCvvData";
import { TRAINING_SAMPLES_PIX_KEY } from "./financial/pixKeyData";
import { TRAINING_SAMPLES_NUMBER } from "./financial/numberData";
import { TRAINING_SAMPLES_USERNAME } from "./authentication/usernameData";
import { TRAINING_SAMPLES_PASSWORD } from "./authentication/passwordData";
import { TRAINING_SAMPLES_CONFIRM_PASSWORD } from "./authentication/confirmPasswordData";
import { TRAINING_SAMPLES_OTP } from "./authentication/otpData";
import { TRAINING_SAMPLES_VERIFICATION_CODE } from "./authentication/verificationCodeData";
import { TRAINING_SAMPLES_JOB_TITLE } from "./professional/jobTitleData";
import { TRAINING_SAMPLES_DEPARTMENT } from "./professional/departmentData";
import { TRAINING_SAMPLES_EMPLOYEE_COUNT } from "./professional/employeeCountData";
import { TRAINING_SAMPLES_PRODUCT } from "./company/productData";
import { TRAINING_SAMPLES_PRODUCT_NAME } from "./ecommerce/productNameData";
import { TRAINING_SAMPLES_SKU } from "./ecommerce/skuData";
import { TRAINING_SAMPLES_QUANTITY } from "./ecommerce/quantityData";
import { TRAINING_SAMPLES_COUPON } from "./ecommerce/couponData";
import { TRAINING_SAMPLES_SUPPLIER } from "./ecommerce/supplierData";
import { TRAINING_SAMPLES_COMPANY } from "./ecommerce/companyData";
import { TRAINING_SAMPLES_TEXT } from "./generic/textData";
import { TRAINING_SAMPLES_DESCRIPTION } from "./generic/descriptionData";
import { TRAINING_SAMPLES_NOTES } from "./generic/notesData";
import { TRAINING_SAMPLES_DATE } from "./generic/dateData";
import { TRAINING_SAMPLES_START_DATE } from "./generic/startDateData";
import { TRAINING_SAMPLES_END_DATE } from "./generic/endDateData";
import { TRAINING_SAMPLES_DUE_DATE } from "./generic/dueDateData";
import { TRAINING_SAMPLES_SEARCH } from "./system/searchData";
import { TRAINING_SAMPLES_SELECT } from "./system/selectData";
import { TRAINING_SAMPLES_CHECKBOX } from "./system/checkboxData";
import { TRAINING_SAMPLES_RADIO } from "./system/radioData";
import { TRAINING_SAMPLES_FILE } from "./system/fileData";
import { TRAINING_SAMPLES_UNKNOWN } from "./system/unknownData";

export const ALL_TRAINING_SAMPLES: TrainingSample[] = [
  // Personal
  ...TRAINING_SAMPLES_NAME,
  ...TRAINING_SAMPLES_FIRST_NAME,
  ...TRAINING_SAMPLES_LAST_NAME,
  ...TRAINING_SAMPLES_FULL_NAME,
  ...TRAINING_SAMPLES_BIRTH_DATE,
  // Document
  ...TRAINING_SAMPLES_CPF,
  ...TRAINING_SAMPLES_CNPJ,
  ...TRAINING_SAMPLES_CPF_CNPJ,
  ...TRAINING_SAMPLES_RG,
  ...TRAINING_SAMPLES_PASSPORT,
  ...TRAINING_SAMPLES_CNH,
  ...TRAINING_SAMPLES_PIS,
  ...TRAINING_SAMPLES_NATIONAL_ID,
  ...TRAINING_SAMPLES_TAX_ID,
  ...TRAINING_SAMPLES_DOCUMENT_ISSUER,
  // Contact
  ...TRAINING_SAMPLES_EMAIL,
  ...TRAINING_SAMPLES_PHONE,
  ...TRAINING_SAMPLES_MOBILE,
  ...TRAINING_SAMPLES_WHATSAPP,
  ...TRAINING_SAMPLES_WEBSITE,
  ...TRAINING_SAMPLES_URL,
  // Address
  ...TRAINING_SAMPLES_ADDRESS,
  ...TRAINING_SAMPLES_STREET,
  ...TRAINING_SAMPLES_HOUSE_NUMBER,
  ...TRAINING_SAMPLES_COMPLEMENT,
  ...TRAINING_SAMPLES_NEIGHBORHOOD,
  ...TRAINING_SAMPLES_CITY,
  ...TRAINING_SAMPLES_STATE,
  ...TRAINING_SAMPLES_COUNTRY,
  ...TRAINING_SAMPLES_CEP,
  ...TRAINING_SAMPLES_ZIP_CODE,
  // Financial
  ...TRAINING_SAMPLES_MONEY,
  ...TRAINING_SAMPLES_PRICE,
  ...TRAINING_SAMPLES_AMOUNT,
  ...TRAINING_SAMPLES_DISCOUNT,
  ...TRAINING_SAMPLES_TAX,
  ...TRAINING_SAMPLES_CREDIT_CARD_NUMBER,
  ...TRAINING_SAMPLES_CREDIT_CARD_EXPIRATION,
  ...TRAINING_SAMPLES_CREDIT_CARD_CVV,
  ...TRAINING_SAMPLES_PIX_KEY,
  ...TRAINING_SAMPLES_NUMBER,
  // Authentication
  ...TRAINING_SAMPLES_USERNAME,
  ...TRAINING_SAMPLES_PASSWORD,
  ...TRAINING_SAMPLES_CONFIRM_PASSWORD,
  ...TRAINING_SAMPLES_OTP,
  ...TRAINING_SAMPLES_VERIFICATION_CODE,
  // Professional
  ...TRAINING_SAMPLES_JOB_TITLE,
  ...TRAINING_SAMPLES_DEPARTMENT,
  ...TRAINING_SAMPLES_EMPLOYEE_COUNT,
  // Ecommerce
  ...TRAINING_SAMPLES_PRODUCT,
  ...TRAINING_SAMPLES_PRODUCT_NAME,
  ...TRAINING_SAMPLES_SKU,
  ...TRAINING_SAMPLES_QUANTITY,
  ...TRAINING_SAMPLES_COUPON,
  ...TRAINING_SAMPLES_SUPPLIER,
  ...TRAINING_SAMPLES_COMPANY,
  // Generic
  ...TRAINING_SAMPLES_TEXT,
  ...TRAINING_SAMPLES_DESCRIPTION,
  ...TRAINING_SAMPLES_NOTES,
  ...TRAINING_SAMPLES_DATE,
  ...TRAINING_SAMPLES_START_DATE,
  ...TRAINING_SAMPLES_END_DATE,
  ...TRAINING_SAMPLES_DUE_DATE,
  // System
  ...TRAINING_SAMPLES_SEARCH,
  ...TRAINING_SAMPLES_SELECT,
  ...TRAINING_SAMPLES_CHECKBOX,
  ...TRAINING_SAMPLES_RADIO,
  ...TRAINING_SAMPLES_FILE,
  ...TRAINING_SAMPLES_UNKNOWN,
];
