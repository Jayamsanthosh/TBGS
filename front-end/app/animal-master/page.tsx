"use client";

import { useMemo, useEffect } from "react";
import MasterCrudPage, { type MasterField } from "@/components/MasterCrudPage";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchAnimals, addAnimal, updateAnimal, deleteAnimal, clearAnimalError, AnimalGridData } from "@/lib/animalMasterSlice";
import { useApiQuery } from "@/lib/reduxQuery";
import { API_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const baseFields: MasterField[] = [
  {
    key: "ANIMAL_NAME",
    label: "Animal Name",
    type: "text",
    required: true,
    placeholder: "e.g., Lion"
  },
  {
    key: "ANIMAL_CATEGORY_ID",
    label: "Animal Category",
    type: "searchable",
    placeholder: "Select animal category",
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
  { key: "ANIMAL_NAME", label: "Animal Name" },
  { key: "ANIMAL_CATEGORY_NAME", label: "Category" },
  { key: "REMARKS", label: "Remarks" },
  {
    key: "STATUS_MASTER",
    label: "Status",
    render: (val: any) => {
      const sv = String(val || "").toLowerCase();
      const colorClass = sv === "active"
        ? "bg-green-500/10 text-green-600 border-green-200"
        : "bg-red-500/10 text-red-600 border-red-200";
      return (
        <Badge variant="outline" className={`${colorClass} px-2 py-0.5 text-[10px] uppercase font-bold`}>
          {sv === "active" ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
];

export default function AnimalMasterPage() {
  const dispatch = useAppDispatch();
  const { animals, loading, error } = useAppSelector((s) => s.animals);
  const { toast } = useToast();

  const { data: categories } = useApiQuery("animal-master-category-list", async () => {
    const res = await fetch(`${API_URL}/animal-category-master`);
    if (!res.ok) throw new Error("Failed to fetch animal categories");
    const json = await res.json();
    return (json.data || []).map((u: any) => ({ ...u, id: u.ANIMAL_CATEGORY_ID }));
  });

  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.map((c: any) => ({
      value: String(c.ANIMAL_CATEGORY_ID),
      label: c.ANIMAL_CATEGORY_NAME || `Category #${c.ANIMAL_CATEGORY_ID}`,
    }));
  }, [categories]);

  const fields: MasterField[] = useMemo(() => {
    return baseFields.map((f) =>
      f.key === "ANIMAL_CATEGORY_ID" ? { ...f, options: categoryOptions } : f
    );
  }, [categoryOptions]);

  useEffect(() => {
    dispatch(fetchAnimals());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearAnimalError());
    }
  }, [error, dispatch, toast]);

  const storeOverrides = useMemo(() => ({
    data: animals,
    isLoading: loading,
    add: async (item: AnimalGridData) => {
      const res = await dispatch(addAnimal(item)).unwrap();
      dispatch(fetchAnimals());
      return res;
    },
    update: async (item: AnimalGridData) => {
      const res = await dispatch(updateAnimal(item)).unwrap();
      dispatch(fetchAnimals());
      return res;
    },
    remove: async (id: string) => {
      const res = await dispatch(deleteAnimal(id)).unwrap();
      dispatch(fetchAnimals());
      return res;
    },
    bulkRemove: async (ids: string[]) => {
      let res;
      for (const id of ids) {
        res = await dispatch(deleteAnimal(id)).unwrap();
      }
      dispatch(fetchAnimals());
      return res;
    },
  }), [animals, loading, dispatch]);

  const onBeforeEdit = async (item: Record<string, any>) => {
    const res = await fetch(`${API_URL}/animal-master/${item.id}`);
    if (!res.ok) return item;
    const json = await res.json();
    return json.data || item;
  };

  return (
    <MasterCrudPage
      title="Animal Master"
      description="Manage animal master data"
      idPrefix="ANML"
      domain="animal-master"
      fields={fields}
      columns={columns}
      initialData={[]}
      customStoreOverrides={storeOverrides}
      onBeforeEdit={onBeforeEdit}
    />
  );
}
