"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchProductSubCategories, addProductSubCategory, updateProductSubCategory, deleteProductSubCategory, clearProductSubCategoryError, ProductSubCategoryGridData } from "@/lib/productSubCategoryMasterSlice";
import { fetchProductMainCategories } from "@/lib/productMainCategoryMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "SUB_CATEGORY_NAME",
    label: "Sub Category Name",
    type: "text",
    required: true,
    placeholder: "e.g., Cheese"
  },
  {
    key: "MAIN_CATEGORY_ID",
    label: "Main Category",
    type: "select",
    required: true,
    options: [],
  },
  {
    key: "REMARKS",
    label: "Remarks",
    type: "textarea",
    placeholder: "Additional notes..."
  },
  {
    key: "STATUS_MASTER",
    label: "Status",
    type: "select",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" }
    ],
    defaultValue: "ACTIVE",
    formatter: (val: any) => {
      const s = String(val || "").toLowerCase();
      if (s === "ac") return "ACTIVE";
      if (s === "in") return "INACTIVE";
      return val;
    },
  },
];

const columns = [
  { key: "SUB_CATEGORY_NAME", label: "Sub Category Name" },
  { key: "MAIN_CATEGORY_NAME", label: "Main Category" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any) => {
      const sv = String(val || "").toLowerCase();
      const isActive = sv === "active" || sv === "ac";
      const isInactive = sv === "inactive" || sv === "in";
      const colorClass = isActive
        ? "bg-green-500/10 text-green-600 border-green-200"
        : isInactive
          ? "bg-red-500/10 text-red-600 border-red-200"
          : "bg-blue-500/10 text-blue-600 border-blue-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {isActive ? "Active" : isInactive ? "Inactive" : val}
        </Badge>
      );
    },
  },
];

export default function ProductSubCategoryPage() {
  const dispatch = useAppDispatch();
  const { subCategories, loading, error } = useAppSelector((s) => s.productSubCategory);
  const { categories: mainCategories } = useAppSelector((s) => s.productMainCategory);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchProductSubCategories());
    dispatch(fetchProductMainCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearProductSubCategoryError());
    }
  }, [error, dispatch, toast]);

  const mainCategoryOptions = useMemo(() => {
    if (!Array.isArray(mainCategories)) return [];
    return mainCategories.map((c: any) => ({
      value: String(c.MAIN_CATEGORY_ID),
      label: c.MAIN_CATEGORY_NAME || `ID: ${c.MAIN_CATEGORY_ID}`,
    }));
  }, [mainCategories]);

  const fieldsWithOptions: MasterField[] = useMemo(() => {
    return fields.map((f) => {
      if (f.key === "MAIN_CATEGORY_ID") {
        return { ...f, options: mainCategoryOptions };
      }
      return f;
    });
  }, [mainCategoryOptions]);

  const enrichedData = useMemo(() => {
    if (!Array.isArray(subCategories)) return [];
    return subCategories.map((u: any) => {
      const mainCat = Array.isArray(mainCategories)
        ? mainCategories.find((c: any) => Number(c.MAIN_CATEGORY_ID) === Number(u.MAIN_CATEGORY_ID))
        : undefined;
      return {
        id: u.SUB_CATEGORY_ID,
        SUB_CATEGORY_ID: u.SUB_CATEGORY_ID,
        SUB_CATEGORY_NAME: u.SUB_CATEGORY_NAME,
        MAIN_CATEGORY_ID: String(u.MAIN_CATEGORY_ID),
        REMARKS: u.REMARKS,
        STATUS_MASTER: u.STATUS_MASTER,
        MAIN_CATEGORY_NAME: mainCat?.MAIN_CATEGORY_NAME || `ID: ${u.MAIN_CATEGORY_ID}`,
      };
    });
  }, [subCategories, mainCategories]);

  const storeOverrides = useMemo(() => ({
    data: enrichedData,
    isLoading: loading,
    add: async (item: ProductSubCategoryGridData) => {
      const res = await dispatch(addProductSubCategory(item)).unwrap();
      dispatch(fetchProductSubCategories());
      return res;
    },
    update: async (item: ProductSubCategoryGridData) => {
      const res = await dispatch(updateProductSubCategory(item)).unwrap();
      dispatch(fetchProductSubCategories());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteProductSubCategory(id)).unwrap();
      dispatch(fetchProductSubCategories());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteProductSubCategory(id)).unwrap();
      }
      dispatch(fetchProductSubCategories());
      return res;
    },
  }), [enrichedData, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Product Sub Category"
      description="Manage product sub category master data"
      idPrefix="PSC"
      domain="product-sub-category"
      fields={fieldsWithOptions}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
