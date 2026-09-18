"use client";

import { useMemo, useEffect, useCallback } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchCustomerWiseTripTemplatePriceMapping,
  addCustomerWiseTripTemplatePriceMapping,
  updateCustomerWiseTripTemplatePriceMapping,
  deleteCustomerWiseTripTemplatePriceMapping,
  clearCustomerWiseTripTemplatePriceMappingError,
  type CustomerWiseTripTemplatePriceMappingGridData,
} from "@/lib/customerWiseTripTemplatePriceMappingSlice";
import { fetchTripTemplates } from "@/lib/tripTemplateMasterSlice";
import { fetchTruckTypes } from "@/lib/truckTypeMasterSlice";
import { fetchCompanies } from "@/lib/companyMasterSlice";
import { fetchCurrencies } from "@/lib/currencyMasterSlice";
import { fetchBusinessPartners } from "@/lib/businessPartnerMasterSlice";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const statusLabel = (s: any) => {
  const v = String(s).toUpperCase();
  if (v === "AC" || v === "ACTIVE") return "Active";
  return "Inactive";
};

const statusBadgeClass = (s: any) => {
  const v = String(s).toUpperCase();
  return v === "AC" || v === "ACTIVE"
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-red-500/10 text-red-600 border-red-200";
};

export default function CustomerWiseTripTemplatePriceMappingPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.customerWiseTripTemplatePriceMapping);
  const tripTemplates = useAppSelector((s) => s.tripTemplate.tripTemplates);
  const truckTypes = useAppSelector((s) => s.truckType.truckTypes);
  const companies = useAppSelector((s) => s.company.companies);
  const currencies = useAppSelector((s) => s.currencies.currencies);
  const businessPartners = useAppSelector((s) => s.businessPartner.businessPartners);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchCustomerWiseTripTemplatePriceMapping("AC"));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchTripTemplates(undefined));
    dispatch(fetchTruckTypes("ALL"));
    dispatch(fetchCompanies());
    dispatch(fetchCurrencies());
    dispatch(fetchBusinessPartners("ALL"));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error });
      dispatch(clearCustomerWiseTripTemplatePriceMappingError());
    }
  }, [error, dispatch, toast]);

  const tripTemplateOptions = useMemo(
    () =>
      (Array.isArray(tripTemplates) ? tripTemplates : [])
        .filter((x: any) => x?.TRIP_TEMPLATE_ID != null)
        .map((x: any) => ({ value: String(x.TRIP_TEMPLATE_ID), label: x.TRIP_TEMPLATE_NAME })),
    [tripTemplates]
  );

  const companyOptions = useMemo(
    () =>
      (Array.isArray(companies) ? companies : [])
        .filter((x: any) => x?.COMPANY_ID != null)
        .map((x: any) => ({ value: String(x.COMPANY_ID), label: x.COMPANY_NAME })),
    [companies]
  );

  const businessPartnerOptions = useMemo(
    () =>
      (Array.isArray(businessPartners) ? businessPartners : [])
        .filter((x: any) => x?.BP_ID != null)
        .map((x: any) => ({ value: String(x.BP_ID), label: x.BP_NAME })),
    [businessPartners]
  );

  const truckTypeOptions = useMemo(
    () =>
      (Array.isArray(truckTypes) ? truckTypes : [])
        .filter((x: any) => x?.TRUCK_TYPE_ID != null)
        .map((x: any) => ({ value: String(x.TRUCK_TYPE_ID), label: x.TRUCK_TYPE_NAME })),
    [truckTypes]
  );

  const currencyOptions = useMemo(
    () =>
      (Array.isArray(currencies) ? currencies : [])
        .filter((x: any) => x?.CURRENCY_ID != null)
        .map((x: any) => ({ value: String(x.CURRENCY_ID), label: x.CURRENCY_NAME })),
    [currencies]
  );

  const columns = useMemo(
    () => [
      { key: "COMPANY_NAME", label: "Company" },
      { key: "BP_NAME", label: "Business Partner" },
      { key: "TRIP_TEMPLATE_NAME", label: "Trip Template" },
      { key: "TRUCK_TYPE_NAME", label: "Truck Type" },
      { key: "TRIP_AMOUNT", label: "Trip Amount" },
      { key: "CURRENCY_NAME", label: "Currency" },
      { key: "REMARKS", label: "Remarks" },
      {
        key: "STATUS_MASTER",
        label: "Status",
        render: (val: any) => (
          <Badge variant="outline" className={`${statusBadgeClass(val)} px-2 py-0.5 text-[10px] uppercase font-bold`}>
            {statusLabel(val)}
          </Badge>
        ),
      },
    ],
    []
  );

  const fields = useMemo<MasterField[]>(
    () => [
      { key: "COMPANY_ID", label: "Company", type: "select", options: companyOptions, required: true, placeholder: "Select company" },
      { key: "BP_ID", label: "Business Partner", type: "select", options: businessPartnerOptions, required: true, placeholder: "Select business partner" },
      { key: "TRIP_TEMPLATE_ID", label: "Trip Template", type: "select", options: tripTemplateOptions, required: true, placeholder: "Select trip template" },
      { key: "TRUCK_TYPE_ID", label: "Truck Type", type: "select", options: truckTypeOptions, required: true, placeholder: "Select truck type" },
      { key: "TRIP_AMOUNT", label: "Trip Amount", type: "number", placeholder: "e.g., 5000.00" },
      { key: "CURRENCY_ID", label: "Currency", type: "select", options: currencyOptions, placeholder: "Select currency" },
      { key: "REMARKS", label: "Remarks", type: "textarea", placeholder: "Enter any remarks" },
      {
        key: "STATUS_MASTER",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "AC" },
          { label: "Inactive", value: "IN" },
        ],
        defaultValue: "AC",
      },
    ],
    [companyOptions, businessPartnerOptions, tripTemplateOptions, truckTypeOptions, currencyOptions]
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      dispatch(fetchCustomerWiseTripTemplatePriceMapping(value || "AC"));
    },
    [dispatch]
  );

  const storeOverrides = useMemo(
    () => ({
      data: items,
      isLoading: loading,
      add: async (item: CustomerWiseTripTemplatePriceMappingGridData) => {
        const res = await dispatch(addCustomerWiseTripTemplatePriceMapping(item)).unwrap();
        dispatch(fetchCustomerWiseTripTemplatePriceMapping("AC"));
        return res;
      },
      update: async (item: CustomerWiseTripTemplatePriceMappingGridData) => {
        const res = await dispatch(updateCustomerWiseTripTemplatePriceMapping(item)).unwrap();
        dispatch(fetchCustomerWiseTripTemplatePriceMapping("AC"));
        return res;
      },
      remove: async (id: string) => {
        const res = await dispatch(deleteCustomerWiseTripTemplatePriceMapping(id)).unwrap();
        dispatch(fetchCustomerWiseTripTemplatePriceMapping("AC"));
        return res;
      },
      bulkRemove: async (ids: string[]) => {
        let res;
        for (const id of ids) {
          res = await dispatch(deleteCustomerWiseTripTemplatePriceMapping(id)).unwrap();
        }
        dispatch(fetchCustomerWiseTripTemplatePriceMapping("AC"));
        return res;
      },
    }),
    [items, loading, dispatch]
  );

  return (
    <MasterCrudPage
      title="Customer Wise Trip Template Price Mapping"
      description="Manage customer wise trip template price mapping data"
      idPrefix="PRICECUST"
      domain="customer-wise-trip-template-price-mapping"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      statusOptions={[
        { label: "Active", value: "AC" },
        { label: "Inactive", value: "IN" },
      ]}
      onStatusFilterChange={handleStatusFilterChange}
    />
  );
}
