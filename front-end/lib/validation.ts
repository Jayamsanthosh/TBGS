export const TANZANIA_ZONES = [
  "Northern Zone",
  "Central Zone",
  "Lake Zone",
  "Eastern Zone",
  "Southern Highlands Zone",
  "Southern Zone",
  "Western Zone",
  "Coastal Zone"
];

const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a date value for display as dd-MMM-yyyy (e.g. "04-Aug-2026").
 * Tolerates yyyy-MM-dd, ISO datetime strings, dd-MM-yyyy, dd/MM/yyyy and Date objects.
 * Non-date strings are returned unchanged; empty values return "-".
 */
export const formatDate = (v: any): string => {
  if (v === null || v === undefined || v === "") return "-";
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
  }
  const s = String(v).trim();
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(s)) return s;
  let m = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (m) {
    const mon = MONTH_ABBRS[Number(m[2]) - 1];
    if (mon) return `${m[1]}-${mon}-${m[3]}`;
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/);
  if (m) {
    const mon = MONTH_ABBRS[Number(m[2]) - 1];
    if (mon) return `${m[3]}-${mon}-${m[1]}`;
  }
  return s;
};

/**
 * Utility functions for common data validation patterns
 */

export const validateTin = (tin: string | undefined): boolean => {
  if (!tin) return true; // Optional by default, use required in form config
  return /^\d{9}$/.test(tin);
};

export const TIN_LENGTH = 9;

/**
 * Returns a meaningful validation message for a TIN value, or null when valid
 * (or empty). TINs are optional by default: an empty value passes.
 */
export const tinLengthMessage = (tin: string | undefined): string | null => {
  if (tin === undefined || tin === null) return null;
  const s = String(tin).trim();
  if (!s) return null;
  if (!/^\d+$/.test(s)) return "Title Holder TIN No must contain only numbers (0-9).";
  if (s.length < TIN_LENGTH) return `Title Holder TIN No must be at least ${TIN_LENGTH} digits.`;
  if (s.length > TIN_LENGTH) return `Title Holder TIN No cannot be more than ${TIN_LENGTH} digits.`;
  return null;
};

export const validateEmail = (email: string | undefined): boolean => {
  if (!email) return true;
  const emails = email.split(';');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.every(e => {
    const trimmed = e.trim();
    if (!trimmed) return true; // handle trailing or extra semicolons gracefully
    return emailRegex.test(trimmed);
  });
};

export const validateWebsite = (website: string | undefined): boolean => {
  if (!website) return true;
  return /^https?:\/\/.+/.test(website);
};

export const validateTanzaniaPhone = (phone: string | undefined): boolean => {
  if (!phone) return true;
  // Strip spaces and check for +255 followed by 9-12 digits
  // Or check if it's already just the 9-12 digits if stripped
  const cleanPhone = phone.replace(/[\s+]/g, "");
  // If it starts with 255 followed by 9-12 digits
  if (cleanPhone.startsWith("255")) {
    return /^255\d{9,12}$/.test(cleanPhone);
  }
  // If it's just the digits
  return /^\d{9,12}$/.test(cleanPhone);
};

export const formatTanzaniaPhone = (val: string | undefined): string => {
  if (!val) return "";
  
  // Clean only non-digits, but keep a leading + if present temporarily
  let clean = val.replace(/[^\d]/g, "");
  
  // Always ensure it starts with 255 for Tanzania internally in the formatted string
  if (!clean.startsWith("255")) {
    // If user starts typing a 7 or 0, we assume it's the start of the 9 digits
    if (clean.length > 0) {
      if (clean.startsWith("0")) clean = clean.substring(1);
      clean = "255" + clean;
    } else {
      return "";
    }
  }

  // Max 12 digits (255 + 9 digits)
  clean = clean.substring(0, 12);
  
  let result = "+255";
  const rest = clean.substring(3);
  
  if (rest.length > 0) result += " " + rest.substring(0, 2);
  if (rest.length > 2) result += " " + rest.substring(2, 5);
  if (rest.length > 5) result += " " + rest.substring(5);
  
  return result;
};

export const cleanPhoneForStorage = (phone: string | undefined): string => {
  if (!phone) return "";
  const clean = phone.replace(/[^\d]/g, "");
  if (clean.startsWith("255")) return clean.substring(3);
  return clean;
};

/**
 * Reads a value from a form by either its camelCase or SCREAMING_CASE key.
 * Forms across the app use SCREAMING_CASE (e.g. TIN_NUMBER, EMAIL_ADDRESS),
 * while older/other consumers may pass camelCase (e.g. tinNumber, emailAddress).
 */
const pick = (form: Record<string, any>, camelCase: string, screamingCase: string) =>
  form[camelCase] ?? form[screamingCase];

/**
 * Throws an error with a descriptive message if validation fails
 */
export const enforceValidation = (form: Record<string, any>) => {
  if (pick(form, "tinNumber", "TIN_NUMBER") && !validateTin(pick(form, "tinNumber", "TIN_NUMBER"))) {
    throw new Error("TIN Number must be exactly 9 digits.");
  }

  if (pick(form, "email", "EMAIL") && !validateEmail(pick(form, "email", "EMAIL"))) {
    throw new Error("Invalid Email format.");
  }

  if (pick(form, "website", "WEBSITE") && !validateWebsite(pick(form, "website", "WEBSITE"))) {
    throw new Error("Website must start with http:// or https://");
  }

  if (pick(form, "contactNumber", "CONTACT_NUMBER") && !validateTanzaniaPhone(pick(form, "contactNumber", "CONTACT_NUMBER"))) {
    throw new Error("Contact Number must be in Tanzania format (e.g., +255XXXXXXXXX).");
  }

  return true;
};

/**
 * Validates store-specific fields (email addresses)
 */
export const enforceStoreValidation = (form: Record<string, any>) => {
  if (pick(form, "emailAddress", "EMAIL_ADDRESS") && !validateEmail(pick(form, "emailAddress", "EMAIL_ADDRESS"))) {
    throw new Error("Email Address is invalid.");
  }

  if (pick(form, "ccEmailAddress", "CC_EMAIL_ADDRESS") && !validateEmail(pick(form, "ccEmailAddress", "CC_EMAIL_ADDRESS"))) {
    throw new Error("CC Email Address is invalid.");
  }

  if (pick(form, "bccEmailAddress", "BCC_EMAIL_ADDRESS") && !validateEmail(pick(form, "bccEmailAddress", "BCC_EMAIL_ADDRESS"))) {
    throw new Error("BCC Email Address is invalid.");
  }

  return true;
};

/**
 * Validates supplier-specific fields
 */
export const enforceSupplierValidation = (form: Record<string, any>) => {
  if (pick(form, "tinNumber", "TIN_NUMBER") && !validateTin(pick(form, "tinNumber", "TIN_NUMBER"))) {
    throw new Error("TIN Number must be exactly 9 digits.");
  }

  if (pick(form, "mailId", "MAIL_ID") && !validateEmail(pick(form, "mailId", "MAIL_ID"))) {
    throw new Error("Invalid Email format.");
  }

  if (pick(form, "phoneNumber", "PHONE_NUMBER") && !validateTanzaniaPhone(pick(form, "phoneNumber", "PHONE_NUMBER"))) {
    throw new Error("Phone Number must be in Tanzania format (e.g., +255XXXXXXXXX).");
  }

  return true;
};

/**
 * Validates customer-specific fields
 */
export const enforceCustomerValidation = (form: Record<string, any>) => {
  if (pick(form, "tinNumber", "TIN_NUMBER") && !validateTin(pick(form, "tinNumber", "TIN_NUMBER"))) {
    throw new Error("TIN Number must be exactly 9 digits.");
  }

  if (pick(form, "emailAddress", "EMAIL_ADDRESS") && !validateEmail(pick(form, "emailAddress", "EMAIL_ADDRESS"))) {
    throw new Error("Invalid Email format.");
  }

  if (pick(form, "contactNumber", "CONTACT_NUMBER") && !validateTanzaniaPhone(pick(form, "contactNumber", "CONTACT_NUMBER"))) {
    throw new Error("Contact Number must be in Tanzania format (e.g., +255XXXXXXXXX).");
  }

  if (pick(form, "phoneNumber2", "PHONE_NUMBER_2") && !validateTanzaniaPhone(pick(form, "phoneNumber2", "PHONE_NUMBER_2"))) {
    throw new Error("Phone Number 2 must be in Tanzania format (e.g., +255XXXXXXXXX).");
  }

  return true;
};

/**
 * Sanitizer for controlled number inputs: rejects negative values outright.
 * Typing a minus or a negative number clears the field to "" so a negative can
 * never be entered. Empty strings are preserved, valid non-negative numbers
 * (including decimals) pass through unchanged.
 */
export const clampNonNegative = (raw: string): string => {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  const num = Number(trimmed);
  if (Number.isNaN(num)) return raw;
  if (num < 0) return "";
  return raw;
};

/**
 * True when a numeric value is present and greater than zero.
 * Empty values pass (use `required` on the field to enforce presence).
 */
export const validatePositiveNumber = (value: string | number | undefined): boolean => {
  if (value === undefined || value === null || value === "") return true;
  const n = Number(value);
  return !isNaN(n) && n > 0;
};

/**
 * True when a numeric value is zero or greater. Empty values pass.
 */
export const validateNonNegativeNumber = (value: string | number | undefined): boolean => {
  if (value === undefined || value === null || value === "") return true;
  const n = Number(value);
  return !isNaN(n) && n >= 0;
};

/**
 * True when a numeric value does not exceed the given maximum.
 * Empty values pass (use `required` to enforce presence).
 */
export const validateMaxAmount = (value: string | number | undefined, max: string | number | undefined): boolean => {
  if (value === undefined || value === null || value === "") return true;
  if (max === undefined || max === null || max === "") return true;
  const n = Number(value);
  const m = Number(max);
  return !isNaN(n) && !isNaN(m) && n <= m;
};

/**
 * True when the "to" date is not before the "from" date.
 * Empty dates pass (use `required` on the fields to enforce presence).
 */
export const validateDateRange = (from: string | undefined, to: string | undefined): boolean => {
  if (!from || !to) return true;
  const f = new Date(from).getTime();
  const t = new Date(to).getTime();
  if (isNaN(f) || isNaN(t)) return true;
  return t >= f;
};

/**
 * True when a numeric value is a whole number of 1 or more.
 * Empty values pass (use `required` on the field to enforce presence).
 */
export const validatePositiveInteger = (value: string | number | undefined): boolean => {
  if (value === undefined || value === null || value === "") return true;
  const n = Number(value);
  return !isNaN(n) && Number.isInteger(n) && n >= 1;
};

/**
 * True when a numeric value is a whole number of 0 or more.
 * Empty values pass (use `required` on the field to enforce presence).
 */
export const validateNonNegativeInteger = (value: string | number | undefined): boolean => {
  if (value === undefined || value === null || value === "") return true;
  const n = Number(value);
  return !isNaN(n) && Number.isInteger(n) && n >= 0;
};

/**
 * Validates employee-specific fields
 */
export const enforceEmployeeValidation = (form: Record<string, any>) => {
  if (pick(form, "email", "EMAIL") && !validateEmail(pick(form, "email", "EMAIL"))) {
    throw new Error("Invalid Email format.");
  }

  if (pick(form, "phone", "PHONE") && !validateTanzaniaPhone(pick(form, "phone", "PHONE"))) {
    throw new Error("Phone must be in Tanzania format (e.g., +255XXXXXXXXX).");
  }

  return true;
};
