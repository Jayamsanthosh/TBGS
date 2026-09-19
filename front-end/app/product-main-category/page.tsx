"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchProductMainCategories, addProductMainCategory, updateProductMainCategory, deleteProductMainCategory, clearProductMainCategoryError, ProductMainCategoryGridData } from "@/lib/productMainCategoryMasterSlice";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const fields: MasterField[] = [
  {
    key: "MAIN_CATEGORY_NAME",
    label: "Main Category Name",
    type: "text",
    required: true,
    placeholder: "e.g., Dairy Products"
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
  { key: "MAIN_CATEGORY_NAME", label: "Main Category Name" },
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

export default function ProductMainCategoryPage() {
  const dispatch = useAppDispatch();
  const { categories, loading, error } = useAppSelector((s) => s.productMainCategory);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchProductMainCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearProductMainCategoryError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: categories,
    isLoading: loading,
    add: async (item: ProductMainCategoryGridData) => {
      const res = await dispatch(addProductMainCategory(item)).unwrap();
      dispatch(fetchProductMainCategories());
      return res;
    },
    update: async (item: ProductMainCategoryGridData) => {
      const res = await dispatch(updateProductMainCategory(item)).unwrap();
      dispatch(fetchProductMainCategories());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteProductMainCategory(id)).unwrap();
      dispatch(fetchProductMainCategories());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteProductMainCategory(id)).unwrap();
      }
      dispatch(fetchProductMainCategories());
      return res;
    },
  }), [categories, loading, dispatch]);

  return (
    <MasterCrudPage
      title="Product Main Category"
      description="Manage product main category master data"
      idPrefix="PMC"
      domain="product-main-category"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
    />
  );
}
