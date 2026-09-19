"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { changePassword, resetChangePasswordState, type ChangePasswordPayload } from "@/lib/changePasswordSlice";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector((s) => s.changePassword);
  const authUser = useAppSelector((s) => s.auth.user);
  const { toast } = useToast();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      dispatch(resetChangePasswordState());
    }
    if (success) {
      toast({ title: "Success", description: "Password changed successfully" });
      dispatch(resetChangePasswordState());
      onOpenChange(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [error, success, dispatch, toast, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }

    if (oldPassword === newPassword) {
      toast({ title: "New password must be different from current password", variant: "destructive" });
      return;
    }

    const payload: ChangePasswordPayload = {
      LOGIN_ID: Number(authUser?.LOGIN_ID || authUser?.id || 0),
      USER_NAME: authUser?.loginName || "",
      OLD_PASSWORD: oldPassword,
      NEW_PASSWORD: newPassword,
      REASON: "Password Change",
      STATUS_MASTER: "AC",
      USER: authUser?.loginName || "Admin",
      MAC_ADDRESS: "WEB",
    };

    dispatch(changePassword(payload));
  };

  const handleOpenChange = (val: boolean) => {
    if (!loading) {
      onOpenChange(val);
      if (!val) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        dispatch(resetChangePasswordState());
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs">Current Password</Label>
            <div className="relative">
              <Input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-9 text-xs pr-9"
                disabled={loading}
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-9 text-xs pr-9"
                disabled={loading}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-9 text-xs pr-9"
                disabled={loading}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="text-xs">
              {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
              Change Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
