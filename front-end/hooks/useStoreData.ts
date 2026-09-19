"use client";

import { useMasterData } from "./useMasterData";

const INITIAL_PRODUCTS = [
  { id: 1, productName: "White Maize – Grade A", commonName: "Mahindi Meupe", mainCategory: "Grains", subCategory: "Maize", uom: "Bag", status: "Active" },
  { id: 2, productName: "Pishori Rice – Grade 1", commonName: "Mchele wa Pishori", mainCategory: "Grains", subCategory: "Rice", uom: "Bag", status: "Active" },
];

export function useProducts() {
  return useMasterData("products", INITIAL_PRODUCTS, "PRD");
}

const INITIAL_SUPPLIERS = [
  { id: 1, supplierName: "Kilimo Bora Suppliers", contactPerson: "John Doe", phone: "+255 712 345678", email: "info@kilimobora.co.tz", status: "Active" },
  { id: 2, supplierName: "Tanzania Agro Trading", contactPerson: "Jane Smith", phone: "+255 754 876543", email: "trading@tanzaniagro.tz", status: "Active" },
];

export function useSuppliers() {
  return useMasterData("suppliers", INITIAL_SUPPLIERS, "SPL");
}

// Transactional Entities - Connect to hyphenated API routes
export function usePurchaseOrders() {
  return useMasterData("purchase-orders", [], "PO");
}

export function useSalesOrders() {
  return useMasterData("sales-orders", [], "SO");
}

export function useExpenses() {
  return useMasterData("expenses", [], "EXP");
}

export function useGoodsReceipts() {
  return useMasterData("goods-receipts", [], "GRN");
}

export function useSupplierInvoices() {
  return useMasterData("supplier-invoices", [], "INV");
}

export function useCustomerReceipts() {
  return useMasterData("customer-receipts", [], "RCP");
}

export function useDeliveryNotes() {
  return useMasterData("delivery-notes", [], "DN");
}

export function useTaxInvoices() {
  return useMasterData("tax-invoices", [], "TI");
}

export function useCompanies() {
  return useMasterData("product-company-category-mappings", [
    { id: 1, companyName: "AgroManage Tanzania Ltd", status: "Active" }
  ], "CMP");
}

export function useCustomers() {
  return useMasterData("customers", [
    { id: 1, CUSTOMER_NAME: "Metro Foods Inc", status: "Active" },
    { id: 2, CUSTOMER_NAME: "Global Grain Ltd", status: "Active" }
  ], "CST");
}

export function useStores() {
  return useMasterData("user-store-mappings", [
    { id: 1, storeName: "Main Warehouse", status: "Active", storeIdUserToRole: 1, userName: "Admin" },
    { id: 2, storeName: "Zanzibar Hub", status: "Active", storeIdUserToRole: 2, userName: "Manager" }
  ], "STR");
}

export function useSalesPersons() {
  return useMasterData("sales-persons", [
    { id: 1, salesPersonName: "James Kileo" },
    { id: 2, salesPersonName: "Hassan Juma" }
  ], "SP");
}

export function useCurrencies() {
  return useMasterData("currencies", [
    { id: 1, CURRENCY_NAME: "TZS" },
    { id: 2, CURRENCY_NAME: "USD" }
  ], "CUR");
}

export function usePaymentTerms() {
  return useMasterData("payment-terms", [
    { id: 1, paymentTermName: "Net 30" },
    { id: 2, paymentTermName: "CIA" }
  ], "PT");
}

export function useUoms() {
  return useMasterData("uoms", [
    { id: 1, UNIT_NAME: "Bag" },
    { id: 2, UNIT_NAME: "KG" },
    { id: 3, UNIT_NAME: "MT" },
    { id: 4, UNIT_NAME: "Litre" },
    { id: 5, UNIT_NAME: "Carton" },
    { id: 6, UNIT_NAME: "Pack" }
  ], "UOM");
}

export function useBillingLocations() {
  return useMasterData("billing-locations", [], "BLOC");
}

